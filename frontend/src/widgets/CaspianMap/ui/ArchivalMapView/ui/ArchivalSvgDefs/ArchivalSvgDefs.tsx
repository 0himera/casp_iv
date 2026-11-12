export function ArchivalSvgDefs() {
  return (
    <defs>
      <linearGradient id="archPaperGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--map-land-use)" />
        <stop offset="32%" stopColor="var(--map-land)" />
        <stop offset="100%" stopColor="var(--map-background)" />
      </linearGradient>
      <pattern id="halftoneGrid" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1.2" cy="1.2" r="0.6" fill="var(--map-contour)" fillOpacity="0.14" />
      </pattern>
    </defs>
  );
}

