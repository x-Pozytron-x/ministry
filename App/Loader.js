(function () {
  // --- STYLES --- //
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = MyApp.config.basePath + MyApp.config.styles + '.css';
  document.head.appendChild(link);

  // --- SCRIPTS --- //
  const loadGroups = MyApp.load;
  let scriptsToLoad = 0;
  let scriptsLoaded = 0;
  for (let group in loadGroups) { scriptsToLoad += loadGroups[group].length; }
  function onScriptLoad() {
    //console.log('toLoad - ' + scriptsToLoad + '; Loaded: ' + scriptsLoaded);
    scriptsLoaded++;
    
    if (scriptsLoaded === scriptsToLoad) MyApp.init();
  }
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
      
      script.onerror = () => console.error('Load Error:', url);
      document.body.appendChild(script);
    }
  }
})();
