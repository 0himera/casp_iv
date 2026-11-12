import type { CaspianPort } from '@/shared/types/transit';

export const CASPIAN_PORTS: CaspianPort[] = [
  {
    id: 'astrakhan',
    name: 'Астрахань',
    country: 'РФ',
    lat: 46.34,
    lng: 48.03,
    loadPercent: 64,
    berthsAvailable: 5,
  },
  {
    id: 'makhachkala',
    name: 'Махачкала',
    country: 'РФ',
    lat: 42.98,
    lng: 47.5,
    loadPercent: 71,
    berthsAvailable: 3,
  },
  {
    id: 'aktau',
    name: 'Актау',
    country: 'РК',
    lat: 43.65,
    lng: 51.16,
    loadPercent: 58,
    berthsAvailable: 6,
  },
  {
    id: 'anzali',
    name: 'Энзели',
    country: 'Иран',
    lat: 37.47,
    lng: 49.46,
    loadPercent: 89,
    berthsAvailable: 1,
  },
  {
    id: 'amirabad',
    name: 'Амирабад',
    country: 'Иран',
    lat: 36.85,
    lng: 53.37,
    loadPercent: 52,
    berthsAvailable: 4,
  },
];

