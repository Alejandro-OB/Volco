import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { extractError } from '../utils/extractError';
import {
  Save, UploadCloud, Image as ImageIcon,
  FileText, CreditCard, Layout, Loader2
} from 'lucide-react';
import Select from '../components/UI/Select';
import Button from '../components/UI/Button';

function InvoiceCustomizationForm() {
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');

  const [custom, setCustom] = useState({
    logo: null, signature: null,
    include_logo: false, include_signature: false,
    include_bank_info: false, include_footer: false,
    apply_to_all_accounts: false, page_size: 'A4'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    const url = accountId ? `invoice-customizations/my/?account_id=${accountId}` : 'invoice-customizations/my/';
    api.get(url)
      .then(res => {
        if (res.status === 200 && res.data) {
          if (accountId && res.data.service_account_id == null) {
            const { id, ...rest } = res.data;
            setCustom({ ...rest, apply_to_all_accounts: false });
          } else {
            setCustom(res.data);
          }
        }
      })
      .catch(err => { if (err.response?.status !== 404) addToast('Error al cargar la configuración.', 'error'); })
      .finally(() => setLoading(false));
  }, [accountId, addToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustom(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;
    setCustom(prev => ({ ...prev, [name]: file, [`${name}_preview`]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(custom).forEach(([key, value]) => {
        if (value === null || value === undefined || key.endsWith('_url') || key.endsWith('_preview') || key === 'id' || key === 'service_account_id') return;
        formData.append(key, value);
      });

      const isOwnRecord = custom.id && (!accountId || String(custom.service_account_id) === String(accountId));

      if (accountId) {
        formData.append('service_account_id', accountId);
        if (!isOwnRecord) {
          if (custom.logo_url) formData.append('fallback_logo_url', custom.logo_url);
          if (custom.signature_url) formData.append('fallback_signature_url', custom.signature_url);
        }
      }

      const method = isOwnRecord ? 'patch' : 'post';
      const url = isOwnRecord ? `invoice-customizations/${custom.id}/` : 'invoice-customizations/';
      const res = await api[method](url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data) setCustom(res.data);
      addToast('Configuración guardada.', 'success');
    } catch (err) {
      addToast(extractError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen p-4 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 w-52 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-48 bg-slate-100 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-48 bg-slate-100 rounded-2xl" />
          </div>
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
            {accountId
              ? <span className="text-[10px] font-bold text-[#f58d2f] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">Cuenta específica</span>
              : <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">Global</span>
            }
            <h1 className="text-4xl font-black text-[#1a202c] tracking-tight mt-2">Personalización <span className="text-[#f58d2f]">.</span></h1>
            <p className="text-sm text-slate-400 font-medium mt-1">
              {accountId ? 'Configuración exclusiva para esta cuenta — sobreescribe la global.' : 'Apariencia y datos para todas las facturas.'}
            </p>
          </div>
          <Button variant="primary" size="md" icon={saving ? Loader2 : Save} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* COLUMNA PRINCIPAL */}
          <div className="lg:col-span-2 space-y-6">

            {/* IDENTIDAD VISUAL */}
            <Section icon={<ImageIcon size={15} />} title="Identidad Visual">
              <div className="grid grid-cols-2 gap-4">
                <ImageUploader label="Logo de la Empresa" name="logo" preview={custom.logo_preview || custom.logo_url} onChange={handleFileChange} />
                <ImageUploader label="Firma Autorizada" name="signature" preview={custom.signature_preview || custom.signature_url} onChange={handleFileChange} />
              </div>
            </Section>

            {/* CONTENIDO */}
            <Section icon={<FileText size={15} />} title="Contenido de Factura">
              <div className="space-y-4">
                <Field label="Encabezado de Servicios">
                  <textarea
                    name="service_text"
                    value={custom.service_text || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm text-slate-700 placeholder:text-slate-400 resize-none"
                    placeholder="Descripción general de tus servicios..."
                  />
                </Field>
                <Field label="Pie de Página">
                  <textarea
                    name="footer_message"
                    value={custom.footer_message || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm text-slate-700 placeholder:text-slate-400 resize-none"
                    placeholder="Términos, condiciones o mensaje de agradecimiento..."
                  />
                </Field>
              </div>
            </Section>

          </div>

          {/* COLUMNA LATERAL */}
          <div className="space-y-6">

            {/* DATOS DE PAGO */}
            <Section icon={<CreditCard size={15} />} title="Datos de Pago">
              <div className="space-y-3">
                <Field label="Nombre del Banco">
                  <input type="text" name="provider_bank" value={custom.provider_bank || ''} onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm text-slate-700" />
                </Field>
                <Field label="Tipo de Cuenta">
                  <input type="text" name="provider_type_account" value={custom.provider_type_account || ''} onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm text-slate-700" />
                </Field>
                <Field label="Número de Cuenta">
                  <input type="text" name="provider_number_account" value={custom.provider_number_account || ''} onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm text-slate-700" />
                </Field>
              </div>
            </Section>

            {/* AJUSTES */}
            <Section icon={<Layout size={15} />} title="Ajustes de Diseño">
              <div className="space-y-1">
                <Toggle label="Mostrar Logo" name="include_logo" checked={custom.include_logo} onChange={handleChange} />
                <Toggle label="Mostrar Firma" name="include_signature" checked={custom.include_signature} onChange={handleChange} />
                <Toggle label="Información Bancaria" name="include_bank_info" checked={custom.include_bank_info} onChange={handleChange} />
                <Toggle label="Pie de Página" name="include_footer" checked={custom.include_footer} onChange={handleChange} />
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100">
                <Field label="Tamaño de Hoja">
                  <Select name="page_size" value={custom.page_size || 'A4'} onChange={handleChange}>
                    <option value="A4">A4 (Estándar)</option>
                    <option value="Letter">Carta (8.5" × 11")</option>
                    <option value="Legal">Oficio</option>
                  </Select>
                </Field>
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

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 ml-1">{label}</label>
    {children}
  </div>
);

const ImageUploader = ({ label, name, preview, onChange }) => (
  <div className="space-y-1.5">
    <span className="text-xs font-semibold text-slate-500 ml-1">{label}</span>
    <label className={`relative h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
      preview ? 'border-[#f58d2f]/40 bg-orange-50/30' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
    }`}>
      <input type="file" name={name} onChange={onChange} className="hidden" accept="image/*" />
      {preview ? (
        <img src={preview} alt="Preview" className="h-full w-full object-contain p-4" />
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <UploadCloud className="text-slate-300" size={22} />
          <span className="text-[10px] font-semibold text-slate-400">Subir imagen</span>
        </div>
      )}
    </label>
  </div>
);

const Toggle = ({ label, name, checked, onChange }) => (
  <label className="flex items-center justify-between py-2.5 px-1 cursor-pointer group">
    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{label}</span>
    <div className="relative inline-flex items-center flex-shrink-0">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f58d2f]" />
    </div>
  </label>
);

export default InvoiceCustomizationForm;
