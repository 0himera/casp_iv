'use client';

export function FilmGrainOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[999] h-full w-full opacity-[0.045] mix-blend-overlay"
    >
      <filter id="caspian-film-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#caspian-film-grain)" />
    </svg>
  );
}

