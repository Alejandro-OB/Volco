import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const SIZE_MAP = {
  sm:   'max-w-xs',
  md:   'max-w-sm',
  lg:   'max-w-md',
  xl:   'max-w-lg',
  '2xl': 'max-w-xl',
  '3xl': 'max-w-2xl',
};

const BaseModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  disableClose = false,
  className = '',
  contentClassName = '',
}) => {
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen || disableClose) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, disableClose]);

  if (!isOpen) return null;

  const hasHeader = !!title;

  const modal = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
        onClick={!disableClose ? onClose : undefined}
      />
      <div
        ref={trapRef}
        className={`relative bg-white rounded-[2.5rem] shadow-2xl w-full animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden ${SIZE_MAP[size]} ${className}`}
      >
        {hasHeader ? (
          <div className="flex items-center justify-between px-8 pt-7 pb-0 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-[#1a202c]">{title}</h2>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {!disableClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-4 p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-300 hover:text-slate-500 flex-shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ) : (
          !disableClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-300 hover:text-slate-500 z-10"
            >
              <X size={18} />
            </button>
          )
        )}

        <div className={`flex-1 overflow-y-auto px-8 ${hasHeader ? 'pt-6' : 'pt-8'} pb-8 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default BaseModal;
