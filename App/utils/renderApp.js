function renderApp() {
  const app = document.body;
  const { Header, Menu, Main } = MyApp.toRender;

  app.innerHTML = `

    ${Header()}
    ${Menu()}
    ${Main()}
    
  `;

  // можно инициализировать события тут
  initNavigation(); // например, из functions.js
  MyApp.router.navigate(MyApp.state.currentSection);
}