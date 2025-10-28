MyApp.setState = function (updates) {
  Object.assign(MyApp.state, updates);
  renderApp(); // перерендерить интерфейс при необходимости
};

// function isExit() {

// }


function addStyleComponent(component) {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = MyApp.config.basePath + 'components/'  + component + '/' + component + '.css';
  document.head.appendChild(style);
}