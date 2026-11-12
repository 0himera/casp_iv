import type { CSSProperties } from 'react';

export interface LeaderConfig {
  path: string;
  endX: number;
  endY: number;
  calloutStyle: CSSProperties;
}

const CONFIGS: Record<string, LeaderConfig> = {
  astrakhan: {
    path: 'M 16 -16 L 36 -36 L 56 -36',
    endX: 56,
    endY: -36,
    calloutStyle: { left: 60, top: -36, transform: 'translateY(-50%)' },
  },
  makhachkala: {
    path: 'M -16 -16 L -36 -36 L -56 -36',
    endX: -56,
    endY: -36,
    calloutStyle: { left: -60, top: -36, transform: 'translate(-100%, -50%)' },
  },
  aktau: {
    path: 'M 16 -16 L 36 -36 L 56 -36',
    endX: 56,
    endY: -36,
    calloutStyle: { left: 60, top: -36, transform: 'translateY(-50%)' },
  },
  anzali: {
    path: 'M -16 16 L -36 36 L -56 36',
    endX: -56,
    endY: 36,
    calloutStyle: { left: -60, top: 36, transform: 'translate(-100%, -50%)' },
  },
  amirabad: {
    path: 'M 16 16 L 36 36 L 56 36',
    endX: 56,
    endY: 36,
    calloutStyle: { left: 60, top: 36, transform: 'translateY(-50%)' },
  },
};

export function getLeaderLineConfig(portId: string): LeaderConfig {
  return (
    CONFIGS[portId] ?? {
      path: 'M 16 -16 L 36 -36 L 56 -36',
      endX: 56,
      endY: -36,
      calloutStyle: { left: 60, top: -36, transform: 'translateY(-50%)' },
    }
  );
}
