import { ReactElement } from 'react';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';

interface IRoute {
  path: string,
  element: ReactElement,
  name: string
}

export const routes: IRoute[] = [
  { path: '/', element: <Home />, name: 'Home' },
  { path: '/settings', element: <Settings />, name: 'Settings' },
]