import './header.css'
import logo from '../../assets/logotype.png'
import { useRef, useEffect, useState } from 'react'

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

  const [db, setDb] = useState(false)
  const [congName, setcongName] = useState("Please, load DB ⇒");

  let getSettings = JSON.parse(localStorage.getItem("tbl_settings") || '""');

  if (getSettings && getSettings != "" && !db) {
    setDb(true);
    setcongName(getSettings.congregationName);
  }

  useEffect(() => {
    if (db) {
      setcongName(getSettings.congregationName);
    } else {
      setcongName("Please, load DB ⇒");
    }

  }, [db]);

  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveToLocalStorage = (data: string) => {
    try {
      const parsedData = JSON.parse(data) as JsonData

      localStorage.setItem('tbl_settings', JSON.stringify(parsedData.tbl_settings, null, 2))
      console.log('✅ Сохранены настройки')

      localStorage.setItem('tbl_publishers', JSON.stringify(parsedData.tbl_publishers, null, 2))
      console.log(`✅ Сохранено возвещателей: ${Object.keys(parsedData.tbl_publishers).length}`)

      localStorage.setItem('tbl_s88', JSON.stringify(parsedData.tbl_s88, null, 2))
      console.log(`✅ Сохранено записей S88: ${Object.keys(parsedData.tbl_s88).length}`)
      setDb(true);
    } catch (error) {
      console.error('❌ Ошибка:', error)
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

  const clearStorage = () => {
    localStorage.removeItem("tbl_settings");
    localStorage.removeItem("tbl_s88");
    localStorage.removeItem("tbl_publishers");
    setDb(false)
  }

  return (
    <header className='block header'>
      <div className='header__logo'>
        <img className="" src={logo} />
      </div>
      <h1 className='header__title'>{congName}</h1>
      {!db ? (
        <label className="header__btn">
          Load DB
          <input
            type="file"
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <>
          <button className='header__btn'>Save DB</button>
          <button className='header__btn' onClick={clearStorage}>Clear</button>
        </>
      )}
    </header>
  )
}