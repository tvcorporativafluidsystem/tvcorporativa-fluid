import React from 'react'
import { createHashRouter } from 'react-router-dom'
import Admin from './pages/Admin'
import TV from './pages/TV'

export const router = createHashRouter([
  { path: '/', element: <Admin /> },
  { path: '/admin', element: <Admin /> },
  { path: '/tv', element: <TV /> }
])