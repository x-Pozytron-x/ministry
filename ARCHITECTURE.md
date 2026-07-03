# Архитектура CongrArk

## Обзор

CongrArk построен по принципам Clean Architecture с четким разделением ответственности между слоями. Зависимости направлены внутрь: UI зависит от Application, Application зависит от Domain, но Domain не зависит ни от чего.

## Диаграмма зависимостей

```
┌─────────────────────────────────────────┐
│              UI Layer                    │
│  (React Components, Hooks)              │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│         Application Layer                │
│  (Use Cases, ApplicationService)        │
└───┬──────────────┬──────────────────────┘
    │              │
    ↓              ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Domain   │  │ Crypto   │  │ Storage  │
│ Layer    │  │ Layer    │  │ Layer    │
└──────────┘  └──────────┘  └──────────┘
```

## Слои архитектуры

### 1. Domain Layer (Бизнес-логика)

**Расположение:** `src/domain/`

**Ответственность:**
- Определение бизнес-сущностей (Member, Report, AttendanceRecord)
- Бизнес-правила и валидация
- Доменные сервисы (операции над сущностями)

**Не зависит от:**
- UI фреймворков
- Способа хранения
- Способа шифрования
- Внешних библиотек

**Файлы:**
- `entities.ts` — типы данных и конструкторы
- `services.ts` — бизнес-логика (MemberService, ReportService, AttendanceService)
- `validation.ts` — правила валидации

**Пример:**
```typescript
// Чистая бизнес-логика без внешних зависимостей
export class MemberService {
  static addMember(data: AppData, member: Member): AppData {
    return touchAppData({
      ...data,
      members: [...data.members, member]
    });
  }
}
```

### 2. Crypto Layer (Шифрование)

**Расположение:** `src/crypto/`

**Ответственность:**
- Шифрование и расшифрование данных
- Управление ключами
- Реализация криптографических примитивов

**Изоляция:**
- Доступ только через интерфейс `CryptoService`
- Реализация скрыта за абстракцией
- Легко заменяема на другую

**Файлы:**
- `interfaces.ts` — интерфейсы и типы
- `index.ts` — реализация через Web Crypto API

**Пример:**
```typescript
export interface CryptoService {
  encrypt(plainData: string, password: string): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData, password: string): Promise<string>;
}
```

### 3. Storage Layer (Хранение)

**Расположение:** `src/storage/`

**Ответственность:**
- Сохранение и загрузка файлов
- Версионирование данных
- Автосохранение

**Компоненты:**
- `StorageAdapter` — интерфейс для сохранения/загрузки
- `VersionManager` — управление версиями
- `AutoSaveManager` — автосохранение с debounce

**Файлы:**
- `interfaces.ts` — интерфейсы
- `browserAdapter.ts` — загрузка/скачивание через browser APIs
- `versionManager.ts` — история версий
- `autoSave.ts` — автосохранение

### 4. Application Layer (Оркестрация)

**Расположение:** `src/application/`

**Ответственность:**
- Координация между Domain, Crypto и Storage
- Реализация use cases (создать файл, открыть файл, сохранить и т.д.)
- Обработка ошибок на уровне приложения

**Файлы:**
- `applicationService.ts` — основной сервис приложения

**Use Cases:**
```typescript
class ApplicationService {
  createNewFile(request: CreateNewFileRequest): Promise<AppData>
  openFile(request: OpenFileRequest): Promise<AppData>
  saveFile(request: SaveFileRequest): Promise<void>
  changePassword(request: ChangePasswordRequest): Promise<AppData>
}
```

### 5. UI Layer (Интерфейс)

**Расположение:** `src/components/`, `src/hooks/`

**Ответственность:**
- Отображение данных
- Обработка пользовательского ввода
- Вызов use cases из ApplicationService

**Компоненты:**
- `StartScreen` — экран входа
- `MainApp` — главное приложение с вкладками
- `Members`, `Reports`, `Attendance` — управление данными

**Hooks:**
- `useAutoSave` — интеграция автосохранения
- `useDebounce` — debounce для оптимизации

## Поток данных

### Создание нового файла

```
User Action (StartScreen)
    ↓
ApplicationService.createNewFile()
    ↓
Domain: createEmptyAppData()
    ↓
Return AppData to UI
```

### Открытие файла

```
User selects file (StartScreen)
    ↓
ApplicationService.openFile()
    ↓
Storage: load file → EncryptedData
    ↓
Crypto: decrypt → JSON string
    ↓
Domain: parse & validate → AppData
    ↓
Return AppData to UI
```

### Сохранение файла (автоматическое)

