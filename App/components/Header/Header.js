//--- Header.js ---//
MyApp.toRender = MyApp.toRender || {};
MyApp.toRender.Header = function () {
  return `
    <header class="block header">
      <div class='header__logo'>
        <img class="" src="App/assets/img/logotype.png">
        <span>${MyApp.config.version}</span>
      </div>
      <h1 class='header__title'>Please, load DB -></h1>
      <button class='header__btn' id="db_load">Load DB</button>
      <button class='header__btn' id="db_save">Save DB</button>
    </header>
  `;
};