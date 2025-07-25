MyApp.router = {
  routes: {
    home: function () {
      MyApp.pages.home.render();
    }, 
    settings: function () {
      MyApp.pages.settings.render();
    }
  },

  navigate: function (section) {
    const container = document.getElementById('content-area');
    container.innerHTML = '';
    const handler = MyApp.router.routes[section];
    if (handler) {
      handler();
    } else {
      container.innerHTML = '<h2>404</h2><p>Раздел не найден</p>';
    }
    MyApp.state.currentSection = section;
  }
};