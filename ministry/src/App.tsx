// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import './App.css'

import Header from './components/Header'
import Menu from './components/Menu'

import { routes } from './routes'

export const App: React.FC = () => {
  return (
    <>
      <Header />
      <Menu />
      <main className="block main">
        <div id="content-area">
          <Routes>
            {routes.map(route => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Routes>
        </div>
      </main>
    </>
  )
}

export default App