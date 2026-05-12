import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-xl text-slate-400 hover:text-[#f58d2f] hover:bg-orange-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .map((p, idx, arr) => (
          <React.Fragment key={p}>
            {idx > 0 && arr[idx - 1] !== p - 1 && (
              <span className="text-slate-300 font-bold px-1">...</span>
            )}
            <button
              onClick={() => onChange(p)}
              className={`min-w-[36px] h-9 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? 'bg-[#f58d2f] text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-xl text-slate-400 hover:text-[#f58d2f] hover:bg-orange-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
        aria-label="Página siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
