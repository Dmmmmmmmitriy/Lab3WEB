const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const app = express();
const port = 8888; // при необходимости смените порт

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Настройки подключения к БД (замените на свои данные сервера)
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "web_form",
};

// Валидационные функции
function validateFullName(name) {
  if (!name || name.trim() === "") return "ФИО не может быть пустым";
  if (name.length > 150) return "ФИО не должно превышать 150 символов";
  if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/u.test(name)) {
    return "ФИО должно содержать только буквы, пробелы и дефисы";
  }
  return null;
}

function validatePhone(phone) {
  if (!phone) return "Телефон не может быть пустым";
  if (!/^[\d\s+()-]{5,20}$/.test(phone)) return "Некорректный телефон";
  return null;
}

function validateEmail(email) {
  if (!email) return "Email не может быть пустым";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Некорректный email";
  return null;
}

function validateBirthDate(dateStr) {
  if (!dateStr) return "Дата рождения не может быть пустой";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Некорректная дата";
  if (date > new Date()) return "Дата не может быть в будущем";
  return null;
}

function validateGender(gender) {
  const allowed = ["male", "female"];
  if (!gender || !allowed.includes(gender)) return "Некорректный пол";
  return null;
}

function validateLanguages(langs) {
  const allowed = [
    "Pascal",
    "C",
    "C++",
    "JavaScript",
    "PHP",
    "Python",
    "Java",
    "Haskel",
    "Clojure",
    "Prolog",
    "Scala",
    "Go",
  ];
  if (!langs || langs.length === 0) return "Выберите хотя бы один язык";
  for (let lang of langs) {
    if (!allowed.includes(lang)) return `Недопустимый язык: ${lang}`;
  }
  return null;
}

function validateBiography(bio) {
  if (bio && bio.length > 5000) return "Биография слишком длинная";
  return null;
}

function validateContract(contract) {
  if (!contract || (contract !== "1" && contract !== true))
    return "Необходимо отметить чекбокс";
  return null;
}

// Эндпоинт для отправки формы
app.post("/submit", async (req, res) => {
  const data = req.body;
  const errors = [];

  // Валидация
  const nameErr = validateFullName(data.full_name);
  if (nameErr) errors.push(nameErr);
  const phoneErr = validatePhone(data.phone);
  if (phoneErr) errors.push(phoneErr);
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.push(emailErr);
  const birthErr = validateBirthDate(data.birth_date);
  if (birthErr) errors.push(birthErr);
  const genderErr = validateGender(data.gender);
  if (genderErr) errors.push(genderErr);
  const langErr = validateLanguages(data.languages);
  if (langErr) errors.push(langErr);
  const bioErr = validateBiography(data.biography);
  if (bioErr) errors.push(bioErr);
  const contractErr = validateContract(data.contract);
  if (contractErr) errors.push(contractErr);

  if (errors.length > 0) {
    return res.json({ success: false, errors });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Вставка основной записи
    const [result] = await connection.execute(
      `INSERT INTO submissions (full_name, phone, email, birth_date, gender, biography, contract_accepted)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.full_name,
        data.phone,
        data.email,
        data.birth_date,
        data.gender,
        data.biography || null,
        data.contract ? 1 : 0,
      ],
    );

    // Вставка языков
    for (let lang of data.languages) {
      await connection.execute(
        "INSERT INTO submission_languages (submission_id, language) VALUES (?, ?)",
        [result.insertId, lang],
      );
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.json({
      success: false,
      errors: ["Ошибка базы данных, попробуйте позже."],
    });
  } finally {
    if (connection) await connection.end();
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
