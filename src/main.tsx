import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppThemeProvider from './Components/layout/AppThemeProvider'
import { StoreProvider } from './stores/StoreProvider'
window.global = window

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </StoreProvider>
  </StrictMode>,
)
