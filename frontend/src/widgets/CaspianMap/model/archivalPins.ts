export interface ArchivalPinPos {
  id: string;
  x: number;
  y: number;
  peers: string[];
}

export const ARCHIVAL_PINS: ArchivalPinPos[] = [
  { id: 'astrakhan', x: 17, y: 60, peers: ['aktau', 'makhachkala', 'baku'] },
  { id: 'makhachkala', x: 34, y: 68, peers: ['astrakhan', 'aktau', 'anzali'] },
  { id: 'baku', x: 19, y: 82, peers: ['aktau', 'turkmenbashi', 'anzali'] },
  { id: 'aktau', x: 45, y: 63, peers: ['astrakhan', 'makhachkala', 'baku', 'kuryk'] },
  { id: 'kuryk', x: 58, y: 60, peers: ['aktau', 'baku', 'amirabad'] },
  { id: 'turkmenbashi', x: 68, y: 57, peers: ['baku', 'anzali', 'amirabad'] },
  { id: 'anzali', x: 55, y: 84, peers: ['baku', 'makhachkala', 'turkmenbashi'] },
  { id: 'amirabad', x: 86, y: 62, peers: ['aktau', 'turkmenbashi', 'anzali'] },
];

export function getArchivalPin(id: string) {
  return ARCHIVAL_PINS.find((p) => p.id === id);
}
