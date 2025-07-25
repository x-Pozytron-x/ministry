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
      window.dbData = {"tbl_settings" : {"congregationName" : document.getElementById('congregationName').value}  } ;
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

    document.querySelector('.header__title').innerHTML = dbData.tbl_settings['congregationName'];

    if(functionName== "publishers") {
      render_publishers();
    }
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


