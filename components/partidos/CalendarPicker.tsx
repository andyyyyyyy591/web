'use client';

import { useState, useEffect, useRef } from 'react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface Props {
  selected: string;
  onChange: (date: string) => void;
}

export function CalendarPicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selDate = new Date(selected + 'T00:00:00');
  const [viewYear, setViewYear] = useState(selDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selDate.getMonth());

  // Sync view when selected changes externally
  useEffect(() => {
    const d = new Date(selected + 'T00:00:00');
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selected]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function pick(day: number) {
    const str = toDateStr(viewYear, viewMonth, day);
    onChange(str);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        title="Elegir fecha"
        className={`flex items-center justify-center h-10 w-10 transition-colors ${open ? 'text-accent' : 'text-secondary hover:text-accent'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-72 rounded-2xl bg-card border border-border shadow-xl p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-elevated text-secondary hover:text-primary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="text-sm font-bold text-primary">{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-elevated text-secondary hover:text-primary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="flex items-center justify-center h-8 text-[10px] font-bold text-secondary uppercase">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const str = toDateStr(viewYear, viewMonth, day);
              const isSelected = str === selected;
              const isToday = str === todayStr;
              return (
                <button
                  key={i}
                  onClick={() => pick(day)}
                  className={`flex items-center justify-center h-9 w-full rounded-full text-sm font-medium transition-colors
                    ${isSelected ? 'bg-accent text-white font-bold' :
                      isToday ? 'text-accent font-bold hover:bg-accent/10' :
                      'text-primary hover:bg-elevated'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={() => { onChange(todayStr); setOpen(false); }}
              className="w-full text-xs font-semibold text-accent hover:bg-accent/10 rounded-lg py-1.5 transition-colors"
            >
              Ir a hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
