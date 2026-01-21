//--- Header.js ---//
MyApp.toRender = MyApp.toRender || {};
MyApp.toRender.Header = function () {
  addStyleComponent('Header');

  const headerTitle = newdb.select('tbl_settings', 'congregationName');

  return `
    <header class="block header">
      <div class='header__logo'>
        <img class="" src="App/assets/img/logotype.png">
        <span>${MyApp.config.version}</span>
      </div>
      <h1 class='header__title'>${(headerTitle) ? headerTitle : 'Please, load DB'}</h1>
      <button class='header__btn' id="db_load" onclick="loadDB()">Load</button>
      <button class='header__btn' id="db_save" onclick="saveDB()">Save</button>
      <button class='header__btn' onclick="localStorage.clear()">Clear</button>  
    </header>
  `;
};