//--- Header.js ---//
MyApp.toRender = MyApp.toRender || {};
MyApp.toRender.Header = function () {
  addStyleComponent('Header');
  return `
    <header class="block header">
      <div class='header__logo'>
        <img class="" src="App/assets/img/logotype.png">
        <span>${MyApp.config.version}</span>
      </div>
      <h1 class='header__title'>Please, load DB -></h1>
      <button class='header__btn' id="db_load" onclick="loadDB()">Load DB</button>
      <button class='header__btn' id="db_save" onclick="saveDB()">Save DB</button>
    </header>
  `;

  
 // document.getElementById('db_load').addEventListener('click', loadDB);
 // document.getElementById('db_save').addEventListener('click', saveDB);
};