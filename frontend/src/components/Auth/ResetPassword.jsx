import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !password2) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/reset-password/', {
        password: password,
        token: token
      });

      setSuccess("Contraseña actualizada con éxito.");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans selection:bg-[#f58d2f]/30">
      <div className="w-full max-w-[460px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        <div className="p-8 sm:p-14">
          
          {/* Header Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-5 bg-orange-50 rounded-3xl text-[#f58d2f] shadow-sm ring-1 ring-orange-100 transition-transform hover:scale-110 duration-300">
              <KeyRound size={32} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Nueva Contraseña
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed">
              Ingresa tu nueva clave de acceso para recuperar tu cuenta de forma segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                Nueva Contraseña
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f58d2f] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-slate-50 border-2 border-transparent pl-12 pr-12 py-3.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all shadow-sm font-medium text-sm"
                  required
                  disabled={loading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f58d2f] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f58d2f] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Repetir contraseña"
                  className="w-full rounded-2xl bg-slate-50 border-2 border-transparent pl-12 pr-4 py-3.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all shadow-sm font-medium text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mensajes de Estado */}
            {(error || success) && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl border animate-in slide-in-from-top-2 ${
                error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                {error ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                <span className="text-[11px] font-bold uppercase tracking-wider">{error || success}</span>
              </div>
            )}

            {/* Botón Submit */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex items-center justify-center gap-2 w-full max-w-[280px] rounded-xl border-none bg-gradient-to-b from-[#f58d2f] to-[#e87a1c] px-10 py-3.5 text-sm font-bold text-white shadow-[0_10px_20px_-5px_rgba(245,141,47,0.4)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <span>Cambiar Contraseña</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer Adaptado */}
          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm font-medium text-slate-400">
              ¿No deseas cambiarla?
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="ml-2 font-black text-[#f58d2f] hover:text-[#e87a1c] hover:underline underline-offset-4 transition-all uppercase text-[11px] tracking-widest"
              >
                Cancelar
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;