'use client';

import { cn } from '@/shared/lib/utils';

interface BioOpticOrbitsProps {
  className?: string;
  xrayMode?: boolean;
}

export function BioOpticOrbits({ className, xrayMode = false }: BioOpticOrbitsProps) {
  const stroke = xrayMode ? 'rgba(228, 225, 218, 0.14)' : 'rgba(228, 225, 218, 0.07)';
  const dotFill = xrayMode ? 'rgba(149, 139, 168, 0.5)' : 'rgba(228, 225, 218, 0.25)';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 560"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    >
      <circle cx="420" cy="275" r="220" fill="none" stroke={stroke} strokeWidth="1" />
      <circle cx="515" cy="240" r="155" fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="3 7" />
      <circle cx="345" cy="315" r="120" fill="none" stroke={stroke} strokeWidth="1" />
      <line x1="160" y1="275" x2="730" y2="275" stroke={stroke} strokeWidth="1" />
      <line x1="255" y1="125" x2="645" y2="415" stroke={stroke} strokeWidth="1" />
      <circle cx="200" cy="275" r="2" fill={dotFill} />
      <circle cx="640" cy="275" r="2" fill={dotFill} />
      <circle cx="395" cy="228" r="2" fill={dotFill} />
      <circle cx="645" cy="415" r="2" fill={dotFill} />
    </svg>
  );
}
