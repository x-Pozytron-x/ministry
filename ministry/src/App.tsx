// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'

const Home = () => <h1>Главная</h1>
const About = () => <h1>О нас</h1>

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  )
}

export default App