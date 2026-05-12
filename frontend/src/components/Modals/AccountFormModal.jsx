import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Type, Check, Plus, X, Loader2 } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import QuickCreateClient from '../UI/QuickCreateClient';
import Select from '../UI/Select';
import DatePicker from '../UI/DatePicker';

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
  const trapRef = useFocusTrap(isOpen);
  const [showQuickClient, setShowQuickClient] = useState(false);

  if (!isOpen) return null;

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md" onClick={onClose}></div>
      <div ref={trapRef} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                <label className="text-xs font-semibold text-slate-500 ml-1">Nombre de la Cuenta <Required /></label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="text"
                    name="description"
                    placeholder="Ej: Obra Norte Fase 1"
                    className={`w-full pl-12 pr-5 py-3 bg-white border rounded-2xl focus:outline-none transition-colors text-sm font-medium text-slate-700 placeholder:text-slate-400 ${fieldErrors.description ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-[#f58d2f]/50'}`}
                    value={formData.description}
                    onChange={onInputChange}
                    required
                  />
                  {fieldErrors.description && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.description}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-semibold text-slate-500">Cliente Titular <Required /></label>
                  {!clientIdUrlParam && (
                    <button
                      type="button"
                      onClick={() => setShowQuickClient(v => !v)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#f58d2f] hover:text-[#e87a1c] transition-colors"
                    >
                      <Plus size={11} />
                      Nuevo cliente
                    </button>
                  )}
                </div>
                <Select
                  name="client_id"
                  value={formData.client_id}
                  onChange={onInputChange}
                  disabled={!!clientIdUrlParam}
                  className={fieldErrors.client_id ? 'border-red-300 focus:border-red-400' : ''}
                >
                  <option value="">Seleccione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                {fieldErrors.client_id && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.client_id}</p>}
                {showQuickClient && (
                  <QuickCreateClient
                    onCreated={(client) => {
                      onInputChange({ target: { name: 'client_id', value: String(client.id) } });
                      setShowQuickClient(false);
                    }}
                    onCancel={() => setShowQuickClient(false)}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">Fecha de Inicio <Required /></label>
                <DatePicker
                  name="start_date"
                  value={formData.start_date}
                  onChange={onInputChange}
                  placeholder="Inicio de obra"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">Fecha de Fin <Required /></label>
                <DatePicker
                  name="end_date"
                  value={formData.end_date}
                  onChange={onInputChange}
                  placeholder="Fin de obra"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button onClick={onClose} className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-sm">
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !formData.client_id || !formData.description}
              className="flex-1 px-6 py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-xl shadow-orange-100 hover:brightness-110 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 border-none"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (isEditing ? <Check size={18} /> : <Plus size={18} />)}
              {isEditing ? 'Guardar Cambios' : 'Abrir Cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AccountFormModal;
