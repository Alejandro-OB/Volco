import React from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import BaseModal from './BaseModal';
import ModalActions from '../UI/ModalActions';

const input = (extra = '') =>
  `w-full bg-white border rounded-2xl pl-12 pr-4 py-3 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-colors ${extra}`;

const ClientFormModal = ({
  isOpen,
  onClose,
  isEditing,
  formData,
  fieldErrors,
  isSubmitting,
  onInputChange,
  onSubmit,
}) => {
  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center">
            Razón Social / Nombre <Required />
          </label>
          <div className="relative group">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
            <input
              name="name"
              required
              value={formData.name}
              onChange={onInputChange}
              className={input(fieldErrors.name ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-[#f58d2f]/50')}
              placeholder="Ej. Juan Pérez o Empresa S.A."
            />
            {fieldErrors.name && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">Email</label>
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={onInputChange}
                className={input('border-slate-200 focus:border-[#f58d2f]/50')}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">Teléfono</label>
            <div className="relative group">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
              <input
                name="phone_number"
                value={formData.phone_number}
                onChange={onInputChange}
                className={input('border-slate-200 focus:border-[#f58d2f]/50')}
                placeholder="+57 300..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">Dirección de Oficina</label>
          <div className="relative group">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
            <input
              name="address"
              value={formData.address}
              onChange={onInputChange}
              className={input('border-slate-200 focus:border-[#f58d2f]/50')}
              placeholder="Calle 123 #45-67..."
            />
          </div>
        </div>

        <ModalActions
          onCancel={onClose}
          submitType="submit"
          isSubmitting={isSubmitting}
          disabled={!formData.name.trim()}
          submitLabel={isEditing ? 'Actualizar' : 'Registrar'}
          icon={Save}
        />
      </form>
    </BaseModal>
  );
};

export default ClientFormModal;
