import React from 'react';
import Button from './Button';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = '' }) {
  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 p-12 text-center ${className}`}>
      <div className="flex flex-col items-center gap-6">
        {Icon && (
          <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200">
            <Icon size={48} />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
        {actionLabel && onAction && (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
