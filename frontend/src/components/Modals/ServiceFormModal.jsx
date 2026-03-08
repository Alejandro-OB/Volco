import React from 'react';
import { DollarSign, X, Check, Plus, Loader2 } from 'lucide-react';

const ServiceFormModal = ({
  isOpen,
  onClose,
  isEditing,
  formData,
  isSubmitting,
  materials,
  accounts,
  accountIdUrlParam,
  showCustomMaterial,
  onInputChange,
  onSubmit,
  canSubmit,
  formatCurrency
}) => {
  if (!isOpen) return null;

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isEditing ? 'Editar' : 'Nuevo'} Viaje</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-300 transition-colors"><X size={24} /></button>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cuenta <Required /></label>
              <select
                name="service_account_id"
                value={formData.service_account_id}
                onChange={onInputChange}
                disabled={!!accountIdUrlParam}
                className={`w-full px-5 py-4 border-2 rounded-2xl focus:border-[#f58d2f]/30 text-sm font-bold appearance-none ${
                  !!accountIdUrlParam ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80 border-transparent' : 'bg-slate-50 text-slate-700 border-transparent'
                }`}
              >
                <option value="">Seleccionar cuenta...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.description}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Material <Required /></label>
              <select 
                name="material_id" 
                value={showCustomMaterial ? 'otro' : formData.material_id} 
                onChange={onInputChange} 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#f58d2f]/30 text-sm font-bold text-slate-700 appearance-none"
              >
                <option value="">Seleccionar material...</option>
                {materials.map(mat => <option key={mat.id} value={mat.id}>{mat.name.toUpperCase()}</option>)}
                <option value="otro">+ ESPECIFICAR OTRO</option>
              </select>
            </div>

            {showCustomMaterial && (
              <input 
                type="text" 
                name="custom_material" 
                value={formData.custom_material} 
                onChange={onInputChange} 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-orange-100 rounded-2xl text-sm font-bold" 
                placeholder="Nombre del material..." 
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cantidad <Required /></label>
                <div className="relative">
                  <input type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={onInputChange}
                    placeholder="0"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio Unitario <Required /></label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input type="number"
                    name="price"
                    value={formData.price}
                    onChange={onInputChange}
                    placeholder="0.00"
                    required
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha <Required /></label>
                <input type="date" name="service_date" value={formData.service_date} onChange={onInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
              </div>
              {formData.quantity > 0 && formData.price > 0 && (
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[9px] font-black text-[#f58d2f] uppercase">Subtotal</p>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(formData.quantity * formData.price)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 uppercase text-[11px] tracking-widest">Cerrar</button>
            <button onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`flex-[1.5] py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-xl shadow-orange-100 uppercase text-[11px] tracking-widest ${(!canSubmit || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isSubmitting ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Confirmar Registro')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceFormModal;
