import React from 'react';

const TableActionButton = ({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {Icon && <Icon size={12} />}
    {children}
  </button>
);

export default TableActionButton;
