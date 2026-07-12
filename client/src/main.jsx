import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import AgeGate from './components/AgeGate.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AgeGate>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </AgeGate>
  </StrictMode>,
)
