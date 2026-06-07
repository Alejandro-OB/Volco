import React from 'react';
import { Loader2 } from 'lucide-react';

const ModalActions = ({
  onCancel,
  onSubmit,
  submitType = 'button',
  isSubmitting = false,
  disabled = false,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  icon: Icon,
}) => (
  <div className="mt-6 flex justify-end gap-2">
    <button
      type="button"
      onClick={onCancel}
      className="px-5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
    >
      {cancelLabel}
    </button>
    <button
      type={submitType}
      onClick={submitType === 'button' ? onSubmit : undefined}
      disabled={isSubmitting || disabled}
      className="px-5 py-2 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-xl text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
    >
      {isSubmitting
        ? <Loader2 size={13} className="animate-spin" />
        : Icon && <Icon size={13} />}
      {isSubmitting ? 'Guardando...' : submitLabel}
    </button>
  </div>
);

export default ModalActions;
