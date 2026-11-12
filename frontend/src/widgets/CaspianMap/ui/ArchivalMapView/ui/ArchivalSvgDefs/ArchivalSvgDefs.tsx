export function ArchivalSvgDefs() {
  return (
    <defs>
      <linearGradient id="archPaperGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3A0610" />
        <stop offset="42%" stopColor="#250409" />
        <stop offset="100%" stopColor="#170205" />
      </linearGradient>
      <radialGradient id="haloOrange" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.55" />
        <stop offset="55%" stopColor="#FFB800" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#FFB800" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="haloCyan" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#5CE1E6" stopOpacity="0.45" />
        <stop offset="60%" stopColor="#5CE1E6" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#5CE1E6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="haloDeep" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#100103" stopOpacity="0.75" />
        <stop offset="65%" stopColor="#100103" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#100103" stopOpacity="0" />
      </radialGradient>
      <pattern id="halftoneGrid" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1.2" cy="1.2" r="0.6" fill="#FFA5B5" fillOpacity="0.11" />
      </pattern>
      <filter id="seaRimGlow" x="-8%" y="-8%" width="116%" height="116%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#FF2E55" floodOpacity="0.32" />
      </filter>
    </defs>
  );
}
