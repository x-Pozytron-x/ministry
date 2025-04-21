//--- Menu.js ---//

const menuItemsHtml = [
  { link: 'home', text: 'Home' },
  { link: 'publishers', text: 'Publishers' },
  { link: 'reports', text: 'Reports' },
  // { link: 's21', text: 'S-21' },
  // { link: 's1', text: 'S-1' },
  { link: 'settings', text: 'Settings' }
].map(item => 
`
  <a class="menu__item" href="${item.link}">${item.text}</a>
`
).join('');

(() => {
  const _component = document.createElement('aside');
  _component.classList.add("block");
  _component.classList.add("menu");
  App.appendChild(_component);

  _component.innerHTML = `
    <nav>
        ${menuItemsHtml}
    </nav>
  `;

})(menuItemsHtml);