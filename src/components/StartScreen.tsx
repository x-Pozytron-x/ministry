// StartScreen: welcome, database choice, database creation and file loading

import { useEffect, useRef, useState } from 'react';
import type { CongregationData } from '../domain';
import { createEmptyCongregationData } from '../domain';
import type { ApplicationService } from '../application';
import { indexedDbService } from '../storage';
import { DecryptionError } from '../crypto';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ICON_FILE,
  ICON_FOLDER,
  ICON_FEATURE_SECURITY,
  ICON_FEATURE_CONVENIENCE,
  ICON_FEATURE_EXPORT
} from '../config/icons';
import {
  APP_VERSION,
  APP_STATUS,
  APP_AUTHOR_TELEGRAM,
  APP_AUTHOR_TELEGRAM_URL
} from '../config';

interface StartScreenProps {
  applicationService: ApplicationService;
  onUnlock: (data: CongregationData, password: string, mode?: 'guest' | 'admin') => void;
}

type LandingModal = 'about' | 'faq' | 'author' | 'contacts' | 'terms';

const WEEKDAYS = [
  { value: 'Monday', label: 'Понедельник' },
  { value: 'Tuesday', label: 'Вторник' },
  { value: 'Wednesday', label: 'Среда' },
  { value: 'Thursday', label: 'Четверг' },
  { value: 'Friday', label: 'Пятница' }
] as const;

const WEEKENDS = [
  { value: 'Saturday', label: 'Суббота' },
  { value: 'Sunday', label: 'Воскресенье' }
] as const;

