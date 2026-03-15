// Список допустимых языков программирования
const allowedLanguages = [
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

// Заполняем контейнер чекбоксами при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("languages-container");
  allowedLanguages.forEach((lang) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="languages[]" value="${lang}"> ${lang}`;
    container.appendChild(label);
  });
});

// Обработка отправки формы
document
  .getElementById("application-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Формируем объект данных
    const data = {
      full_name: formData.get("full_name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      birth_date: formData.get("birth_date"),
      gender: formData.get("gender"),
      languages: formData.getAll("languages[]"), // массив выбранных языков
      biography: formData.get("biography"),
      contract: formData.get("contract") === "1" ? true : false,
    };

    const messageDiv = document.getElementById("message");
    messageDiv.className = "message";
    messageDiv.innerHTML = "";

    try {
      const response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        messageDiv.className = "message success";
        messageDiv.textContent = "Данные успешно сохранены!";
        e.target.reset(); // очистить форму
      } else {
        messageDiv.className = "message error";
        messageDiv.innerHTML =
          "<ul>" +
          result.errors.map((err) => `<li>${err}</li>`).join("") +
          "</ul>";
      }
    } catch (err) {
      messageDiv.className = "message error";
      messageDiv.textContent = "Ошибка соединения с сервером.";
    }
  });
