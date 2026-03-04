import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Clients from './pages/Clients'
import Materials from './pages/Materials'
import Accounts from './pages/Accounts'
import Navbar from './components/Layout/Navbar.jsx';
import Auth from './components/Auth/Auth.jsx';
import Services from './pages/Services'
import InvoiceCustomizationForm from './pages/InvoiceCustomizationForm'
import EditProvider from './pages/EditProvider'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'
import { ToastProvider } from './hooks/useToast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos en caché
      retry: 1,
    },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          {token && <Navbar onLogout={handleLogout} />}
          <div style={{ paddingTop: token ? '80px' : '0' }}>
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
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
