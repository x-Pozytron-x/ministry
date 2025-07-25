(function() {

  window.MyApp = {
    state: {},
    data: {},
    toRender: {},

    load: {
      modules: [
        'core',
      ],
      components: [
        'Header',
        'Menu',
      ],
      utils: [
        'renderApp',
      ],
      pages: [],
    },

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