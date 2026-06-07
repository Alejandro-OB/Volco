import React, { useState } from 'react';
import { Type, Check, Plus } from 'lucide-react';
import ModalActions from '../UI/ModalActions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { QK } from '../../api/queries';
import BaseModal from './BaseModal';
import ClientFormModal from './ClientFormModal';
import Select from '../UI/Select';
import DatePicker from '../UI/DatePicker';

const emptyClientForm = { name: '', email: '', address: '', phone_number: '' };

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
  onSubmit,
}) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [clientFieldErrors, setClientFieldErrors] = useState({});
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: (data) => api.post('clients/', data).then(r => r.data),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: QK.clients });
      onInputChange({ target: { name: 'client_id', value: String(client.id) } });
      setShowClientModal(false);
      setClientForm(emptyClientForm);
    },
  });

  const handleClientInput = (e) => {
    const { name, value } = e.target;
    setClientForm(prev => ({ ...prev, [name]: value }));
    if (clientFieldErrors[name]) setClientFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleClientSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!clientForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (Object.keys(errors).length) { setClientFieldErrors(errors); return; }
    const clean = Object.fromEntries(
      Object.entries(clientForm).map(([k, v]) => [k, v?.trim() || null])
    );
    createClientMutation.mutate(clean);
  };

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  return (
    <>
      <BaseModal
        isOpen={isOpen && !showClientModal}
        onClose={onClose}
        title={isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
        size="xl"
      >
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
                    onClick={() => setShowClientModal(true)}
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Fecha de Inicio <Required /></label>
              <DatePicker name="start_date" value={formData.start_date} onChange={onInputChange} placeholder="Inicio de obra" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Fecha de Fin <Required /></label>
              <DatePicker name="end_date" value={formData.end_date} onChange={onInputChange} placeholder="Fin de obra" />
            </div>
          </div>
        </div>

        <ModalActions
          onCancel={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={!formData.client_id || !formData.description}
          submitLabel={isEditing ? 'Guardar Cambios' : 'Abrir Cuenta'}
          icon={isEditing ? Check : Plus}
        />
      </BaseModal>

      <ClientFormModal
        isOpen={showClientModal}
        onClose={() => { setShowClientModal(false); setClientForm(emptyClientForm); setClientFieldErrors({}); }}
        isEditing={false}
        formData={clientForm}
        fieldErrors={clientFieldErrors}
        isSubmitting={createClientMutation.isPending}
        onInputChange={handleClientInput}
        onSubmit={handleClientSubmit}
      />
    </>
  );
};

export default AccountFormModal;
