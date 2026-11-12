export function ArchivalSvgDefs() {
  return (
    <defs>
      <linearGradient id="archPaperGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#DDE8EA" />
        <stop offset="32%" stopColor="#EFEAE0" />
        <stop offset="100%" stopColor="#EAE3D5" />
      </linearGradient>
      <radialGradient id="haloOrange" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E0592F" stopOpacity="0.48" />
        <stop offset="55%" stopColor="#E0592F" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#E0592F" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="haloCyan" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3B93C4" stopOpacity="0.42" />
        <stop offset="60%" stopColor="#3B93C4" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#3B93C4" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="haloDeep" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0C1C28" stopOpacity="0.58" />
        <stop offset="65%" stopColor="#0C1C28" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#0C1C28" stopOpacity="0" />
      </radialGradient>
      <pattern id="halftoneGrid" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1.2" cy="1.2" r="0.6" fill="#172A3A" fillOpacity="0.14" />
      </pattern>
      <filter id="seaRimGlow" x="-8%" y="-8%" width="116%" height="116%">
        <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#0A141E" floodOpacity="0.35" />
      </filter>
    </defs>
  );
}
