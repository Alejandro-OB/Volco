import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { User, Mail, FileText, Lock, Shield, Save, Loader2, AlertTriangle } from 'lucide-react';
import Button from '../components/UI/Button';

function EditProvider() {
  const { providerId } = useParams();

  const [formData, setFormData] = useState({
    name: '', document_number: '', email: '', username: '', password: '', old_password: '',
  });

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    api.get(`/providers/${providerId}/`)
      .then(res => setFormData(prev => ({ ...prev, ...res.data, password: '', old_password: '' })))
      .catch(() => showStatus('Error al cargar el perfil.', 'error'))
      .finally(() => setLoadingData(false));
  }, [providerId]);

  const showStatus = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), type === 'success' ? 3000 : 5000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
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
      const detail = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Error de conexión con el servidor.';
      showStatus(detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  if (loadingData) return (
    <div className="min-h-screen p-4 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 w-40 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-slate-900 p-4 sm:p-12 page-enter">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">Mi Perfil <span className="text-[#f58d2f]">.</span></h1>
            <p className="text-sm text-slate-400 font-medium mt-1">Identidad y credenciales del proveedor.</p>
          </div>
          <Button variant="primary" size="md" icon={saving ? Loader2 : Save} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        {/* FEEDBACK */}
        {message && (
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border mb-6 text-sm font-semibold animate-in slide-in-from-top-2 ${
            messageType === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            <AlertTriangle size={15} />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* DATOS GENERALES */}
          <div className="lg:col-span-2">
            <Section icon={<User size={15} />} title="Información de Cuenta">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Razón Social / Nombre" required>
                  <Input icon={User} type="text" value={formData.name} onChange={set('name')} />
                </Field>
                <Field label="NIT / Identificación" required>
                  <Input icon={FileText} type="text" value={formData.document_number} onChange={set('document_number')} />
                </Field>
                <Field label="Email de Notificaciones" required>
                  <Input icon={Mail} type="email" value={formData.email} onChange={set('email')} />
                </Field>
                <Field label="Usuario del Sistema" required>
                  <Input icon={Shield} type="text" value={formData.username} onChange={set('username')} />
                </Field>
              </div>
            </Section>
          </div>

          {/* SEGURIDAD */}
          <div>
            <Section icon={<Lock size={15} />} title="Seguridad">
              <div className="space-y-4">
                <Field label="Clave Actual">
                  <Input icon={Lock} type="password" value={formData.old_password} onChange={set('old_password')} placeholder="••••••••" />
                </Field>
                <Field label="Clave Nueva">
                  <Input icon={Shield} type="password" value={formData.password} onChange={set('password')} placeholder="••••••••" />
                </Field>
                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                  <AlertTriangle size={12} className="text-[#f58d2f] mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">Dejar en blanco para mantener la contraseña actual.</p>
                </div>
              </div>
            </Section>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Primitivos ──────────────────────────────────────────────────────────── */

const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
    <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-sm font-bold text-slate-600">{title}</h2>
    </div>
    {children}
  </div>
);

const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 ml-1">
      {label}{required && <span className="text-orange-500 ml-1 font-bold">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={15} />}
    <input
      {...props}
      className={`w-full bg-white border border-slate-200 rounded-2xl ${Icon ? 'pl-11' : 'pl-5'} pr-5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f58d2f]/50 transition-colors`}
    />
  </div>
);

export default EditProvider;
