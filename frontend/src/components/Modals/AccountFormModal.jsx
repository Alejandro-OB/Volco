import React from 'react';
import { Type, ChevronDown, Check, Plus, X, Loader2 } from 'lucide-react';

const AccountFormModal = ({
  isOpen,
  onClose,
  isEditing,
  formData,
  fieldErrors,
  isSubmitting,
  clients,
  clientIdUrlParam,
  onInputChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-[#1a202c]">
                {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-300">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre de la Cuenta <Required /></label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="text"
                    name="description"
                    placeholder="Ej: Obra Norte Fase 1"
                    className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-bold text-slate-700 ${fieldErrors.description ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-[#f58d2f]/30'}`}
                    value={formData.description}
                    onChange={onInputChange}
                    required
                  />
                  {fieldErrors.description && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.description}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cliente Titular <Required /></label>
                <div className="relative">
                  <select
                    name="client_id"
                    className={`w-full pl-5 pr-10 py-4 border-2 rounded-2xl focus:outline-none transition-all text-sm font-bold appearance-none ${fieldErrors.client_id ? 'border-red-300 focus:border-red-400 bg-slate-50 text-slate-700' : 'border-transparent focus:border-[#f58d2f]/30'}
                      ${!!clientIdUrlParam ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80' : 'bg-slate-50 text-slate-700 cursor-pointer focus:bg-white'}
                    `}
                    value={formData.client_id}
                    onChange={onInputChange}
                    disabled={!!clientIdUrlParam}
                  >
                    <option value="">Seleccione...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  {fieldErrors.client_id && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.client_id}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Inicio <Required /></label>
                <input
                  type="date"
                  name="start_date"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                  value={formData.start_date}
                  onChange={onInputChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Fin <Required /></label>
                <input
                  type="date"
                  name="end_date"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                  value={formData.end_date}
                  onChange={onInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button onClick={onClose} className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-[11px] uppercase tracking-widest">
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !formData.client_id || !formData.description}
              className="flex-1 px-6 py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-xl shadow-orange-100 hover:brightness-110 disabled:opacity-50 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border-none"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? <Check size={18} /> : <Plus size={18} />)}
              {isEditing ? 'Guardar Cambios' : 'Abrir Cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountFormModal;
