import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import 'mapbox-gl/dist/mapbox-gl.css'

const rootElement = document.getElementById('app')!
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
