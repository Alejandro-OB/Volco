import React from 'react';
import { Search, X } from 'lucide-react';
import Select from './Select';
import DatePicker from './DatePicker';

// ── Contenedor principal ──────────────────────────────────────────────────────

export function FilterBar({ children, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {children}
    </div>
  );
}

// ── Fila horizontal de controles ─────────────────────────────────────────────

export function FilterRow({ children, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap ${className}`}>
      {children}
    </div>
  );
}

// ── Input de búsqueda ────────────────────────────────────────────────────────

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }) {
  return (
    <div className={`relative flex-1 min-w-0 ${className}`}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
        size={16}
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f58d2f]/50 transition-colors"
      />
    </div>
  );
}

// ── Select de filtro (re-exporta Select con tamaño estándar) ─────────────────

export function FilterSelect({ value, onChange, disabled, label, children, className = '' }) {
  return (
    <Select value={value} onChange={onChange} disabled={disabled} label={label} className={className}>
      {children}
    </Select>
  );
}

// ── Rango de fechas ──────────────────────────────────────────────────────────

export function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  return (
    <div className="flex gap-2 items-center">
      <DatePicker
        name="dateFrom"
        value={from}
        onChange={onFromChange}
        className="flex-1 min-w-0"
        compact
      />
      <span className="text-slate-300 text-xs select-none flex-shrink-0">—</span>
      <DatePicker
        name="dateTo"
        value={to}
        onChange={onToChange}
        className="flex-1 min-w-0"
        compact
      />
      {(from || to) && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
          title="Limpiar fechas"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ── Botón limpiar filtros ────────────────────────────────────────────────────

export function ClearButton({ onClick, children = 'Limpiar', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-red-400 transition-colors whitespace-nowrap ${className}`}
    >
      <X size={13} />
      {children}
    </button>
  );
}
