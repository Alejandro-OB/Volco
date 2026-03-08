import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
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
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');

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
  const addToast = useToast();
  const navigate = useNavigate();

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  useEffect(() => {
    const url = accountId ? `invoice-customizations/my/?account_id=${accountId}` : 'invoice-customizations/my/';
    api.get(url)
      .then(res => {
        if (res.status === 200 && res.data) {
          // If we loaded a global configuration but we are editing a specific account, 
          // we should strip the ID so we don't accidentally override the global one,
          // instead we force a POST for a new specialized one.
          if (accountId && res.data.service_account_id == null) {
            const { id, ...rest } = res.data;
            setCustom({ ...rest, apply_to_all_accounts: false });
          } else {
            setCustom(res.data);
          }
        }
      })
      .catch(err => {
        if (err.response?.status !== 404) {
          addToast('Error al cargar la configuración.', 'error');
        }
      })
      .finally(() => setLoading(false));
  }, [accountId]);

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
          key.endsWith('_preview') ||
          key === 'id' ||
          key === 'service_account_id'
        ) return;
        formData.append(key, value);
      });

      // Only PATCH if the loaded record is already scoped exactly to this account.
      // If we loaded a global config as a fallback, we must POST a brand new specific record.
      const isOwnRecord = custom.id && (
        !accountId ||
        String(custom.service_account_id) === String(accountId)
      );

      if (accountId) {
        formData.append('service_account_id', accountId);
        // If we're creating a new account-specific record from a global fallback,
        // inherit the existing logo/signature URLs so the user doesn't need to re-upload.
        if (!isOwnRecord) {
          if (custom.logo_url) formData.append('fallback_logo_url', custom.logo_url);
          if (custom.signature_url) formData.append('fallback_signature_url', custom.signature_url);
        }
      }

      const method = isOwnRecord ? 'patch' : 'post';
      const url = isOwnRecord
        ? `invoice-customizations/${custom.id}/`
        : 'invoice-customizations/';


      const res = await api[method](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update local state with saved record so future saves correctly use PATCH
      if (res.data) setCustom(res.data);

      addToast('Configuración guardada exitosamente.', 'success');
    } catch {
      addToast('Error al guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };


  const SkeletonTitle = () => (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 bg-slate-100 rounded-2xl animate-pulse" />
      <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );

  const SkeletonInput = () => (
    <div className="space-y-2">
      <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse ml-1" />
      <div className="h-14 bg-slate-50 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12">
      <div className="max-w-7xl mx-auto">

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 w-20 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-12 w-64 bg-slate-200 rounded-2xl animate-pulse" />
                <div className="h-4 w-full max-w-md bg-slate-50 rounded-lg animate-pulse" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {accountId && <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">Cuenta Específica</span>}
                  {!accountId && <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-purple-100">Global</span>}
                </div>
                <h1 className="text-5xl font-black text-[#1a202c] tracking-tight">Personalización</h1>
                <p className="text-slate-500 font-medium mt-1">
                  {accountId ? 'Estás personalizando el diseño exclusivo para una cuenta en particular. Esto sobreescribirá el Global solo para esta cuenta.' : 'Personaliza la apariencia y datos de tus facturas para todo el sistema.'}
                </p>
              </div>
            )}
          </div>

          {!loading && (
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


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* COLUMNA IZQUIERDA: VISUAL Y TEXTOS */}
          <div className="lg:col-span-2 space-y-8">

            {/* SECCIÓN IMÁGENES */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              {loading ? (
                <div className="space-y-8">
                  <SkeletonTitle />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="h-48 bg-slate-50 rounded-[2.5rem] animate-pulse" />
                    <div className="h-48 bg-slate-50 rounded-[2.5rem] animate-pulse" />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* SECCIÓN TEXTOS */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              {loading ? (
                <div className="space-y-8">
                  <SkeletonTitle />
                  <div className="space-y-6 mt-8">
                    <div className="h-32 bg-slate-50 rounded-[2rem] animate-pulse" />
                    <div className="h-32 bg-slate-50 rounded-[2rem] animate-pulse" />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: PAGOS Y AJUSTES */}
          <div className="space-y-8">

            {/* DATOS BANCARIOS */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              {loading ? (
                <div className="space-y-8">
                  <SkeletonTitle />
                  <div className="space-y-4 mt-8">
                    {[1, 2, 3].map(i => <SkeletonInput key={i} />)}
                  </div>
                </div>
              ) : (
                <>
                  <SectionTitle icon={<CreditCard size={20} />} title="Datos de Pago" />
                  <div className="space-y-4 mt-8">
                    <SidebarInput label="Nombre del Banco" name="provider_bank" value={custom.provider_bank} onChange={handleChange} />
                    <SidebarInput label="Tipo de Cuenta" name="provider_type_account" value={custom.provider_type_account} onChange={handleChange} />
                    <SidebarInput label="Número de Cuenta" name="provider_number_account" value={custom.provider_number_account} onChange={handleChange} />
                  </div>
                </>
              )}
            </div>

            {/* CONFIGURACIÓN DE DISEÑO */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
              {loading ? (
                <div className="space-y-8">
                  <SkeletonTitle />
                  <div className="mt-8 space-y-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse" />
                        <div className="h-6 w-11 bg-slate-200 rounded-full animate-pulse" />
                      </div>
                    ))}
                    <div className="pt-6 border-t border-slate-50">
                      <div className="h-14 bg-slate-50 rounded-2xl animate-pulse" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
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