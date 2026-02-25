import { createBrowserRouter } from 'react-router-dom'
import Admin from './pages/Admin'
import Tv from './pages/Tv'
import NotFound from './pages/NotFound'

export const router = createBrowserRouter([
  { path: '/', element: <Admin /> },
  { path: '/admin', element: <Admin /> },
  { path: '/tv', element: <Tv /> },
  { path: '*', element: <NotFound /> }
])