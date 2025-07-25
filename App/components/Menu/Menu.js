//--- Menu.js ---//

MyApp.toRender = MyApp.toRender || {};
MyApp.toRender.Menu = function () {
  return `
    <aside class="block menu">
      <nav>
        ${menuItemsHtml}
      </nav>
    </aside>
  `;
};

const menuItemsHtml = [
  { link: 'home', text: 'Home' },
  { link: 'publishers', text: 'Publishers' },
  { link: 'reports', text: 'Reports' },
  { link: 's88', text: 'S-88' },
  // { link: 's21', text: 'S-21' },
  // { link: 's1', text: 'S-1' },
  { link: 'settings', text: 'Settings' }
].map(item => ` <button class="menu__item" data-section="${item.link}" >${item.text}</button> `
).join('');