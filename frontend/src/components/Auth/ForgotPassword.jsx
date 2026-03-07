import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await api.post('forgot-password/', { email });
      setMessage('Si el correo está registrado, recibirás las instrucciones en breve.');
      setEmail('');
    } catch (err) {
      if (err.response?.data) {
        const detail = Object.values(err.response.data).flat().join(' ');
        setError(detail || 'Error al enviar las instrucciones.');
      } else {
        setError('No se pudo conectar con el servidor.');
      }
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
              Recuperar Acceso
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f58d2f] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-2xl bg-slate-50 border-2 border-transparent pl-12 pr-4 py-3.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all shadow-sm font-medium text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mensajes de Estado */}
            {(error || message) && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl border animate-in slide-in-from-top-2 ${
                error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                {error ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                <span className="text-[11px] font-bold uppercase tracking-wider">{error || message}</span>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative inline-flex items-center justify-center gap-2 w-full max-w-[260px] rounded-xl border border-orange-600/20 bg-gradient-to-b from-[#f58d2f] to-[#e87a1c] px-10 py-3.5 text-sm font-bold text-white shadow-[0_10px_20px_-5px_rgba(245,141,47,0.4)] transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-50 border-none"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <><span>Enviar Instrucciones</span></>
                )}
              </button>
            </div>
          </form>

          {/* FOOTER ADAPTADO AL ESTILO AUTH */}
          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm font-medium text-slate-400">
              ¿Recordaste tu acceso?
              <Link
                to="/login"
                className="ml-2 font-black text-[#f58d2f] hover:text-[#e87a1c] hover:underline underline-offset-4 transition-all uppercase text-[11px] tracking-widest"
              >
                Inicia sesión
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;