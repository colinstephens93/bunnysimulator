import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { world } from './world'
import { useGame } from './store'

if (import.meta.env.DEV) Object.assign(window, { __world: world, __game: useGame })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
