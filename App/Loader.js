(function () {
  // --- STYLES --- //
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) return resolve();

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`Ошибка загрузки CSS: ${href}`));
      document.head.appendChild(link);
    });
  }
  loadCSS('App/assets/css/styles.css');


  const loadGroups = MyApp.load;
  let scriptsToLoad = 0;
  let scriptsLoaded = 0;
  for (let group in loadGroups) { scriptsToLoad += loadGroups[group].length; }
  function onScriptLoad() {
    scriptsLoaded++;
    if (scriptsLoaded === scriptsToLoad) MyApp.init(); 
  }


  // --- SCRIPTS --- //
  for (path in MyApp.load) {
    for (const file in MyApp.load[path]) {
      if (path == "components") {
        url = MyApp.config.basePath + path + "/" + MyApp.load[path][file] + "/" + MyApp.load[path][file] +".js";
      } else {
        url = MyApp.config.basePath + path + "/" + MyApp.load[path][file] + ".js";
      }
      const script = document.createElement('script');
      script.src = url;
      script.onload = onScriptLoad;
      script.onerror = () => console.error('Ошибка загрузки:', url);
      document.head.appendChild(script);
    }
  }


})();
