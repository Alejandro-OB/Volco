import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Clients from './Components/Clients'
import Materials from './Components/Materials'
import Accounts from './Components/Accounts'
import Navbar from './Components/Layout/Navbar.jsx';
import Auth from './Components/Auth/Auth.jsx';
import Services from './Components/Services'
import InvoiceCustomizationForm from './Components/InvoiceCustomizationForm'
import EditProvider from './Components/EditProvider'
import ForgotPassword from './Components/Auth/ForgotPassword'
import ResetPassword from './Components/Auth/ResetPassword'

function App() {

  const [token, setToken] = useState(localStorage.getItem('access_token'));

  // función que se pasa al Login
  const handleLoginSuccess = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setToken(access);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
  };

  return (
    <Router>
      {token && <Navbar onLogout={handleLogout} />}
      <div style={{ paddingTop: token ? '50px' : '0' }}>
        <Routes>
          <Route path="/" element={<Navigate to={token ? '/clientes' : '/login'} />} />
          <Route path="/login" element={<Auth onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/clientes" element={token ? <Clients /> : <Navigate to="/login" />} />
          <Route path="/servicios" element={token ? <Services /> : <Navigate to="/login" />} />
          <Route path="/materiales" element={token ? <Materials /> : <Navigate to="/login" />} />
          <Route path="/cuentas" element={token ? <Accounts /> : <Navigate to="/login" />} />
          <Route path="/register" element={<Auth />} />

          <Route
            path="/clientes/:clientId/cuentas"
            element={token ? <Accounts /> : <Navigate to="/login" />}
          />

          <Route
            path="/cuentas/:accountId/servicios"
            element={token ? <Services /> : <Navigate to="/login" />}
          />
          
          <Route
            path="/factura/personalizar"
            element={token ? <InvoiceCustomizationForm /> : <Navigate to="/login" />}
          />

          <Route
            path="/proveedor/editar/:providerId"
            element={token ? <EditProvider /> : <Navigate to="/login" />}
          />
          
          <Route path="/olvido-contraseña" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
