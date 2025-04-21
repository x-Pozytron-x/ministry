//--- Page home ---//

function home () {
  const _component = document.createElement('section');
  _component.classList.add("section");
  _component.classList.add("home"); 
  _component.innerHTML = `
    <h2>Home page, or stats</h2>
  `;
  return _component;
};