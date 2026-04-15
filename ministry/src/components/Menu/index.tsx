import { Link } from 'react-router-dom'
import './menu.css'

import { routes } from '../../routes'

export default function Menu() {
  return (
    <aside className='block menu'>
      <nav>
        {routes.map(route => (
          <Link className='menu__item' key={route.path} to={route.path}>
            {route.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}