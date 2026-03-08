'use client';

import { useEffect, useRef } from 'react';

interface DateItem {
  date: string;
  label: string;
}

function buildDates(): DateItem[] {
  const today = new Date();
  const items: DateItem[] = [];
  const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let offset = -30; offset <= 30; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    let label: string;
    if (offset === -1) label = 'Ayer';
    else if (offset === 0) label = 'Hoy';
    else if (offset === 1) label = 'Mañana';
    else label = `${DAY_ABBR[d.getDay()]} ${d.getDate()}`;

    items.push({ date: dateStr, label });
  }
  return items;
}

interface Props {
  selected: string;
  onChange: (date: string) => void;
}

export function DateBar({ selected, onChange }: Props) {
  const dates = buildDates();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
  }, []);

  return (
    <div className="flex items-center border-b border-border">
      {/* Calendar picker button */}
      <button
        onClick={() => dateInputRef.current?.click()}
        title="Elegir fecha"
        className="flex-shrink-0 flex items-center justify-center h-10 w-10 text-secondary hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <input
          ref={dateInputRef}
          type="date"
          className="sr-only"
          value={selected}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Scrollable dates */}
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-hide flex-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {dates.map((item) => {
          const isSelected = item.date === selected;
          return (
            <button
              key={item.date}
              ref={item.label === 'Hoy' ? todayRef : undefined}
              onClick={() => onChange(item.date)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-accent text-white'
                  : 'text-secondary hover:text-primary hover:bg-elevated'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
