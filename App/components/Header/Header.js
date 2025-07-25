//--- Header.js ---//

(() => {
  const _component = document.createElement('header');
  _component.classList.add("block");
  _component.classList.add("header");
  App.appendChild(_component);

  _component.innerHTML = `
    <div class='header__logo'><img class="" src="App/assets/img/logotype.png"></div>
    <h1 class='header__title'>Please, load DB -></h1>
    <button class='header__btn' id="db_load">Load DB</button>
    <button class='header__btn' id="db_save">Save DB</button>
  `;
})();