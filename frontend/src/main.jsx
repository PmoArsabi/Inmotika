import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)
