MyApp.setState = function (updates) {
  Object.assign(MyApp.state, updates);
  renderApp(); // перерендерить интерфейс при необходимости
};

function addStyleComponent(component) {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = MyApp.config.basePath + 'components/'  + component + '/' + component + '.css';
  document.head.appendChild(style);
}

function getMonthName(month) {
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[parseInt(month) - 1];
}