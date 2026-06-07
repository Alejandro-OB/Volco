import React from 'react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = '' }) {
  return (
    <div className={`py-14 px-6 flex flex-col items-center text-center ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-5">
          <Icon size={22} strokeWidth={1.5} />
        </div>
      )}
      {title && (
        <p className="text-base font-semibold text-slate-700 mb-1.5">{title}</p>
      )}
      {description && (
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-xl text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
