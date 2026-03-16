import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import { MasterDataProvider } from './context/MasterDataContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ConfirmProvider>
          <MasterDataProvider initialData={{}}>
            <App />
          </MasterDataProvider>
        </ConfirmProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)
