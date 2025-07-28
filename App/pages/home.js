// App/pages/home.js
MyApp.pages.home = {
  render: function () {
    const container = document.getElementById('content-area');
    container.innerHTML = `
      <h2>Главная</h2>
      <p>Добро пожаловать!</p><br>
      <p>Приложение с открытым исходным кодом, которое не хранит на  сервере никакой информации и данных.</p>
      `;
  }
};
