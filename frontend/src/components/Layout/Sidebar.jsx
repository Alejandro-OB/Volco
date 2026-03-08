import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { decodeToken } from '../../utils/decodeToken';
import logoVolco from '../../assets/logo.webp';
import {
  Users, Wallet, Truck, FileText, Mountain,
  UserCircle, Menu, X, LogOut, ChevronDown, Settings, CreditCard, ChevronRight, LayoutDashboard
} from 'lucide-react';

function Sidebar({ onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [providerId, setProviderId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const access = localStorage.getItem('access_token');
  const isLoggedIn = !!access;

  useEffect(() => {
    if (access) {
      const decoded = decodeToken(access);
      if (decoded?.sub) setUsername(decoded.sub);
      if (decoded?.provider_id) setProviderId(decoded.provider_id);
    }
  }, [access]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    }
  };

  const matchCuentas = useMatch('/clientes/:clientId/cuentas');
  const matchServicios = useMatch('/cuentas/:accountId/servicios');

  if (!isLoggedIn) return null;

  const navLinks = [
    { to: '/', label: 'Panel', icon: LayoutDashboard },
    { to: '/clientes', label: 'Clientes', icon: Users, end: true },
    { to: '/cuentas', label: 'Cuentas', icon: Wallet, end: true, extraActive: !!matchCuentas },
    { to: '/servicios', label: 'Servicios', icon: Truck, extraActive: !!matchServicios },
    { to: '/materiales', label: 'Materiales', icon: Mountain },
  ];

  return (
    <>
      {/* Mobile Top Header (Visible only on mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-100 z-40 flex items-center justify-between px-6 shadow-sm">
        <button
          className="text-slate-500 hover:text-[#f58d2f] transition-colors p-2 -ml-2 rounded-xl hover:bg-slate-50"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <img
          src={logoVolco}
          alt="Volco"
          className="h-12 w-auto object-contain cursor-pointer"
          onClick={() => navigate('/clientes')}
        />
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container (Fixed on Desktop, Drawer on Mobile) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-100 z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Close Button */}
        <button
          className="md:hidden absolute top-5 right-5 text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-slate-50 transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>

        {/* Brand, Logo & User */}
        <div className="py-7 flex flex-col items-center justify-center border-b border-slate-100/60 shrink-0 gap-3 bg-slate-50/30">
          <img
            src={logoVolco}
            alt="Volco"
            className="h-14 w-auto object-contain cursor-pointer transition-transform hover:scale-[1.03] duration-300"
            onClick={() => navigate('/clientes')}
          />
          <div className="flex flex-col items-center mt-1">
            <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase mb-0.5">
              Bienvenido
            </span>
            <span className="text-sm font-bold text-slate-700">
              {username || 'Usuario'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto w-full px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => {
                const active = isActive || link.extraActive;
                return `flex items-center justify-between px-4 py-3.5 rounded-2xl text-[15px] font-bold transition-all duration-300 group
                ${
                  active
                    ? 'bg-orange-50/80 text-[#f58d2f] shadow-sm ring-1 ring-[#f58d2f]/20'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`;
              }}
            >
              {({ isActive }) => {
                const active = isActive || link.extraActive;
                return (
                  <>
                    <div className="flex items-center gap-3.5">
                      <link.icon
                        size={20}
                        strokeWidth={active ? 2.5 : 2}
                        className={active ? 'text-[#f58d2f]' : 'text-slate-400 group-hover:text-[#f58d2f] transition-colors'}
                      />
                      <span>{link.label}</span>
                    </div>
                    {/* Active Indicator Chevron */}
                    {active && <ChevronRight size={16} className="text-[#f58d2f]/50" />}
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>

        {/* Settings & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto shrink-0 flex flex-col gap-2">
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => navigate(providerId ? `/proveedor/editar/${providerId}` : '/proveedor/editar')}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-[13px] font-bold text-slate-600 hover:text-[#f58d2f] hover:bg-orange-50/50 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#f58d2f] group-hover:border-orange-200 transition-colors">
                <Settings size={18} strokeWidth={2.5} />
              </div>
              <span>Datos del Proveedor</span>
            </button>

            <button
              onClick={() => navigate('/factura/personalizar')}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-[13px] font-bold text-slate-600 hover:text-[#f58d2f] hover:bg-orange-50/50 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#f58d2f] group-hover:border-orange-200 transition-colors">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <span>Configurar Factura</span>
            </button>
          </div>

          <div className="h-[1px] bg-slate-200/50 mx-2 my-1" />

          {/* Persistent Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full mt-1 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition-colors group shadow-sm"
          >
            <LogOut size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
