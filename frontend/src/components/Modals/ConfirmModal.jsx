import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Info, Trash2 } from 'lucide-react';

function ConfirmModal({
  show,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message,
  confirmText = "Eliminar",
  variant = "danger" // 'danger' | 'warning' | 'info'
}) {
  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { e.key === 'Escape' && onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [show, onClose]);

  if (!show) return null;

  const iconConfig = {
    danger: { icon: <Trash2 size={22} strokeWidth={2} />, bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
    warning: { icon: <AlertTriangle size={22} strokeWidth={2} />, bg: 'bg-orange-50', text: 'text-[#f58d2f]', border: 'border-orange-100' },
    info: { icon: <Info size={22} strokeWidth={2} />, bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
  };

  const confirmButtonConfig = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-[#f58d2f] hover:bg-[#e87a1c] text-white',
    info: 'bg-slate-800 hover:bg-slate-900 text-white',
  };

  const { icon, bg, text, border } = iconConfig[variant];

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-8 pb-6 text-center">
          {/* Icon */}
          <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border ${bg} ${text} ${border}`}>
            {icon}
          </div>

          <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${confirmButtonConfig[variant]}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ConfirmModal;