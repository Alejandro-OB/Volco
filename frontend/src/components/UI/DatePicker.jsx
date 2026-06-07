import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS   = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];

const parseYMD = (v) => {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) ? date : null;
};

const splitValue = (v) => {
  if (!v) return { d: '', m: '', y: '' };
  const [yr, mo, da] = v.split('-');
  return { d: da || '', m: mo || '', y: yr || '' };
};

const DatePicker = ({
  value,
  onChange,
  name,
  placeholder,
  disabled = false,
  compact = false,
  className = '',
}) => {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const getView = (v) => {
    const base = parseYMD(v) || todayDate;
    return { year: base.getFullYear(), month: base.getMonth() };
  };

  // Segments state
  const [seg, setSeg] = useState(() => splitValue(value));
  const [focused, setFocused] = useState(null); // 'day' | 'month' | 'year'

  // Calendar state
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => getView(value));
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });

  const wrapperRef = useRef(null);
  const calendarRef = useRef(null);
  const dayRef    = useRef(null);
  const monthRef  = useRef(null);
  const yearRef   = useRef(null);

  // Sync segments when value changes from outside (calendar pick)
  useEffect(() => {
    setSeg(splitValue(value));
  }, [value]);

  // Calendar positioning
  useEffect(() => {
    if (open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCalendarPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, [open]);

  useEffect(() => {
    if (open) setView(getView(value));
  }, [open]);

  // Click outside calendar
  useEffect(() => {
    const handle = (e) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        calendarRef.current && !calendarRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const tryCommit = useCallback((d, m, y) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (
        date.getFullYear() === Number(y) &&
        date.getMonth() === Number(m) - 1 &&
        date.getDate() === Number(d)
      ) {
        onChange({ target: { name, value: `${y}-${m}-${d}` } });
      }
    }
  }, [name, onChange]);

  const focusAndSelect = (ref) => {
    ref.current?.focus();
    setTimeout(() => ref.current?.select(), 0);
  };

  // ── Day handlers ──
  const handleDayChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    const autoAdvance = raw.length === 2 || (raw.length === 1 && Number(raw) > 3);
    const val = autoAdvance && raw.length === 1 ? raw.padStart(2, '0') : raw;
    setSeg(s => ({ ...s, d: val }));
    if (autoAdvance) focusAndSelect(monthRef);
    tryCommit(val, seg.m, seg.y);
  };
  const handleDayKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); focusAndSelect(monthRef); }
    if (e.key === 'Backspace' && !seg.d) { e.preventDefault(); }
  };
  const handleDayBlur = () => {
    if (seg.d.length === 1) setSeg(s => ({ ...s, d: s.d.padStart(2, '0') }));
    setFocused(null);
  };

  // ── Month handlers ──
  const handleMonthChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    const autoAdvance = raw.length === 2 || (raw.length === 1 && Number(raw) > 1);
    const val = autoAdvance && raw.length === 1 ? raw.padStart(2, '0') : raw;
    setSeg(s => ({ ...s, m: val }));
    if (autoAdvance) focusAndSelect(yearRef);
    tryCommit(seg.d, val, seg.y);
  };
  const handleMonthKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); focusAndSelect(dayRef); }
    if (e.key === 'ArrowRight') { e.preventDefault(); focusAndSelect(yearRef); }
    if (e.key === 'Backspace' && !seg.m) { e.preventDefault(); focusAndSelect(dayRef); }
  };
  const handleMonthBlur = () => {
    if (seg.m.length === 1) setSeg(s => ({ ...s, m: s.m.padStart(2, '0') }));
    setFocused(null);
  };

  // ── Year handlers ──
  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setSeg(s => ({ ...s, y: val }));
    tryCommit(seg.d, seg.m, val);
  };
  const handleYearKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); focusAndSelect(monthRef); }
    if (e.key === 'Backspace' && !seg.y) { e.preventDefault(); focusAndSelect(monthRef); }
  };

  // ── Calendar selection ──
  const handleSelect = (day) => {
    const m = String(view.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const y = String(view.year);
    onChange({ target: { name, value: `${y}-${m}-${d}` } });
    setOpen(false);
  };

  const selected = parseYMD(value);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const anyFocused = focused !== null;

  const segClass = (s) =>
    `outline-none transition-colors rounded px-0.5
     ${focused === s ? 'bg-[#f58d2f] text-white' : 'bg-transparent text-slate-700'}`;

  const calendar = open && createPortal(
    <div
      ref={calendarRef}
      style={{ position: 'fixed', top: calendarPos.top, left: calendarPos.left, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-72"
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-black text-slate-800">{MONTHS[view.month]} {view.year}</span>
        <button type="button" onClick={() => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayDate = new Date(view.year, view.month, day);
          const isSel = selected && dayDate.getTime() === selected.getTime();
          const isToday = dayDate.getTime() === todayDate.getTime();
          return (
            <button key={day} type="button" onClick={() => handleSelect(day)}
              className={`w-8 h-8 mx-auto flex items-center justify-center rounded-xl text-xs font-bold transition-all
                ${isSel ? 'bg-[#f58d2f] text-white shadow-sm shadow-orange-200'
                  : isToday ? 'text-[#f58d2f] bg-orange-50 ring-1 ring-orange-200'
                  : 'text-slate-700 hover:bg-orange-50 hover:text-[#f58d2f]'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className={`w-full bg-white border flex items-center gap-0 transition-colors
        ${compact ? 'px-3 py-2 rounded-xl' : 'px-4 py-3 rounded-2xl'}
        ${anyFocused || open ? 'border-[#f58d2f]/50' : 'border-slate-200 hover:border-slate-300'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
      `}>
        {/* Day */}
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          value={seg.d}
          placeholder="DD"
          maxLength={2}
          disabled={disabled}
          onChange={handleDayChange}
          onKeyDown={handleDayKeyDown}
          onFocus={() => { setFocused('day'); setTimeout(() => dayRef.current?.select(), 0); }}
          onBlur={handleDayBlur}
          className={`w-7 text-center font-medium ${compact ? 'text-xs' : 'text-sm'} placeholder:text-slate-300 ${segClass('day')}`}
        />
        <span className="text-slate-300 font-medium select-none">/</span>
        {/* Month */}
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          value={seg.m}
          placeholder="MM"
          maxLength={2}
          disabled={disabled}
          onChange={handleMonthChange}
          onKeyDown={handleMonthKeyDown}
          onFocus={() => { setFocused('month'); setTimeout(() => monthRef.current?.select(), 0); }}
          onBlur={handleMonthBlur}
          className={`w-7 text-center font-medium ${compact ? 'text-xs' : 'text-sm'} placeholder:text-slate-300 ${segClass('month')}`}
        />
        <span className="text-slate-300 font-medium select-none">/</span>
        {/* Year */}
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          value={seg.y}
          placeholder="AAAA"
          maxLength={4}
          disabled={disabled}
          onChange={handleYearChange}
          onKeyDown={handleYearKeyDown}
          onFocus={() => { setFocused('year'); setTimeout(() => yearRef.current?.select(), 0); }}
          onBlur={() => setFocused(null)}
          className={`w-10 text-center font-medium ${compact ? 'text-xs' : 'text-sm'} placeholder:text-slate-300 ${segClass('year')}`}
        />

        {/* Calendar icon */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="ml-auto flex-shrink-0 focus:outline-none"
        >
          <Calendar size={16} className={`transition-colors ${open ? 'text-[#f58d2f]' : 'text-slate-300'}`} />
        </button>
      </div>
      {calendar}
    </div>
  );
};

export default DatePicker;
