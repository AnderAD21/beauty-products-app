import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { seedIfNeeded } from './data/seed'
import './index.css'

// Carga/migra datos mock (reseed si cambió la versión del esquema).
seedIfNeeded()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
