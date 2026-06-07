import React from 'react';
import { Box, DollarSign, Truck, Check, Plus } from 'lucide-react';
import BaseModal from './BaseModal';
import ModalActions from '../UI/ModalActions';

const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

const MaterialFormModal = ({
  isOpen,
  onClose,
  isEditing,
  formData,
  fieldErrors,
  isSubmitting,
  onFieldChange,
  onSubmit,
}) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title={isEditing ? 'Editar Material' : 'Nuevo Material'}
    size="md"
  >
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center">
          Nombre del Material <Required />
        </label>
        <div className="relative">
          <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onFieldChange}
            placeholder="Ej: Arena"
            required
            className={`w-full bg-white border rounded-2xl pl-12 pr-5 py-3 outline-none transition-colors text-sm font-medium text-slate-700 placeholder:text-slate-400 ${
              fieldErrors.name ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-[#f58d2f]/50'
            }`}
          />
          {fieldErrors.name && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">Precio Base (COP)</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={onFieldChange}
              placeholder="0"
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 ml-1">Precio Transporte (COP)</label>
          <div className="relative">
            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="number"
              name="transport_price"
              value={formData.transport_price ?? ''}
              onChange={onFieldChange}
              placeholder="0"
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <p className="text-[10px] text-slate-400 ml-1">Solo si el transporte tiene precio distinto</p>
        </div>
      </div>

      <ModalActions
        onCancel={onClose}
        submitType="submit"
        isSubmitting={isSubmitting}
        disabled={!formData.name.trim()}
        submitLabel={isEditing ? 'Actualizar' : 'Crear Material'}
        icon={isEditing ? Check : Plus}
      />
    </form>
  </BaseModal>
);

export default MaterialFormModal;
