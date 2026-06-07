import React, { useState } from 'react';
import { DollarSign, X, Check, Loader2, Database, RefreshCw, Plus, Truck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { QK } from '../../api/queries';
import BaseModal from './BaseModal';
import AccountFormModal from './AccountFormModal';
import ModalActions from '../UI/ModalActions';
import Select from '../UI/Select';
import DatePicker from '../UI/DatePicker';

const emptyAccountForm = { description: '', client_id: '', start_date: '', end_date: '' };

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
  priceModified,
  selectedMaterialName,
  onUpdateMaterialPrice,
  onDiscardPriceChange,
  onSaveNewMaterial,
  onToggleTransport,
}) => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [saveMaterialDismissed, setSaveMaterialDismissed] = useState(false);

  React.useEffect(() => { setSaveMaterialDismissed(false); }, [formData.custom_material]);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [accountFieldErrors, setAccountFieldErrors] = useState({});
  const queryClient = useQueryClient();

  const createAccountMutation = useMutation({
    mutationFn: (data) => api.post('service-accounts/', data).then(r => r.data),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: QK.accounts });
      onInputChange({ target: { name: 'service_account_id', value: String(account.id) } });
      setShowAccountModal(false);
      setAccountForm(emptyAccountForm);
      setAccountFieldErrors({});
    },
  });

  const handleAccountInput = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({ ...prev, [name]: value }));
    if (accountFieldErrors[name]) setAccountFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAccountSubmit = (e) => {
    e?.preventDefault?.();
    const errors = {};
    if (!accountForm.description.trim()) errors.description = 'El nombre es obligatorio';
    if (!accountForm.client_id) errors.client_id = 'Selecciona un cliente';
    if (!accountForm.start_date) errors.start_date = 'La fecha de inicio es obligatoria';
    if (!accountForm.end_date) errors.end_date = 'La fecha de fin es obligatoria';
    if (Object.keys(errors).length) { setAccountFieldErrors(errors); return; }
    createAccountMutation.mutate({ ...accountForm, client_id: Number(accountForm.client_id) });
  };

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  return (
    <>
      <BaseModal
        isOpen={isOpen && !showAccountModal}
        onClose={onClose}
        title={`${isEditing ? 'Editar' : 'Nuevo'} Viaje`}
        subtitle={isEditing ? 'Modifica los datos del registro' : 'Completa los datos del viaje'}
        size="lg"
      >
        <div className="space-y-5">

          {/* Cuenta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-semibold text-slate-500">Cuenta <Required /></label>
              {!accountIdUrlParam && (
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
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
          </div>

          {/* Material */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">Material <Required /></label>
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

          {/* Toggle solo transporte */}
          <button
            type="button"
            onClick={() => onToggleTransport?.(!formData.is_transport_only)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-all text-left ${
              formData.is_transport_only
                ? 'bg-orange-50 border-orange-200 text-[#f58d2f]'
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className={`w-9 h-5 rounded-full flex-shrink-0 flex items-center transition-all px-0.5 ${
              formData.is_transport_only ? 'bg-[#f58d2f] justify-end' : 'bg-slate-200 justify-start'
            }`}>
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
            <Truck size={14} className="flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold leading-none">Solo transporte</p>
              {formData.is_transport_only && (
                <p className="text-[10px] mt-0.5 text-orange-400 leading-none">El precio se ajusta al de transporte del material</p>
              )}
            </div>
          </button>

          {/* Material personalizado */}
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
              {formData.custom_material?.trim() && formData.price && !saveMaterialDismissed && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <Database size={14} className="text-amber-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-700 flex-1">
                    ¿Guardar <span className="font-black">"{formData.custom_material}"</span> como material permanente?
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={onSaveNewMaterial}
                      className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                      title="Sí, guardar"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaveMaterialDismissed(true)}
                      className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                      title="No, solo para este viaje"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cantidad y Precio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Cantidad <Required /></label>
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
              <label className="text-xs font-semibold text-slate-500 ml-1">Precio Unitario <Required /></label>
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

          {/* Prompt actualizar precio base */}
          {priceModified && !showCustomMaterial && (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <RefreshCw size={14} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700 flex-1">
                ¿Actualizar {formData.is_transport_only ? 'precio de transporte' : 'precio base'} de <span className="font-black">{selectedMaterialName}</span>?
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onUpdateMaterialPrice}
                  className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                  title="Sí, actualizar"
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={onDiscardPriceChange}
                  className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
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
              <label className="text-xs font-semibold text-slate-500 ml-1">Fecha <Required /></label>
              <DatePicker
                name="service_date"
                value={formData.service_date}
                onChange={onInputChange}
                placeholder="Fecha del viaje"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Subtotal</label>
              <div className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-500 tabular-nums select-none cursor-default">
                {formatCurrency((formData.quantity || 0) * (formData.price || 0))}
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">Nota u observación</label>
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

        <ModalActions
          onCancel={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={!canSubmit}
          submitLabel={isEditing ? 'Guardar Cambios' : 'Confirmar Registro'}
        />
      </BaseModal>

      <AccountFormModal
        isOpen={showAccountModal}
        onClose={() => { setShowAccountModal(false); setAccountForm(emptyAccountForm); setAccountFieldErrors({}); }}
        isEditing={false}
        formData={accountForm}
        fieldErrors={accountFieldErrors}
        isSubmitting={createAccountMutation.isPending}
        clients={clients}
        onInputChange={handleAccountInput}
        onSubmit={handleAccountSubmit}
      />
    </>
  );
};

export default ServiceFormModal;
