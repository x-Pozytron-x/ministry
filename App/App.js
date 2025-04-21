initApp();

async function initApp() {

  try {
    window.App = document.getElementById('app');

    loadCSS('App/assets/css/styles.css');


    await loadScript('App/pages/home.js');

    await loadScript('App/components/Header/Header.js');
    await loadScript('App/components/Menu/Menu.js');
    await loadScript('App/components/Main/Main.js');


    await loadScript('App/pages/publishers.js');
    await loadScript('App/pages/reports.js');
    await loadScript('App/pages/settings.js');

    await loadScript('App/modules/functions.js');

  } catch (error) {
      console.error('Ошибка при загрузке скриптов:', error);
      alert('Не удалось загрузить один из скриптов. Проверьте файлы.');
  }
}

function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src, callback) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Ошибка загрузки скрипта: ${src}`));
    document.body.appendChild(script);
});
}
