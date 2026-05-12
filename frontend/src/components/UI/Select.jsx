import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({
  value,
  onChange,
  name,
  disabled = false,
  compact = false,
  className = '',
  children,
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({});
  const triggerRef = useRef(null);
  const dropRef = useRef(null);

  const options = React.Children.toArray(children)
    .filter(child => child.type === 'option')
    .map(child => ({
      value: String(child.props.value ?? ''),
      label: child.props.children,
      disabled: !!child.props.disabled,
    }));

  const selected = options.find(o => o.value === String(value ?? ''));

  const openDropdown = () => {
    if (disabled) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleSelect = (optValue) => {
    onChange({ target: { name, value: optValue } });
    setOpen(false);
  };

  const btnBase = compact
    ? 'px-3 py-2 text-xs rounded-xl'
    : 'px-4 py-3 text-sm rounded-2xl';

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={openDropdown}
          className={`w-full bg-white border font-medium flex items-center justify-between transition-colors focus:outline-none ${btnBase}
            ${open ? 'border-[#f58d2f]/50' : 'border-slate-200 hover:border-slate-300'}
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `}
          {...props}
        >
          <span className={selected && selected.value !== '' ? 'text-slate-700 truncate' : 'text-slate-400'}>
            {selected?.label ?? 'Seleccionar...'}
          </span>
          <ChevronDown
            size={compact ? 14 : 16}
            className={`flex-shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180 text-[#f58d2f]' : 'text-slate-400'}`}
          />
        </button>
      </div>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 max-h-60 overflow-y-auto"
        >
          {options.map(opt => {
            const isSelected = opt.value === String(value ?? '');
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-4 py-2.5 text-sm font-semibold text-left flex items-center justify-between gap-2 transition-colors
                  ${isSelected ? 'bg-orange-50 text-[#f58d2f]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="text-[#f58d2f] flex-shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default Select;
