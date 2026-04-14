// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import './App.css'

import Header from './components/Header'
import Menu from './components/Menu'

const Home = () => <h1>Главная</h1>
const Settings = () => <h1>Settings</h1>

function App() {
  return (
    <>
      <Header />
      <Menu />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  )
}

export default App