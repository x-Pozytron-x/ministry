const menuItems = document.querySelectorAll('.menu__item');

menuItems.forEach((item, index) => {
  item.addEventListener('click', (e) => switchSection(e));
});


// Функция переключения секций
const switchSection = (e) => {
  e.preventDefault();

  console.log(e);

  let main = document.querySelector('.main');
  functionName = e.target.attributes[1].value;

  main.textContent = "";

  main.appendChild(window[functionName]());
    if (window[functionName]() == "settings") {
      document.getElementById('set_congregationName').addEventListener('click', () => {
        window.dbData = {"tbl_settings" : {"congregationName" : document.getElementById('congregationName').value}  } ;
        console.log(window.dbData);
      });
    }
};

document.getElementById('db_load').addEventListener('click', loadDB);
document.getElementById('db_save').addEventListener('click', saveDB);

async function loadDB() {
  try {
    const pickerOptions = {
      startIn: 'downloads',
      types: [
        {
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }
      ],
      multiple: false
    };

    if (window.lastFileHandle) {
      pickerOptions.startIn = window.lastFileHandle;
    }

    const [fileHandle] = await window.showOpenFilePicker(pickerOptions);

    window.lastFileHandle = fileHandle;

    const file = await fileHandle.getFile();
    
    const text = await file.text();
    const dbData = JSON.parse(text);
    window.dbData = dbData;
    console.log(dbData);
    document.querySelector('.header__title').innerHTML = dbData.tbl_settings['congregationName'];

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Пользователь отменил выбор файла');
    } else {
      console.error('Ошибка при загрузке или парсинге JSON:', error);
      alert('Не удалось загрузить данные. Проверьте файл и попробуйте снова.');
    }
  }
}

async function saveDB() {
  try {
    if (!window.dbData) {
      alert('Нет данных для сохранения');
      return;
    }

    const fileHandle = await window.showSaveFilePicker({
      types: [
        {
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] }
        }
      ]
    });

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(window.dbData, null, 2));
    await writable.close();

    console.log('Данные сохранены в файл');
  } catch (error) {
    console.error('Ошибка при сохранении файла:', error);
    alert('Не удалось сохранить данные');
  }
}




  