import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, X, Check, Loader2, Save, RefreshCw, FileText, Plus } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import QuickCreateAccount from '../UI/QuickCreateAccount';
import Select from '../UI/Select';
import DatePicker from '../UI/DatePicker';

const ServiceFormModal = ({
  isOpen,
  onClose,
  isEditing,
  formData,
  isSubmitting,
  materials,
  accounts,
  clients = [],
  accountIdUrlParam,
  showCustomMaterial,
  onInputChange,
  onSubmit,
  canSubmit,
  formatCurrency,
  // material features
  priceModified,
  selectedMaterialName,
  onUpdateMaterialPrice,
  onDiscardPriceChange,
  onSaveNewMaterial,
}) => {
  const trapRef = useFocusTrap(isOpen);
  const [showQuickAccount, setShowQuickAccount] = useState(false);

  if (!isOpen) return null;

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={trapRef}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8 md:p-10">

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {isEditing ? 'Editar' : 'Nuevo'} Viaje
              </h2>
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                {isEditing ? 'Modifica los datos del registro' : 'Completa los datos del viaje'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-2xl text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-5">

            {/* Cuenta */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-slate-500">
                  Cuenta <Required />
                </label>
                {!accountIdUrlParam && (
                  <button
                    type="button"
                    onClick={() => setShowQuickAccount(v => !v)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#f58d2f] hover:text-[#e87a1c] transition-colors"
                  >
                    <Plus size={11} />
                    Nueva cuenta
                  </button>
                )}
              </div>
              <Select
                name="service_account_id"
                value={formData.service_account_id}
                onChange={onInputChange}
                disabled={!!accountIdUrlParam}
              >
                <option value="">Seleccionar cuenta...</option>
                {accounts.map(acc => {
                  const clientName = clients.find(c => c.id === acc.client_id)?.name;
                  return (
                    <option key={acc.id} value={acc.id}>
                      {clientName ? `${clientName} — ${acc.description}` : acc.description}
                    </option>
                  );
                })}
              </Select>
              {showQuickAccount && (
                <QuickCreateAccount
                  onCreated={(account) => {
                    onInputChange({ target: { name: 'service_account_id', value: String(account.id) } });
                    setShowQuickAccount(false);
                  }}
                  onCancel={() => setShowQuickAccount(false)}
                />
              )}
            </div>

            {/* Material */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Material <Required />
              </label>
              <Select
                name="material_id"
                value={showCustomMaterial ? 'otro' : formData.material_id}
                onChange={onInputChange}
              >
                <option value="">Seleccionar material...</option>
                {materials.map(mat => (
                  <option key={mat.id} value={mat.id}>{mat.name.toUpperCase()}</option>
                ))}
                <option value="otro">+ Especificar otro</option>
              </Select>
            </div>

            {/* Input material personalizado */}
            {showCustomMaterial && (
              <div className="space-y-2">
                <input
                  type="text"
                  name="custom_material"
                  value={formData.custom_material}
                  onChange={onInputChange}
                  className="w-full px-5 py-3 bg-white border border-orange-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#f58d2f]/50 focus:outline-none transition-colors"
                  placeholder="Nombre del material..."
                />
                {/* Prompt guardar nuevo material */}
                {formData.custom_material?.trim() && formData.price && (
                  <button
                    type="button"
                    onClick={onSaveNewMaterial}
                    className="flex items-center gap-2 w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Save size={13} />
                    Guardar "{formData.custom_material}" como material permanente
                  </button>
                )}
              </div>
            )}

            {/* Cantidad y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">
                  Cantidad <Required />
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={onInputChange}
                  placeholder="0"
                  min="1"
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#f58d2f]/50 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">
                  Precio Unitario <Required />
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={onInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-5 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#f58d2f]/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Prompt actualizar precio base del material */}
            {priceModified && !showCustomMaterial && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <RefreshCw size={14} className="text-amber-500 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-700 flex-1">
                  ¿Actualizar precio base de <span className="font-black">{selectedMaterialName}</span>?
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={onUpdateMaterialPrice}
                    className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    title="Sí, actualizar"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={onDiscardPriceChange}
                    className="p-1.5 rounded-lg bg-white text-amber-500 border border-amber-200 hover:bg-amber-50 transition-colors"
                    title="No, solo para este viaje"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Fecha + Subtotal */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 ml-1">
                  Fecha <Required />
                </label>
                <DatePicker
                  name="service_date"
                  value={formData.service_date}
                  onChange={onInputChange}
                  placeholder="Fecha del viaje"
                />
              </div>
              {formData.quantity > 0 && formData.price > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[9px] font-black text-[#f58d2f]">Subtotal</p>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(formData.quantity * formData.price)}</p>
                </div>
              )}
            </div>

            {/* Notas / Observaciones */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-1.5">
                <FileText size={11} className="text-slate-300" />
                Nota u observación
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes || ''}
                onChange={onInputChange}
                maxLength={200}
                placeholder="Ej: Recibió Carlos, entregado en bodega 3..."
                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-[#f58d2f]/50 focus:outline-none transition-colors"
              />
            </div>

          </div>

          {/* Botones */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-400 text-sm tracking-wide hover:border-slate-200 hover:text-slate-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`flex-[1.5] py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-lg shadow-orange-200 text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                (!canSubmit || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting
                ? <Loader2 className="animate-spin" size={18} />
                : (isEditing ? 'Guardar Cambios' : 'Confirmar Registro')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ServiceFormModal;
