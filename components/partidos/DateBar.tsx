'use client';

import { useEffect, useRef } from 'react';

interface DateItem {
  date: string;    // YYYY-MM-DD
  label: string;   // "Hoy", "Mañana", "Lun 10", etc.
  short: string;   // "Hoy", "Ayer", or day abbreviation
}

function buildDates(): DateItem[] {
  const today = new Date();
  const items: DateItem[] = [];
  const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

    items.push({ date: dateStr, label, short: label });
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

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-hide"
      style={{ scrollbarWidth: 'none' }}
    >
      {dates.map((item) => {
        const isSelected = item.date === selected;
        return (
          <button
            key={item.date}
            ref={item.label === 'Hoy' ? todayRef : undefined}
            onClick={() => onChange(item.date)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isSelected
                ? 'bg-accent text-app'
                : 'bg-elevated text-secondary hover:text-primary'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
