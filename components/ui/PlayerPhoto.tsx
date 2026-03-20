'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  url: string | null;
  firstName: string;
  lastName: string;
  size?: number;
  className?: string;
}

export function PlayerPhoto({ url, firstName, lastName, size = 72, className = '' }: Props) {
  const [error, setError] = useState(false);

  if (url && !error) {
    return (
      <Image
        src={url}
        alt={`${firstName} ${lastName}`}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 ${className}`.trim()}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-card font-bold text-secondary ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(8, Math.floor(size * 0.28)) }}
    >
      {firstName[0]}{lastName[0]}
    </div>
  );
}
