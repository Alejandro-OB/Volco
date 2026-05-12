import { useState, useEffect, lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Sidebar from './components/Layout/Sidebar.jsx';
import { useToast } from './hooks/useToast.jsx'

const Clients = lazy(() => import('./pages/Clients'));
const Materials = lazy(() => import('./pages/Materials'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Auth = lazy(() => import('./components/Auth/Auth.jsx'));
const Services = lazy(() => import('./pages/Services'));
const InvoiceCustomizationForm = lazy(() => import('./pages/InvoiceCustomizationForm'));
const EditProvider = lazy(() => import('./pages/EditProvider'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

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
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const addToast = useToast();

  // función que se pasa al Login
  const handleLoginSuccess = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setToken(accessToken);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setIsLoggedIn(false);
  };

  // Escuchar evento de expiración de token de axiosConfig
  useEffect(() => {
    const onTokenExpired = () => {
      if (isLoggedIn) {
        addToast('Tu sesión ha expirado por seguridad. Ingresa nuevamente.', 'error');
        handleLogout();
      }
    };

    window.addEventListener('tokenExpired', onTokenExpired);
    return () => window.removeEventListener('tokenExpired', onTokenExpired);
  }, [isLoggedIn, addToast]);

  return (
    <QueryClientProvider client={queryClient}>
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
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#f58d2f]/30 border-t-[#f58d2f] rounded-full animate-spin" />
                    <span className="text-sm font-bold text-slate-400">Cargando...</span>
                  </div>
                </div>
              }>
              <Routes>
                <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/login" element={token ? <Navigate to="/" /> : <Auth onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/clientes" element={token ? <Clients /> : <Navigate to="/login" />} />
                <Route path="/servicios" element={token ? <Services /> : <Navigate to="/login" />} />
                <Route path="/materiales" element={token ? <Materials /> : <Navigate to="/login" />} />
                <Route path="/cuentas" element={token ? <Accounts /> : <Navigate to="/login" />} />
                <Route path="/register" element={token ? <Navigate to="/" /> : <Auth />} />

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
              </Suspense>
            </main>
          </div>
        </Router>
    </QueryClientProvider>
  );
}

export default App;
