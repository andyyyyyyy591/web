'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  url: string | null;
  name: string;
  size?: number;
  primaryColor?: string | null;
  textColor?: string;
  className?: string;
}

export function ClubLogo({ url, name, size = 28, primaryColor, textColor, className = '' }: Props) {
  const [error, setError] = useState(false);

  if (url && !error) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-contain shrink-0 ${className}`.trim()}
        style={{ width: size, height: size }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold shrink-0 ${className}`.trim()}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.floor(size * 0.38)),
        backgroundColor: primaryColor || '#1c1c2e',
        color: textColor || '#6b7280',
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
