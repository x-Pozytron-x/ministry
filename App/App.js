(function() {

  window.MyApp = {
    state: {
      currentSection: 'home',
      isLoading: false,
    },
    data: {},
    toRender: {},

    load: {
      modules: [
        'core',
        'router'
      ],
      components: [
        'Header',
        'Menu',
        'Main',
      ],
      utils: [
        'renderApp',
        'navigate'
      ],
      pages: [
        'home',
        'settings'
      ],
    },

    pages: {},

    config: {
      basePath: 'App/',
      styles: 'assets/css/styles',
      appName: 'SafeData',
      version: '1.2.1'
    },

    init: function () {
      if (typeof renderApp === 'function') { renderApp(); } 
      else { console.error('renderApp не найден!'); }
    } 

  };

  const scriptsLoader = document.createElement('script');
  scriptsLoader.src = MyApp.config.basePath + 'Loader.js';
  document.head.appendChild(scriptsLoader);
})();