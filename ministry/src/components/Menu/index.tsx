import { Link } from 'react-router-dom'
// import './header.css'

export default function Menu() {
  return (
    <aside className='block menu'>
      <nav>
        <Link className='menu__item' to="/">Home</Link>
        <Link className='menu__item' to="/settings">Settings</Link>
      </nav>
    </aside>
  )
}