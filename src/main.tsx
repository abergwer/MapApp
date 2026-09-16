import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import './i18n/config'
import { DirectionProvider } from './i18n'
import App from './App.tsx'
import theme from './theme'
import { StoreProvider } from './stores/StoreProvider'
window.global = window

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DirectionProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <App />
      </StoreProvider>
    </DirectionProvider>
  </StrictMode>,
)
