//--- Main.js ---//

await loadScripts([
  'App/pages/home.js',
  //'App/pages/publishers.js',
  //'App/pages/reports.js',
  'App/pages/settings.js',
  //'App/pages/s88.js'
]);

(() => {
  const _component = document.createElement('main');
  _component.classList.add("block");
  _component.classList.add("main");
  _component.appendChild(home());
  App.appendChild(_component);

  
  // _component.innerHTML = `
  //   <h2>Content</h2>
  // `;
})();