initApp();

async function initApp() {
  try {
    window.addEventListener('beforeunload', (event) => {
      if (true) {
        event.returnValue = 'У вас есть несохранённые изменения. Вы уверены, что хотите уйти?';
        return event.returnValue;
      }
    });

    window.App = document.getElementById('app');

    loadCSS('App/assets/css/styles.css');

    await loadScripts([
      'App/pages/home.js',

      'App/components/Header/Header.js',
      'App/components/Menu/Menu.js',
      'App/components/Main/Main.js',

      
      'App/modules/functions.js'
    ]);

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
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Ошибка загрузки скрипта: ${src}`));
    document.body.appendChild(script);
  });
}

async function loadScripts(srcArray) {
  for (const src of srcArray) {
    await loadScript(src);
  }
}