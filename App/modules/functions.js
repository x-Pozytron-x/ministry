const menuItems = document.querySelectorAll('.menu__item');

menuItems.forEach((item, index) => {
  item.addEventListener('click', (e) => switchSection(e));
});


// Функция переключения секций
const switchSection = (e) => {
  e.preventDefault();

  let main = document.querySelector('.main');
  functionName = e.target.attributes[1].value;

  main.textContent = "";

  main.appendChild(window[functionName]());

  
taaabs();

  if (window[functionName] == "settings") {
    document.getElementById('set_congregationName').addEventListener('click', () => {
      window.dbData = {"tbl_settings" : {"congregationName" : document.getElementById('congregationName').value}  } ;
      //console.log(window.dbData);
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
    db = new JsonDB(dbData);
  //  console.log(dbData);
    document.querySelector('.header__title').innerHTML = dbData.tbl_settings['congregationName'];
    if(functionName== "publishers") {
      render_publishers();
    }
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




class JsonDB {
  constructor(initialData) {
    this.db = initialData || {
      tbl_settings: {},
      tbl_publishers: {}
    };
  }

  // CREATE - добавление новой записи
  create(table, data) {
    if (!this.db[table]) {
      throw new Error(`Table ${table} does not exist`);
    }

    // Генерируем новый ID как максимальный существующий + 1
    const ids = Object.keys(this.db[table]).map(Number).filter(id => !isNaN(id));
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 0;

    this.db[table][newId] = data;
    return newId;
  }

  // READ - чтение данных
  read(table, id = null) {
    if (!this.db[table]) {
      throw new Error(`Table ${table} does not exist`);
    }

    if (id !== null) {
      return this.db[table][id] || null;
    }

    return this.db[table];
  }

  // UPDATE - обновление данных
  update(table, id, data) {
    if (!this.db[table]) {
      throw new Error(`Table ${table} does not exist`);
    }

    if (!this.db[table][id]) {
      throw new Error(`Record with id ${id} not found in table ${table}`);
    }

    this.db[table][id] = { ...this.db[table][id], ...data };
    return true;
  }

  // DELETE - удаление данных
  delete(table, id) {
    if (!this.db[table]) {
      throw new Error(`Table ${table} does not exist`);
    }

    if (!this.db[table][id]) {
      throw new Error(`Record with id ${id} not found in table ${table}`);
    }

    delete this.db[table][id];
    return true;
  }

  // Поиск по полям
  search(table, criteria) {
    if (!this.db[table]) {
      throw new Error(`Table ${table} does not exist`);
    }

    return Object.entries(this.db[table])
      .filter(([id, record]) => {
        return Object.entries(criteria).every(([key, value]) => {
          if (typeof value === 'function') {
            return value(record[key]);
          }
          return record[key] === value;
        });
      })
      .reduce((acc, [id, record]) => {
        acc[id] = record;
        return acc;
      }, {});
  }

  // Получение всей базы данных
  getDatabase() {
    return this.db;
  }
}


//let db = new JsonDB(dbData);

// READ пример
// let allPublishers = db.read('tbl_publishers');
// console.log('All publishers:', allPublishers);