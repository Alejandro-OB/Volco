import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  icon: Icon,
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] text-white shadow-[0_8px_16px_-4px_rgba(245,141,47,0.4)] hover:shadow-[0_12px_20px_-4px_rgba(245,141,47,0.5)] hover:scale-[1.02] border border-orange-600/20',
    secondary: 'bg-white text-slate-700 border-2 border-slate-100 hover:border-[#f58d2f]/30 hover:bg-orange-50/30 shadow-sm',
    ghost: 'bg-transparent text-slate-400 hover:text-[#f58d2f] hover:bg-orange-50 rounded-xl',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-sm',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 shadow-sm',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 shadow-sm',
    outline: 'bg-transparent text-[#f58d2f] border border-[#f58d2f]/20 hover:bg-orange-50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px] uppercase tracking-widest rounded-xl',
    md: 'px-6 py-3 text-sm rounded-2xl',
    lg: 'px-10 py-4 text-base rounded-[1.5rem]',
    icon: 'p-2.5 rounded-xl',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : size === 'icon' ? 16 : 18} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
