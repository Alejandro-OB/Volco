import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
  User, Mail, FileText, Lock, Shield, Save, 
  Loader2, CheckCircle, AlertTriangle, UserCog, ArrowLeft
} from 'lucide-react';

function EditProvider() {
  const { providerId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    document_number: '',
    email: '',
    username: '',
    password: '',
    old_password: '',
  });

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const resp = await api.get(`/providers/${providerId}/`);
        setFormData(prev => ({
          ...prev,
          ...resp.data,
          password: '',
          old_password: '',
        }));
      } catch (err) {
        showStatus('Error al sincronizar datos del perfil.', 'error');
      } finally {
        setLoadingData(false);
      }
    };
    fetchProfile();
  }, [providerId]);

  const showStatus = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), type === 'success' ? 3000 : 5000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    const payload = {
      name: formData.name,
      document_number: formData.document_number,
      email: formData.email,
      username: formData.username,
    };

    if (formData.password && formData.old_password) {
      payload.password = formData.password;
      payload.old_password = formData.old_password;
    }

    try {
      await api.patch(`/providers/${providerId}/`, payload);
      showStatus('Perfil actualizado con éxito.', 'success');
      setFormData(prev => ({ ...prev, password: '', old_password: '' }));
    } catch (err) {
      const errorDetail = err.response?.data 
        ? Object.values(err.response.data).flat().join(' ') 
        : 'Error de conexión con el servidor.';
      showStatus(errorDetail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = "w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] pl-12 pr-5 py-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all font-bold text-sm";
  const labelStyle = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-1 block";

  const SkeletonInput = () => (
    <div className="space-y-2">
      <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse ml-2" />
      <div className="h-14 bg-slate-50 rounded-[1.5rem] animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-12 font-sans flex justify-center items-start">
      <div className="w-full max-w-7xl animate-in fade-in duration-500">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          {loadingData ? (
            <div className="space-y-4 w-full max-w-md">
              <div className="h-12 w-48 bg-slate-200 rounded-2xl animate-pulse" />
              <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-5xl font-black text-[#1a202c] tracking-tight">Mi Perfil</h1>
                <p className="text-slate-500 font-medium mt-1">Gestión de identidad y credenciales del proveedor.</p>
              </div>
            </div>
          )}

          {!loadingData && (
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 border-none"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>

        {/* ALERTA DE FEEDBACK */}
        {message && (
          <div className={`flex items-center gap-3 p-6 rounded-[2rem] border-2 mb-10 animate-in slide-in-from-top-2 ${
            messageType === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {messageType === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            <span className="font-black text-[10px] uppercase tracking-widest leading-tight">{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center gap-6">
                {loadingData ? (
                  <div className="h-16 w-16 bg-slate-100 rounded-[1.5rem] animate-pulse" />
                ) : (
                  <div className="h-16 w-16 bg-orange-50 rounded-[1.5rem] text-[#f58d2f] flex items-center justify-center border border-orange-100 shadow-sm">
                    <UserCog size={32} />
                  </div>
                )}
                <div className="space-y-2">
                  {loadingData ? (
                    <>
                      <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse" />
                      <div className="h-3 w-32 bg-slate-100 rounded-lg animate-pulse" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-black text-[#1a202c] uppercase tracking-tight">Información de Cuenta</h3>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Sincronización de Identidad</p>
                    </>
                  )}
                </div>
              </div>

              <div className="p-10">
                {loadingData ? (
                  <div className="space-y-8">
                    <div className="h-3 w-28 bg-slate-100 rounded-full animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {[1, 2, 3, 4].map(i => <SkeletonInput key={i} />)}
                    </div>
                  </div>
                ) : (
                  <form className="space-y-8">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Datos Generales</span>
                      <div className="h-[1px] flex-1 bg-slate-50" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1">
                        <label className={labelStyle}>Razón Social / Nombre <Required /></label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className={inputStyle}
                           required />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className={labelStyle}>NIT / Identificación <Required /></label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text"
                           value={formData.document_number}
                           onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                           className={inputStyle}
                           required />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className={labelStyle}>Email Notificaciones <Required /></label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="email"
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           className={inputStyle}
                           required />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className={labelStyle}>Usuario del Sistema <Required /></label>
                        <div className="relative">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text"
                           value={formData.username}
                           onChange={(e) => setFormData({...formData, username: e.target.value})}
                           className={inputStyle}
                           required />
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: SEGURIDAD */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              {loadingData ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-11 w-11 bg-slate-100 rounded-2xl animate-pulse" />
                    <div className="h-4 w-24 bg-slate-200 rounded-lg animate-pulse" />
                  </div>
                  <SkeletonInput />
                  <SkeletonInput />
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse mt-4" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-orange-50 text-[#f58d2f] border border-orange-100">
                      <Lock size={20} />
                    </div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Seguridad</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className={labelStyle}>Clave Actual</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="password" value={formData.old_password} onChange={(e) => setFormData({...formData, old_password: e.target.value})} placeholder="••••••••" className={inputStyle} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className={labelStyle}>Clave Nueva</label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className={inputStyle} />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50 flex items-start gap-3">
                      <div className="mt-0.5">
                        <AlertTriangle size={14} className="text-[#f58d2f]" />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        Dejar en blanco para mantener la contraseña actual.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default EditProvider;