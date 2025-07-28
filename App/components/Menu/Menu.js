//--- Menu.js ---//
addStyleComponent('Menu');

MyApp.toRender = MyApp.toRender || {};
MyApp.toRender.Menu = function () {
  return `
    <aside class="block menu">
      <nav>
        ${renderMenu(MyApp.menuItems)}
      </nav>
    </aside>
  `;
};

function renderMenu(arr) {
  let active;
  return arr.map(item => {
    if (item.link == MyApp.state.currentSection) {
      active = " active";
    } else {active = "";}
    return ` <button class="menu__item${active}" data-section="${item.link}" >${item.text}</button> `
  }).join('');
}