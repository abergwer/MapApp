import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import App from './App.tsx'
import theme from './theme'
import { StoreProvider } from './stores/StoreProvider'
import { NetworkProvider } from './network'
window.global = window

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
     <NetworkProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </NetworkProvider>
    </ThemeProvider>
  </StrictMode>,
)
