import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  CreditCard,
  Layout,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  Check
} from 'lucide-react';

function InvoiceCustomizationForm() {
  const [custom, setCustom] = useState({
    logo: null,
    signature: null,
    include_logo: false,
    include_signature: false,
    include_bank_info: false,
    include_footer: false,
    apply_to_all_accounts: false,
    page_size: 'A4'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  const navigate = useNavigate();

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  useEffect(() => {
    api.get('invoice-customizations/my/')
      .then(res => {
        if (res.status === 200 && res.data) setCustom(res.data);
      })
      .catch(err => {
        if (err.response?.status !== 404) {
          showMessage('Error al cargar la configuración.', 'error');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType('');
    }, 4000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustom(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCustom(prev => ({
      ...prev,
      [name]: file,
      [`${name}_preview`]: previewUrl
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      Object.entries(custom).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          key.endsWith('_url') ||
          key.endsWith('_preview')
        ) return;
        formData.append(key, value);
      });

      const method = custom.id ? 'patch' : 'post';
      const url = custom.id
        ? `invoice-customizations/${custom.id}/`
        : 'invoice-customizations/';

      await api[method](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showMessage('Configuración guardada exitosamente.', 'success');
    } catch {
      showMessage('Error al guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#f58d2f] mb-4" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Sincronizando Branding...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div>
              <h1 className="text-5xl font-black text-[#1a202c] tracking-tight">Branding</h1>
              <p className="text-slate-500 font-medium mt-1">Personaliza la apariencia y datos de tus facturas.</p>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 border-none"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* ALERTA DE FEEDBACK */}
        {message && (
          <div className={`mb-8 flex items-center gap-3 px-6 py-4 rounded-[2rem] border-2 animate-in fade-in slide-in-from-top-2 ${
            messageType === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {messageType === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: VISUAL Y TEXTOS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SECCIÓN IMÁGENES */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              <SectionTitle icon={<ImageIcon size={20} />} title="Identidad Visual" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <ImageUploader
                  label="Logo de la Empresa"
                  name="logo"
                  preview={custom.logo_preview || custom.logo_url}
                  onChange={handleFileChange}
                />
                <ImageUploader
                  label="Firma Autorizada"
                  name="signature"
                  preview={custom.signature_preview || custom.signature_url}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* SECCIÓN TEXTOS */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              <SectionTitle icon={<FileText size={20} />} title="Contenido de Factura" />
              <div className="space-y-6 mt-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Encabezado de Servicios</label>
                  <textarea
                    name="service_text"
                    value={custom.service_text || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-6 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                    placeholder="Escribe la descripción general de tus servicios..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje de Pie de Página</label>
                  <textarea
                    name="footer_message"
                    value={custom.footer_message || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-6 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                    placeholder="Términos, condiciones o mensajes de agradecimiento..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: PAGOS Y AJUSTES */}
          <div className="space-y-8">
            
            {/* DATOS BANCARIOS */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              <SectionTitle icon={<CreditCard size={20} />} title="Datos de Pago" />
              <div className="space-y-4 mt-8">
                <SidebarInput label="Nombre del Banco" name="provider_bank" value={custom.provider_bank} onChange={handleChange} />
                <SidebarInput label="Tipo de Cuenta" name="provider_type_account" value={custom.provider_type_account} onChange={handleChange} />
                <SidebarInput label="Número de Cuenta" name="provider_number_account" value={custom.provider_number_account} onChange={handleChange} />
              </div>
            </div>

            {/* CONFIGURACIÓN DE DISEÑO */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              <SectionTitle icon={<Layout size={20} />} title="Ajustes de Diseño" />
              <div className="mt-8 space-y-4">
                <ToggleItem label="Mostrar Logo" name="include_logo" checked={custom.include_logo} onChange={handleChange} />
                <ToggleItem label="Mostrar Firma" name="include_signature" checked={custom.include_signature} onChange={handleChange} />
                <ToggleItem label="Información Bancaria" name="include_bank_info" checked={custom.include_bank_info} onChange={handleChange} />
                <ToggleItem label="Pie de Página" name="include_footer" checked={custom.include_footer} onChange={handleChange} />
                
                <div className="pt-6 mt-4 border-t border-slate-50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tamaño de Hoja</label>
                  <select
                    name="page_size"
                    value={custom.page_size || 'A4'}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="A4">A4 (Estándar)</option>
                    <option value="Letter">Carta (8.5" x 11")</option>
                    <option value="Legal">Oficio</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== COMPONENTES DE UI ESTILO "VOLCO LIGHT" ===================== */

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-3">
    <div className="p-3 rounded-2xl bg-orange-50 text-[#f58d2f] border border-orange-100">
      {icon}
    </div>
    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-widest text-sm">{title}</h2>
  </div>
);

const ImageUploader = ({ label, name, preview, onChange }) => (
  <div className="space-y-3">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</span>
    <label className={`
      relative h-48 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
      ${preview ? 'border-[#f58d2f] bg-orange-50/30' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}
    `}>
      <input type="file" name={name} onChange={onChange} className="hidden" accept="image/*" />
      {preview ? (
        <img src={preview} alt="Preview" className="h-full w-full object-contain p-6 drop-shadow-md" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <UploadCloud className="text-slate-300" size={32} />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subir Imagen</span>
        </div>
      )}
    </label>
  </div>
);

const SidebarInput = ({ label, name, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value || ''}
      onChange={onChange}
      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
    />
  </div>
);

const ToggleItem = ({ label, name, checked, onChange }) => (
  <label className="flex items-center justify-between p-1 cursor-pointer group">
    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{label}</span>
    <div className="relative inline-flex items-center">
      <input 
        type="checkbox" 
        name={name} 
        checked={checked} 
        onChange={onChange} 
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f58d2f]"></div>
    </div>
  </label>
);

export default InvoiceCustomizationForm;