```
User changes data (Members/Reports/Attendance)
    ↓
Component calls onUpdate(newData)
    ↓
MainApp updates state
    ↓
useAutoSave schedules save (debounce 3s)
    ↓
ApplicationService.saveFile()
    ↓
Domain: validate AppData
    ↓
Crypto: encrypt → EncryptedData
    ↓
Storage: download file
```

## Принципы проектирования

### Dependency Inversion

Высокоуровневые модули не зависят от низкоуровневых. Оба зависят от абстракций.

**Пример:**
```typescript
// Application не знает о конкретной реализации
class ApplicationService {
  constructor(
    private cryptoService: CryptoService,      // интерфейс
    private storageAdapter: StorageAdapter,    // интерфейс
    private versionManager: VersionManager     // интерфейс
  ) {}
}

// Конкретные реализации передаются снаружи
const app = new ApplicationService(
  cryptoService,              // WebCryptoService
  new BrowserStorageAdapter(),
  new SimpleVersionManager()
);
```

### Single Responsibility

Каждый модуль отвечает только за одну вещь.

- `MemberService` — только операции с участниками
- `CryptoService` — только шифрование
- `AutoSaveManager` — только автосохранение

### Open/Closed

Открыто для расширения, закрыто для модификации.

Чтобы добавить новый способ хранения, достаточно реализовать `StorageAdapter`:

```typescript
class CloudStorageAdapter implements StorageAdapter {
  async save(filename: string, data: EncryptedData): Promise<void> {
    // загрузка в облако
  }
  
  async load(file: File): Promise<EncryptedData> {
    // скачивание из облака
  }
}
```

## Тестирование

### Unit-тесты

Каждый слой тестируется независимо:

```typescript
// Domain tests
describe('MemberService', () => {
  it('should add member to data', () => {
    const data = createEmptyAppData();
    const member = { id: '1', name: 'Test', ... };
    const result = MemberService.addMember(data, member);
    expect(result.members).toHaveLength(1);
  });
});

// Application tests с моками
describe('ApplicationService', () => {
  it('should save file', async () => {
    const mockCrypto = { encrypt: jest.fn() };
    const mockStorage = { save: jest.fn() };
    const service = new ApplicationService(mockCrypto, mockStorage, ...);
    
    await service.saveFile({ data, password });
    
    expect(mockCrypto.encrypt).toHaveBeenCalled();
    expect(mockStorage.save).toHaveBeenCalled();
  });
});
```

## Расширение функциональности

### Добавление новой сущности

1. **Domain:** Добавить интерфейс в `entities.ts`
```typescript
export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  status: 'todo' | 'done';
}
```

2. **Domain:** Создать сервис в `services.ts`
```typescript
export class TaskService {
  static addTask(data: AppData, task: Task): AppData { ... }
}
```

3. **Domain:** Добавить валидацию в `validation.ts`
```typescript
export const validateTask = (task: Partial<Task>): void => { ... }
```

4. **Domain:** Обновить `AppData`
```typescript
export interface AppData {
  // ...
  tasks: Task[];
}
```

5. **UI:** Создать компонент `Tasks.tsx`

6. **UI:** Добавить вкладку в `MainApp.tsx`

### Добавление нового способа экспорта

1. **Storage:** Создать новый адаптер
```typescript
class PDFExportAdapter {
  async export(data: AppData): Promise<Blob> {
    // генерация PDF
  }
}
```

2. **Application:** Добавить use case
```typescript
async exportToPDF(data: AppData): Promise<void> {
  const pdf = await pdfAdapter.export(data);
  // скачивание
}
```

3. **UI:** Добавить кнопку в настройках

## Best Practices

1. **Domain всегда чист** — никаких async операций, никаких внешних зависимостей
2. **Интерфейсы на границах слоёв** — Application работает через интерфейсы
3. **Immutability** — все операции возвращают новые объекты
4. **Explicit errors** — используем кастомные классы ошибок (ValidationError, DecryptionError)
5. **Type safety** — максимально используем TypeScript для предотвращения ошибок

## Известные ограничения

1. **Нет персистентности** — данные в памяти, при закрытии вкладки теряются
2. **Нет undo/redo** — можно добавить через Command pattern
3. **Нет конфликтов при слиянии** — одно устройство работает с файлом
4. **Автосохранение = скачивание файла** — нет фонового хранилища

## Будущие улучшения

1. **IndexedDB storage** — хранение в браузере для offline работы
2. **Conflict resolution** — работа с одним файлом с нескольких устройств
3. **Command pattern** — для undo/redo
4. **CQRS** — разделение чтения и записи для оптимизации
5. **Event sourcing** — история всех изменений
