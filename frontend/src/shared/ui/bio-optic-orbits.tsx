'use client';

import { cn } from '@/shared/lib/utils';

interface BioOpticOrbitsProps {
  className?: string;
  xrayMode?: boolean;
}

export function BioOpticOrbits({ className, xrayMode = false }: BioOpticOrbitsProps) {
  const stroke = xrayMode ? 'rgba(236, 234, 228, 0.22)' : 'rgba(236, 234, 228, 0.11)';
  const dotFill = xrayMode ? 'rgba(147, 134, 184, 0.72)' : 'rgba(236, 234, 228, 0.38)';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 560"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    >
      <circle cx="420" cy="275" r="220" fill="none" stroke={stroke} strokeWidth="1" />
      <circle cx="515" cy="240" r="155" fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="345" cy="315" r="120" fill="none" stroke={stroke} strokeWidth="1" />
      <line x1="160" y1="275" x2="730" y2="275" stroke={stroke} strokeWidth="1" />
      <line x1="255" y1="125" x2="645" y2="415" stroke={stroke} strokeWidth="1" />
      <line x1="515" y1="65" x2="515" y2="425" stroke={stroke} strokeWidth="1" strokeDasharray="2 5" />
      <circle cx="200" cy="275" r="2.5" fill={dotFill} />
      <circle cx="640" cy="275" r="2.5" fill={dotFill} />
      <circle cx="515" cy="85" r="2.5" fill={dotFill} />
      <circle cx="395" cy="228" r="2.5" fill={dotFill} />
      <circle cx="645" cy="415" r="2.5" fill={dotFill} />
    </svg>
  );
}
