import { ARCHIVAL_GEO } from '../../../../model/archivalPins';

export function ArchivalSvgDefs() {
  return (
    <defs>
      <linearGradient id="archPaperGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--map-land-use)" />
        <stop offset="32%" stopColor="var(--map-land)" />
        <stop offset="100%" stopColor="var(--map-background)" />
      </linearGradient>
      <filter id="risoPaper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="12" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <pattern id="risoWaterDots" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1.1" cy="1.1" r="0.65" fill="var(--riso-water-ink)" />
        <circle cx="4.1" cy="4.1" r="0.42" fill="var(--riso-water-ink)" />
      </pattern>
      <clipPath id="risoWaterClip"><path d={ARCHIVAL_GEO.water} clipRule="evenodd" /></clipPath>
    </defs>
  );
}

