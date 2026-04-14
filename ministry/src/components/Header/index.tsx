import { Link } from 'react-router-dom'

function Header() {
  return (
    <header>
      <Link to="/">Главная</Link> | <Link to="/about">О нас</Link>
    </header>
  )
}

export default Header
