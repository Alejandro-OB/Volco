import React from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Box, DollarSign, Check, Plus } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Button from '../UI/Button';

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
}) => {
  const trapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" onClick={onClose}></div>
      <div ref={trapRef} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={onSubmit} className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-[#1a202c]">
                {isEditing ? 'Editar Material' : 'Nuevo Material'}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-300">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center">Nombre del Material <Required /></label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Precio Base (COP)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={onFieldChange}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-5 py-3 outline-none focus:border-[#f58d2f]/50 transition-colors text-sm font-medium text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 flex gap-4">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSubmitting}
              isDisabled={!formData.name.trim()}
              icon={isEditing ? Check : Plus}
            >
              {isEditing ? 'Actualizar' : 'Crear Material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MaterialFormModal;
