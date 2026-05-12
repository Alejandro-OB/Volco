import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function QueryError({ message = 'Error al cargar los datos.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
        <AlertTriangle size={28} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-700">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f58d2f] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#e87a1c] transition-all shadow-md"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      )}
    </div>
  );
}
