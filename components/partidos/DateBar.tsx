'use client';

import { useEffect, useRef } from 'react';
import { CalendarPicker } from './CalendarPicker';

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

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
  }, []);

  return (
    <div className="flex items-center border-b border-border bg-card">
      <CalendarPicker selected={selected} onChange={onChange} />

      <div className="w-px h-5 bg-border flex-shrink-0" />

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto px-2 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent" />
      </div>
    </div>
  );
}
