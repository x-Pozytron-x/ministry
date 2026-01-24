const menuItems = document.querySelectorAll('.menu__item');

menuItems.forEach((item, index) => {
  item.addEventListener('click', (e) => switchSection(e));
});

functionName = "";
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
      window.dbData = { "tbl_settings": { "congregationName": document.getElementById('congregationName').value } };
    });
  }
};


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

    saveToLocalStorage(dbData)
    changeHeaderTitle();

    if (functionName == "publishers") {
      render_publishers();
    }
    MyApp.router.navigate(MyApp.state.currentSection);
    return db = new JsonDB(dbData);
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
    dbToSave = {
      'tbl_settings': DB_local.select('tbl_settings'),
      'tbl_publishers': DB_local.select('tbl_publishers'),
      'tbl_s88': DB_local.select('tbl_s88')
    }
    if (!dbToSave) {
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

    await writable.write(JSON.stringify(dbToSave, null, 2));
    await writable.close();

    console.log('Данные сохранены в файл');
  } catch (error) {
    console.error('Ошибка при сохранении файла:', error);
    alert('Не удалось сохранить данные');
  }
}



class JsonDB {
  constructor(initialData) {
    // Инициализируем все таблицы как массивы
    this.db = {};
    for (const table in initialData) {
      this.db[table] = this._convertToArray(initialData[table]);
    }
  }

  // Преобразует объект в массив
  _convertToArray(data) {
    if (Array.isArray(data)) return data;
    return Object.entries(data).map(([id, item]) => ({ id: parseInt(id), ...item }));
  }

  // CREATE - добавление новой записи
  create(table, data) {
    if (!this.db[table]) {
      this.db[table] = [];
    }

    // Генерируем новый ID
    const ids = this.db[table].map(item => item.id);
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

    const newItem = { id: newId, ...data };
    this.db[table].push(newItem);
    return newId;
  }

  // READ - чтение данных
  read(table, options = {}) {
    if (!this.db[table]) {
      throw new Error(`Table ${table} does not exist`);
    }

    let result = [...this.db[table]];

    // Сортировка
    if (options.sortBy) {
      result.sort((a, b) => {
        const valA = a[options.sortBy] || '';
        const valB = b[options.sortBy] || '';
        const direction = options.ascending === false ? -1 : 1;

        // Для дат
        if (options.sortBy.includes('date') || options.sortBy.includes('day')) {
          return (new Date(valA) - new Date(valB)) * direction;
        }

        // Для чисел
        if (!isNaN(valA)) {
          return (valA - valB) * direction;
        }

        // Для строк
        return valA.localeCompare(valB) * direction;
      });
    }

    // Фильтрация
    if (options.filter) {
      result = result.filter(options.filter);
    }

    // Пагинация
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || result.length;
      result = result.slice(offset, offset + limit);
    }

    return options.asObject
      ? result.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})
      : result;
  }

  // UPDATE - обновление данных
  update(table, id, data) {
    const index = this.db[table]?.findIndex(item => item.id == id);
    if (index === -1) {
      throw new Error(`Record with id ${id} not found in table ${table}`);
    }

    this.db[table][index] = { ...this.db[table][index], ...data };
    return true;
  }

  // DELETE - удаление данных
  delete(table, id) {
    const initialLength = this.db[table]?.length || 0;
    this.db[table] = this.db[table]?.filter(item => item.id != id) || [];
    return initialLength !== this.db[table].length;
  }


  getById(table, id) {
    return this.db[table]?.find(item => item.id == id);
  }

  // Получение первого элемента, соответствующего условиям
  find(table, predicate) {
    return this.db[table]?.find(predicate);
  }

  // Получение всех элементов, соответствующих условиям
  findAll(table, predicate) {
    return this.db[table]?.filter(predicate);
  }

  // Количество записей в таблице
  count(table) {
    return this.db[table]?.length || 0;
  }


  // Получение всей базы данных
  getDatabase() {
    return this.db;
  }
}

function changeHeaderTitle() {
  document.querySelector('.header__title').innerHTML = DB_local.select('tbl_settings', 'congregationName');
}

function saveToLocalStorage(data) {
  for (table in data) {
    tablData = JSON.stringify(data[table], null, 2)
    localStorage.setItem(table, tablData);
  }
}

const DB_local = {
  select(tbl, row = "") {
    try {
      if (!row) {
        return JSON.parse(localStorage.getItem(tbl));
      } else {
        return JSON.parse(localStorage.getItem(tbl))[row];
      }
    } catch {
      return false
    }
  },

  insert(tbl, row) {
    let dbTbl = JSON.parse(localStorage.getItem(tbl));
    let newTbl = Object.assign({}, dbTbl, row);

    localStorage.setItem(tbl, JSON.stringify(newTbl, null, 2));
  },

  update(tbl, data) {
    localStorage.setItem(tbl, JSON.stringify(data, null, 2));
  },

  delete(tbl, id) {
    dbTbl = JSON.parse(localStorage.getItem(tbl));
    delete dbTbl[id];
    localStorage.setItem(tbl, JSON.stringify(dbTbl, null, 2));
  }
}