export default function StartScreen({ applicationService, onUnlock }: StartScreenProps) {
  const [mode, setMode] = useState<'welcome' | 'choice' | 'create' | 'file-open'>('welcome');
  const [newDbName, setNewDbName] = useState('');
  const [password, setPassword] = useState('');
  const [groupCount, setGroupCount] = useState('1');
  const [weekdayMeetingDay, setWeekdayMeetingDay] = useState<string>('Tuesday');
  const [weekendMeetingDay, setWeekendMeetingDay] = useState<string>('Saturday');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDatabase, setHasDatabase] = useState<boolean | null>(null);
  const [activeModal, setActiveModal] = useState<LandingModal | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== 'choice' || hasDatabase !== null) return;

    let isCurrent = true;
    const checkDatabase = async () => {
      try {
        const exists = await indexedDbService.databaseExists();
        if (isCurrent) setHasDatabase(exists);
      } catch (err) {
        if (!isCurrent) return;
        setError(err instanceof Error ? err.message : 'Не удалось проверить базу данных');
        setHasDatabase(true);
      }
    };
    void checkDatabase();

    return () => {
      isCurrent = false;
    };
  }, [mode, hasDatabase]);

  const resetState = () => {
    setNewDbName('');
    setPassword('');
    setGroupCount('1');
    setWeekdayMeetingDay('Tuesday');
    setWeekendMeetingDay('Saturday');
    setSelectedFile(null);
    setError('');
    setHasDatabase(null);
  };

  const readFileAsText = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Не удалось прочитать содержимое файла'));
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsText(file);
  });

  const handleCreateDb = async () => {
    const parsedGroupCount = Number(groupCount);
    if (!newDbName.trim()) {
      setError('Введите название собрания');
      return;
    }
    if (!password) {
      setError('Введите мастер-пароль');
      return;
    }
    if (!Number.isInteger(parsedGroupCount) || parsedGroupCount < 1 || parsedGroupCount > 50) {
      setError('Количество групп должно быть от 1 до 50');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = createEmptyCongregationData();
      data.settings.name = newDbName.trim();
      data.settings.vpsGroupsCount = parsedGroupCount;
      data.settings.weekdayMeetingDay = weekdayMeetingDay;
      data.settings.weekendMeetingDay = weekendMeetingDay;
      await indexedDbService.set(JSON.stringify(data), password);
      onUnlock(data, password, 'admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания базы данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!password) {
      setError('Введите пароль администратора');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const decryptedJson = await indexedDbService.get(password);
      if (decryptedJson === null) {
        setError('База данных не найдена');
        return;
      }
      const data = await applicationService.parseDecryptedJson(decryptedJson);
      onUnlock(data, password, 'admin');
    } catch (err) {
      setError(err instanceof DecryptionError ? 'Неверный пароль' : err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleFileOpen = async () => {
    if (!selectedFile) {
      setError('Выберите JSON файл');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const text = await readFileAsText(selectedFile);
      if (!password) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          setError('Неверный формат файла');
          return;
        }
        const data = await applicationService.parseDecryptedJson(JSON.stringify(parsed));
        onUnlock(data, '', 'guest');
        return;
      }
      const data = await applicationService.openFile({ file: selectedFile, password });
      onUnlock(data, password, 'guest');
    } catch (err) {
      setError(err instanceof DecryptionError ? 'Неверный пароль' : err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Выберите JSON файл');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  if (mode === 'welcome') {
    return (
      <div className="start-screen start-landing landing-page">
        <header className="landing-header">
          <div className="landing-brand">
            <img src="/logo.png" alt="" className="landing-brand-logo" />
            <span className="landing-brand-copy">
              <strong>KeepCong</strong>
              <small>v{APP_VERSION}-{APP_STATUS}</small>
            </span>
          </div>
          <nav className="landing-nav" aria-label="Основная навигация">
            <button type="button" onClick={() => setActiveModal('about')}>О приложении</button>
            <button type="button" onClick={() => setActiveModal('faq')}>FAQ</button>
            <button type="button" onClick={() => setActiveModal('author')}>Об авторе</button>
            <button type="button" onClick={() => setActiveModal('contacts')}>Контакты</button>
          </nav>
          <button
            type="button"
            onClick={() => { resetState(); setMode('choice'); }}
            className="primary start-login-button landing-login-button"
          >
            Вход
          </button>
        </header>

        <main className="landing-main">

          <section className="landing-section" aria-labelledby="advantages-title">
            <h2 id="advantages-title" className="landing-section-title">Наши преимущества</h2>
            <div className="landing-advantages">
              <div className="start-features">
                <div className="feature-card">
                  <span className="feature-icon"><FontAwesomeIcon icon={ICON_FEATURE_SECURITY} /></span>
                  <h3>Безопасность</h3>
                  <p>Данные хранятся локально и защищены паролем.</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon"><FontAwesomeIcon icon={ICON_FEATURE_CONVENIENCE} /></span>
                  <h3>Удобство</h3>
                  <p>Учёт собраний, возвещателей и отчётов в одном месте.</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon"><FontAwesomeIcon icon={ICON_FEATURE_EXPORT} /></span>
                  <h3>Экспорт</h3>
                  <p>Сохраняйте резервную копию данных в JSON.</p>
                </div>
              </div>
              <img src="/advantages.png" alt="Преимущества KeepCong" className="landing-advantages-image" />
            </div>
          </section>

          <section className="quick-start" aria-labelledby="quick-start-title">
            <h2 id="quick-start-title" className="landing-section-title">Как начать работу</h2>
            <div className="quick-start-layout">
              <img src="/howtostart2.png" alt="Как начать работу в KeepCong" className="quick-start-image" />
              <div className="quick-start-steps">
                <article className="quick-start-step">
                  <span className="quick-start-number" aria-hidden="true">1</span>
                  <div>
                    <h3>Создайте собрание</h3>
                    <p>Введите название и пароль для шифрования базы.</p>
                  </div>
                </article>
                <article className="quick-start-step">
                  <span className="quick-start-number" aria-hidden="true">2</span>
                  <div>
                    <h3>Добавьте возвещателей</h3>
                    <p>Заполните список и настройте группы ВПС.</p>
                  </div>
                </article>
                <article className="quick-start-step">
                  <span className="quick-start-number" aria-hidden="true">3</span>
                  <div>
                    <h3>Ведите учёт</h3>
                    <p>Отмечайте посещаемость и формируйте отчёты.</p>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <span>© 2026 KeepCong</span>
          <button type="button" onClick={() => setActiveModal('terms')}>Условия использования</button>
        </footer>

        {activeModal && (
          <div className="landing-modal-overlay" onClick={() => setActiveModal(null)}>
            <section
              className="landing-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="landing-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="landing-modal-header">
                <h2 id="landing-modal-title">
                  {activeModal === 'about' && 'О приложении'}
                  {activeModal === 'faq' && 'FAQ'}
                  {activeModal === 'author' && 'Об авторе'}
                  {activeModal === 'contacts' && 'Контакты'}
                  {activeModal === 'terms' && 'Условия использования'}
                </h2>
                <button
                  type="button"
                  className="landing-modal-close"
                  onClick={() => setActiveModal(null)}
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </header>

              {activeModal === 'about' && (
                <div className="landing-modal-content">
                  <p>
                    KeepCong — приложение для управления данными собрания. Сведения о возвещателях,
                    отчётах служения и посещаемости хранятся локально на вашем устройстве.
                  </p>
                  <p>Приложение работает офлайн и не отправляет данные на сервер.</p>
                </div>
              )}

              {activeModal === 'faq' && (
                <div className="landing-modal-content landing-faq">
                  <details>
                    <summary>Безопасно ли это?</summary>
                    <p>Да. База хранится локально в браузере и зашифрована мастер-паролем.</p>
                  </details>
                  <details>
                    <summary>Где хранятся данные?</summary>
                    <p>
                      База хранится в IndexedDB браузера в зашифрованном виде. Экспорт можно скачать в JSON-файл.
                      Данные не отправляются на сервер.
                    </p>
                  </details>
                  <details>
                    <summary>Можно ли работать офлайн?</summary>
                    <p>Да, приложение полностью работает без интернета.</p>
                  </details>
                  <details>
                    <summary>Как экспортировать данные?</summary>
                    <p>В режиме Admin нажмите кнопку скачивания JSON в верхней панели приложения.</p>
                  </details>
                </div>
              )}

              {activeModal === 'author' && (
                <div className="landing-modal-content">
                  <p>Автор: {APP_AUTHOR_TELEGRAM}</p>
                  <p><a href={APP_AUTHOR_TELEGRAM_URL} target="_blank" rel="noopener noreferrer">Telegram автора</a></p>
                  <p><a href="mailto:stetsenko.vitaly@gmail.com">stetsenko.vitaly@gmail.com</a></p>
                </div>
              )}

              {activeModal === 'contacts' && (
                <div className="landing-modal-content">
                  <p><a href="mailto:stetsenko.vitaly@gmail.com">stetsenko.vitaly@gmail.com</a></p>
                  <p><a href={APP_AUTHOR_TELEGRAM_URL} target="_blank" rel="noopener noreferrer">{APP_AUTHOR_TELEGRAM}</a></p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="landing-modal-content">
                  <p>
                    Приложение предоставляется «как есть». Данные хранятся локально на вашем устройстве.
                    Вы отвечаете за создание и сохранность резервных копий. Автор не несёт ответственности
                    за потерю данных.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        <style>{`
          .landing-page {
            max-width: 960px;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .landing-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.5rem;
            padding: 0.75rem 0 1rem;
            border-bottom: 1px solid var(--border-color);
          }

          .landing-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 0 0 auto;
            text-align: left;
          }

          .landing-brand-logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
          }

          .landing-brand-copy {
            display: flex;
            flex-direction: column;
            line-height: 1.25;
          }

          .landing-brand-copy strong {
            color: var(--text-primary);
            font-size: 1.1rem;
          }

          .landing-brand-copy small {
            color: var(--text-secondary);
            font-size: 0.75rem;
          }

          .landing-nav {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 0.25rem;
          }

          .landing-nav button,
          .landing-footer button {
            padding: 0.5rem 0.65rem;
            border: 0;
            border-radius: 6px;
            background: transparent;
            color: var(--text-secondary);
            font: inherit;
            font-size: 0.9rem;
            cursor: pointer;
            transition: color 0.2s ease, background-color 0.2s ease;
          }

          .landing-nav button:hover,
          .landing-footer button:hover {
            background: var(--secondary-bg);
            color: var(--primary-color);
          }

          .landing-main {
            flex: 1;
          }

          .landing-section-title {
            width: fit-content;
            margin: 0 0 1.25rem;
            background: linear-gradient(90deg, #7dd3fc 0%, #a78bfa 55%, #f0abfc 100%);
            background-clip: text;
            color: transparent;
            font-size: clamp(1.5rem, 3vw, 2rem);
            font-weight: 800;
            letter-spacing: 0.01em;
            text-shadow: 0 0 22px rgba(125, 211, 252, 0.18);
            -webkit-background-clip: text;
          }

          .landing-section {
            margin: 1.75rem 0 2.5rem;
          }
          .landing-advantages {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            align-items: center;
            gap: 2rem;
            margin: 1.5rem 0;
          }

          .landing-main .start-features {
            display: flex;
            flex-direction: column;
            gap: 0;
            margin: 0;
          }

          .landing-main .feature-card {
            display: grid;
            grid-template-columns: 3rem minmax(0, 1fr);
            column-gap: 1rem;
            align-items: start;
            margin: 0;
            padding: 1rem 0;
            border: 0;
            border-bottom: 1px solid var(--border-color);
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            text-align: left;
          }

          .landing-main .feature-card:last-child {
            border-bottom: 0;
          }

          .landing-main .feature-card .feature-icon {
            grid-row: span 2;
            margin: 0.1rem 1.5rem 0 0;
          }

          .landing-main .feature-card h3 {
            margin: 0 0 0.3rem;
          }

          .landing-main .feature-card p {
            margin: 0;
            color: var(--text-secondary);
          }

          .landing-advantages-image {
            display: block;
            width: 100%;
            max-width: 420px;
            max-height: 260px;
            justify-self: center;
            object-fit: contain;
          }

          .landing-header .landing-login-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 2.35rem;
            width: auto;
            margin: 0;
            padding: 0.45rem 1.05rem;
            border: 1px solid rgba(125, 211, 252, 0.42);
            border-radius: 999px;
            background: linear-gradient(110deg, #2563eb, #7c3aed);
            color: #fff;
            font-size: 0.88rem;
            font-weight: 700;
            letter-spacing: 0.02em;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.24);
            transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          }

          .landing-header .landing-login-button:hover {
            transform: translateY(-1px);
            filter: brightness(1.08);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.32);
          }

          .landing-header .landing-login-button:focus-visible {
            outline: 2px solid #7dd3fc;
            outline-offset: 3px;
          }
          .landing-login-button {
            flex: 0 0 auto;
            margin: 0;
          }

          .quick-start-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
            align-items: center;
            gap: 2rem;
          }

          .quick-start-image {
            display: block;
            width: 100%;
            max-width: 420px;
            max-height: 230px;
            justify-self: center;
            object-fit: contain;
          }

          .quick-start {
            margin: 2.5rem 0 1rem;
            text-align: left;
          }

          .quick-start > h2 {
            margin: 0 0 1.25rem;
          }

          .quick-start-steps {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .quick-start-step {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 5px 15px;
            border: 1px solid var(--border-color);
            border-radius: 10px;
            background: var(--card-bg);
          }

          .quick-start-number {
            display: grid;
            width: 2rem;
            height: 2rem;
            flex: 0 0 2rem;
            place-items: center;
            border-radius: 50%;
            background: var(--secondary-bg);
            color: var(--primary-color);
            font-weight: 700;
          }

          .quick-start-step h3 {
            margin: 0 0 0.35rem;
            color: var(--text-primary);
            font-size: 1rem;
          }

          .quick-start-step p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
          }
          .landing-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
            color: var(--text-secondary);
            font-size: 0.85rem;
          }

          .landing-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.6);
          }

          .landing-modal {
            width: min(100%, 560px);
            max-height: min(80vh, 720px);
            overflow-y: auto;
            padding: 1.5rem;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            background: var(--card-bg);
            color: var(--text-primary);
            text-align: left;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
          }

          .landing-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .landing-modal-header h2 {
            margin: 0;
          }

          .landing-modal-close {
            padding: 0 0.25rem;
            border: 0;
            background: transparent;
            color: var(--text-secondary);
            font-size: 1.75rem;
            cursor: pointer;
          }

          .landing-modal-content p {
            line-height: 1.6;
          }

          .landing-modal-content a {
            color: var(--primary-color);
          }

          .landing-faq details {
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--border-color);
          }

          .landing-faq details:last-child {
            border-bottom: 0;
          }

          .landing-faq summary {
            color: var(--text-primary);
            cursor: pointer;
            font-weight: 600;
          }

          .landing-faq p {
            margin-bottom: 0;
            color: var(--text-secondary);
          }

          @media (max-width: 640px) {
            .landing-header {
              flex-direction: column;
              align-items: stretch;
              gap: 0.75rem;
            }

            .landing-nav {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              justify-content: stretch;
            }

            .landing-nav button {
              text-align: center;
            }

            .landing-advantages {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .landing-advantages-image {
              max-height: 260px;
            }
            .landing-login-button {
              align-self: center;
            }

            .quick-start-layout {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .quick-start-image {
              max-height: 230px;
            }
            .quick-start-steps {
              grid-template-columns: 1fr;
            }
            .landing-footer {
              flex-direction: column;
              justify-content: center;
              gap: 0.4rem;
            }
          }
        `}</style>
      </div>
    );
  }

  if (mode === 'choice') {
    return (
      <div className="start-screen">
        <div className="logo">
          <img src="/logo.png" alt="KeepCong" className="start-logo" />
          <h2>Что вы хотите сделать?</h2>
        </div>
        {hasDatabase === true && (
          <div className="form" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label>Введите пароль администратора</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                onKeyDown={(event) => event.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <div className="button-group">
              <button onClick={handleAdminLogin} disabled={loading || !password} className="primary">
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
          </div>
        )}
        <div className="button-group">
          <button onClick={() => { resetState(); setMode('create'); }} className="primary">
            Создать новое собрание
          </button>
          <button onClick={() => { resetState(); setMode('file-open'); }} className="secondary">
            Загрузить файл
          </button>
        </div>
        <div className="button-group">
          <button onClick={() => { resetState(); setMode('welcome'); }} className="secondary">
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="start-screen">
        <h2>Создать новое собрание</h2>
        <div className="form">
          <div className="form-group">
            <label>Название собрания</label>
            <input type="text" value={newDbName} onChange={(event) => setNewDbName(event.target.value)} disabled={loading} autoFocus />
          </div>
          <div className="form-group">
            <label>Мастер-пароль</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label>Количество групп ВПС</label>
            <input type="number" min="1" max="50" step="1" value={groupCount} onChange={(event) => setGroupCount(event.target.value)} disabled={loading} />
          </div>
          <div className="form-group">
            <label>Дни встреч (Будни)</label>
            <select value={weekdayMeetingDay} onChange={(event) => setWeekdayMeetingDay(event.target.value)} disabled={loading}>
              {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Дни встреч (Выходные)</label>
            <select value={weekendMeetingDay} onChange={(event) => setWeekendMeetingDay(event.target.value)} disabled={loading}>
              {WEEKENDS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="button-group">
            <button onClick={handleCreateDb} disabled={loading} className="primary">{loading ? 'Создание...' : 'Создать'}</button>
          </div>
          <div className="button-group">
            <button onClick={() => { resetState(); setMode('choice'); }} disabled={loading} className="secondary">
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="start-screen">
      <h2>Загрузить файл</h2>
      <div className="form">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) handleFileSelect(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            style={{ display: 'none' }}
          />
          {selectedFile ? (
            <div className="file-info">
              <span className="file-icon"><FontAwesomeIcon icon={ICON_FILE} /></span>
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
            </div>
          ) : (
            <div className="drop-zone-content">
              <span className="upload-icon"><FontAwesomeIcon icon={ICON_FOLDER} /></span>
              <p>Перетащите JSON файл сюда или нажмите для выбора</p>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Пароль файла, если он зашифрован</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} onKeyDown={(event) => event.key === 'Enter' && handleFileOpen()} />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="button-group">
          <button onClick={handleFileOpen} disabled={loading || !selectedFile} className="primary">{loading ? 'Загрузка...' : 'Открыть'}</button>
        </div>
        <div className="button-group">
          <button onClick={() => { resetState(); setMode('choice'); }} disabled={loading} className="secondary">
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
