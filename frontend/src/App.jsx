import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Clients from './pages/Clients'
import Materials from './pages/Materials'
import Accounts from './pages/Accounts'
import Sidebar from './components/Layout/Sidebar.jsx';
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
          {token && <Sidebar onLogout={handleLogout} />}
          {/* Main Content Layout Container */}
          <div className="flex min-h-screen">
            {/* 
              Empty placeholder matching the sidebar width on desktop. 
              The sidebar is fixed, so this prevents content from sliding under it. 
            */}
            {token && (
              <div className="hidden md:block w-72 shrink-0"></div>
            )}
            
            {/* Main scrollable area */}
            <main className={`flex-1 flex flex-col min-w-0 ${token ? 'pt-[80px] md:pt-6 px-4 md:px-8 pb-8' : ''}`}>
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
            </main>
          </div>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
