interface ArchivalShipProps {
  x: number;
  y: number;
  rot: number;
  index: number;
}

export function ArchivalShip({ x, y, rot, index }: ArchivalShipProps) {
  const driftDur = `${6 + index * 1.6}s`;
  const rockDur = `${4 + index * 0.9}s`;
  const rippleDur = `${2.4 + index * 0.4}s`;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot})`} opacity="0.75">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0,0; 2,-1; -1.5,1; 0,0"
        dur={driftDur}
        repeatCount="indefinite"
        additive="sum"
      />
      <animateTransform
        attributeName="transform"
        type="rotate"
        values="0; 1.6; -1.4; 0"
        dur={rockDur}
        repeatCount="indefinite"
        additive="sum"
      />
      <path
        d="M -11 0 Q -15 -2 -19 -4 M -11 1 Q -15 3 -19 5"
        stroke="var(--accent-cyan)"
        strokeWidth="0.75"
        fill="none"
        opacity="0.38"
      >
        <animate
          attributeName="opacity"
          values="0.15;0.65;0.15"
          dur={rippleDur}
          repeatCount="indefinite"
        />
      </path>
      <path d="M -9 2 L 7 2 L 10 -1 L -7 -1 Z" fill="var(--foreground)" />
      <rect x="-4" y="-4" width="6" height="3" fill="var(--secondary-foreground)" />
    </g>
  );
}

