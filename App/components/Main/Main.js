//--- Main.js ---//

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