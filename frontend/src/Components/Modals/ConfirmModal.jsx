import React, { useEffect } from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';

function ConfirmModal({ 
  show, 
  onClose, 
  onConfirm, 
  title = "Confirmar acción", 
  message,
  confirmText = "Eliminar",
  variant = "danger" // 'danger' | 'warning' | 'info'
}) {
  // Bloquear scroll del body cuando el modal está activo
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => { e.key === 'Escape' && onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  // Temas adaptados a la paleta clara
  const themes = {
    danger: "bg-red-50 border-red-100 text-red-500 shadow-[0_8px_20px_rgba(239,68,68,0.1)]",
    warning: "bg-orange-50 border-orange-100 text-[#f58d2f] shadow-[0_8px_20px_rgba(245,141,47,0.1)]",
    info: "bg-blue-50 border-blue-100 text-blue-500 shadow-[0_8px_20px_rgba(59,130,246,0.1)]"
  };

  const buttonThemes = {
    danger: "bg-red-500 hover:bg-red-600 shadow-red-100",
    warning: "bg-gradient-to-b from-[#f58d2f] to-[#e87a1c] hover:brightness-110 shadow-orange-100",
    info: "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative bg-white border border-slate-100 w-full max-w-sm rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Botón cerrar X */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X size={20} />
        </button>

        <div className="p-10 text-center">
          {/* Icono Dinámico con diseño circular premium */}
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border-2 ${themes[variant]}`}>
            {variant === 'info' ? <Info size={36} /> : <AlertTriangle size={36} strokeWidth={2.5} />}
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">
            {title}
          </h3>

          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
            {message}
          </p>
        </div>

        {/* Footer de Botones */}
        <div className="flex flex-col gap-3 p-10 pt-0">
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white transition-all active:scale-95 shadow-lg border-none ${buttonThemes[variant]}`}
          >
            {confirmText}
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-transparent"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConfirmModal;