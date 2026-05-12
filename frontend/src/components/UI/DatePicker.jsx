import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS   = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];

const DatePicker = ({
  value,
  onChange,
  name,
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  compact = false,
  className = '',
  required,
}) => {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const parseValue = (v) => {
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const getViewFromValue = (v) => {
    const base = parseValue(v) || todayDate;
    return { year: base.getFullYear(), month: base.getMonth() };
  };

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => getViewFromValue(value));
  const ref = useRef(null);

  useEffect(() => {
    if (open) setView(getViewFromValue(value));
  }, [open]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selected = parseValue(value);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay = new Date(view.year, view.month, 1).getDay();

  const prevMonth = () => setView(v =>
    v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }
  );
  const nextMonth = () => setView(v =>
    v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }
  );

  const handleSelect = (day) => {
    const m = String(view.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange({ target: { name, value: `${view.year}-${m}-${d}` } });
    setOpen(false);
  };

  const formatDisplay = (v) => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full bg-white border font-medium flex items-center justify-between transition-colors focus:outline-none
          ${compact ? 'px-3 py-2.5 text-xs rounded-xl' : 'px-4 py-3 text-sm rounded-2xl'}
          ${open ? 'border-[#f58d2f]/50' : 'border-slate-200 hover:border-slate-300'}
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
      >
        <span className={value ? 'text-slate-700' : 'text-slate-400'}>
          {formatDisplay(value) || placeholder}
        </span>
        <Calendar
          size={16}
          className={`flex-shrink-0 transition-colors ${open ? 'text-[#f58d2f]' : 'text-slate-300'}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-72">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-black text-slate-800">
              {MONTHS[view.month]} {view.year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayDate = new Date(view.year, view.month, day);
              const isSel = selected && dayDate.getTime() === selected.getTime();
              const isToday = dayDate.getTime() === todayDate.getTime();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-xl text-xs font-bold transition-all
                    ${isSel
                      ? 'bg-[#f58d2f] text-white shadow-sm shadow-orange-200'
                      : isToday
                        ? 'text-[#f58d2f] bg-orange-50 ring-1 ring-orange-200'
                        : 'text-slate-700 hover:bg-orange-50 hover:text-[#f58d2f]'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
