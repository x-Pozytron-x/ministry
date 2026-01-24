(function () {

  window.MyApp = {
    state: {
      currentSection: 'home',
      isLoading: false,
    },
    data: {},
    toRender: {},

    load: {
      modules: [
        'functions',
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
        'publishers',
        'settings',
        's88'
      ],
    },

    pages: {},

    menuItems: [
      { link: 'home', text: 'Home' },
      { link: 'publishers', text: 'Publishers' },
      { link: 'reports', text: 'Reports' },
      { link: 's88', text: 'S-88' },
      // { link: 's21', text: 'S-21' },
      // { link: 's1', text: 'S-1' },
      { link: 'settings', text: 'Settings' }
    ],

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
  document.body.appendChild(scriptsLoader);
})();