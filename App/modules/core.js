MyApp.setState = function (updates) {
  Object.assign(MyApp.state, updates);
  renderApp(); // перерендерить интерфейс при необходимости
};

// function isExit() {

// }