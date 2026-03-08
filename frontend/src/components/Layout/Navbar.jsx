import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { decodeToken } from '../../utils/decodeToken';
import logoVolco from '../../assets/logo.webp';
import {
  Users, Wallet, Truck, FileText, Mountain,
  UserCircle, Menu, X, LogOut, ChevronDown, Settings, CreditCard
} from 'lucide-react';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [providerId, setProviderId] = useState(null);
  const dropdownRef = useRef(null);
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
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Match nested routes so the correct nav item highlights
  // These MUST be before any early return (React rules of hooks)
  const matchCuentas = useMatch('/clientes/:clientId/cuentas');
  const matchServicios = useMatch('/cuentas/:accountId/servicios');

  if (!isLoggedIn) return null;

  const navLinks = [
    { to: '/clientes', label: 'Clientes', icon: Users, end: true },
    { to: '/cuentas', label: 'Cuentas', icon: Wallet, end: true, extraActive: !!matchCuentas },
    { to: '/servicios', label: 'Servicios', icon: Truck, extraActive: !!matchServicios },
    { to: '/materiales', label: 'Materiales', icon: Mountain },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-100 z-[1000] flex items-center justify-between px-6 md:px-12 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">

      {/* SECCIÓN IZQUIERDA */}
      <div className="flex items-center gap-6">
        <button
          className="md:hidden text-slate-400 hover:text-[#f58d2f] transition-colors p-2 rounded-xl hover:bg-slate-50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        {/* Logo: absolute-centered on mobile, static on desktop */}
        <div
          className="md:static absolute left-1/2 md:left-auto md:translate-x-0 -translate-x-1/2 cursor-pointer shrink-0 transition-all duration-300 hover:scale-105 hover:opacity-90"
          onClick={() => navigate('/clientes')}
        >
          <img
            src={logoVolco}
            alt="Volco"
            className="h-14 md:h-16 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))' }}
          />
        </div>
      </div>

      {/* SECCIÓN CENTRAL (ESCRITORIO) */}
      <div className="hidden md:flex items-center gap-1 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => {
              const active = isActive || link.extraActive;
              return `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
              ${active ? 'bg-white text-[#f58d2f] shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`;
            }}
          >
            {({ isActive }) => {
              const active = isActive || link.extraActive;
              return (<>
                <link.icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span>{link.label}</span>
              </>);
            }}
          </NavLink>
        ))}
      </div>

      {/* SECCIÓN DERECHA (DROPDOWN MEJORADO) */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl border transition-all group ${dropdownOpen ? 'bg-white border-[#f58d2f] shadow-lg shadow-orange-50' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200'
            }`}
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] flex items-center justify-center text-white shadow-md shadow-orange-100 transition-transform group-hover:scale-105">
            <UserCircle size={20} />
          </div>
          <div className="hidden lg:flex flex-col items-start leading-tight">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panel de Control</span>
            <span className="text-sm font-bold text-slate-700">{username || 'Usuario'}</span>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-500 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-100 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">

            {/* Header Dropdown */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-[#f58d2f]">
                  <Settings size={20} className="animate-spin-slow" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Gestionar Cuenta</p>
                  <p className="text-sm font-bold text-slate-800 truncate w-40">{username || 'Usuario'}</p>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="p-3 space-y-1">
              <button
                onClick={() => navigate(providerId ? `/proveedor/editar/${providerId}` : '/proveedor/editar')}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-600 hover:text-[#f58d2f] hover:bg-orange-50 transition-all group"
              >
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                  <UserCircle size={18} />
                </div>
                <span>Datos del Proveedor</span>
              </button>

              {/* OPCIÓN FACTURA MOVIDA AQUÍ */}
              <button
                onClick={() => navigate('/factura/personalizar')}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-600 hover:text-[#f58d2f] hover:bg-orange-50 transition-all group"
              >
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                  <FileText size={18} />
                </div>
                <span>Personalización</span>
              </button>

              <div className="h-[1px] bg-slate-100 mx-4 my-2"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="p-2 rounded-lg bg-red-50 transition-colors">
                  <LogOut size={18} />
                </div>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MENÚ MÓVIL --- */}
      {menuOpen && (
        <div className="absolute top-[80px] left-4 right-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl md:hidden overflow-hidden z-[1001] animate-in slide-in-from-top-5">
          <div className="flex flex-col p-6 gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all
                  ${isActive ? 'bg-orange-50 text-[#f58d2f]' : 'text-slate-500 hover:bg-slate-50'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{link.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;