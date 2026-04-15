import './header.css'
import logo from '../../assets/logotype.png'
import { useRef } from 'react'

export interface Settings {
  congregationName: string
}
export interface Publisher {
  surname: string
  name: string
  vps: string
  phone: string
  adres: string
  resContact: string
  resPhone: string
  birthday: string
  baptismday: string
  gender: 'male' | 'female'
  hope: string
  isElder: boolean
  isServant: boolean
  isPioner: boolean
  isSpecial: boolean
  isMissioner: boolean
}
export interface S88Record {
  midweek: string[]
  weekend: string[]
}
// Весь JSON файл
export interface JsonData {
  tbl_settings: Settings
  tbl_publishers: Record<string, Publisher>
  tbl_s88: Record<string, S88Record>
}

export default function Header() {


  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveToLocalStorage = (data: string) => {
    try {
      const parsedData = JSON.parse(data) as JsonData

      // Сохраняем настройки
      localStorage.setItem('tbl_settings', JSON.stringify(parsedData.tbl_settings, null, 2))
      console.log('✅ Сохранены настройки')

      // Сохраняем издателей
      localStorage.setItem('tbl_publishers', JSON.stringify(parsedData.tbl_publishers, null, 2))
      console.log(`✅ Сохранено издателей: ${Object.keys(parsedData.tbl_publishers).length}`)

      // Сохраняем статистику S88
      localStorage.setItem('tbl_s88', JSON.stringify(parsedData.tbl_s88, null, 2))
      console.log(`✅ Сохранено записей S88: ${Object.keys(parsedData.tbl_s88).length}`)

      alert('Данные успешно загружены!')
    } catch (error) {
      console.error('❌ Ошибка:', error)
      alert('Ошибка при разборе JSON. Проверь формат файла.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      const content = event.target?.result

      if (typeof content === 'string') {
        saveToLocalStorage(content)
      } else {
        alert('Не удалось прочитать файл')
      }
    }

    reader.onerror = () => {
      alert('Ошибка чтения файла')
    }

    reader.readAsText(file)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <header className='block header'>
      <div className='header__logo'>
        <img className="" src={logo} />
      </div>
      <h1 className='header__title'>Please, load DB &#8658;</h1>

      <label className="header__btn">
        Load DB
        <input
          type="file"
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
        />
      </label>

      <button className='header__btn' id="db_save">Save DB</button>
    </header>
  )
}