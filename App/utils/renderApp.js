function renderApp() {
  const app = document.body;
  const { Header, Menu } = MyApp.toRender;

  app.innerHTML = `

    ${Header()}
    ${Menu()}
    <main class="main">
      <div id="content-area"></div>
    </main>
    
  `;

  // можно инициализировать события тут
  //initNavigation(); // например, из functions.js
}