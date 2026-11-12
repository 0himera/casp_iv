import type { CargoItem } from '@/shared/types/transit';

export const CARGO_9012: CargoItem = {
  id: 'trk-9012',
  code: 'TRK-9012',
  routeTitle: 'Астрахань → Амирабад → Тегеран',
  cargoType: 'Зерновые культуры (Рефконтейнер)',
  weightTons: 24.0,
  status: 'in-transit',
  delayHours: 0,
  bottleneckReason: null,
  segments: [
    { mode: 'rail', coordinates: [[48.03, 46.34], [48.2, 45.9]] },
    { mode: 'sea', coordinates: [[48.2, 45.9], [50.8, 41.2], [53.37, 36.85]] },
    { mode: 'rail', coordinates: [[53.37, 36.85], [51.39, 35.69]] },
  ],
  currentPosition: [51.1, 40.4],
  graphNodes: [
    { id: 'n1', label: 'Ж/Д терминал', location: 'Астрахань-Порт', mode: 'rail', status: 'ok', delayHours: 0, eta: '11 ноя, 09:00' },
    { id: 'n2', label: 'Порт погрузки', location: 'Оля (Астрахань)', mode: 'sea', status: 'ok', delayHours: 0, eta: '11 ноя, 18:00' },
    { id: 'n3', label: 'Морской паром', location: 'Каспий · Восток', mode: 'sea', status: 'ok', delayHours: 0, eta: '13 ноя, 10:00' },
    { id: 'n4', label: 'Таможня (Pre-clearance)', location: 'Пост Амирабад', mode: 'customs', status: 'ok', delayHours: 0, eta: '13 ноя, 12:00' },
    { id: 'n5', label: 'Порт выгрузки', location: 'Амирабад', mode: 'sea', status: 'ok', delayHours: 0, eta: '13 ноя, 15:00' },
    { id: 'n6', label: 'Авто/ЖД доставка', location: 'Тегеран Априн', mode: 'rail', status: 'ok', delayHours: 0, eta: '14 ноя, 08:00' },
  ],
  alternativeRoute: null,
  smartContract: {
    hash: '0x4a1d...9e0f',
    eCmrStatus: 'Verified & Cleared',
    accelerationHours: 19,
    isCleared: true,
    steps: [
      { id: 's1', authority: 'РФ ФТС', status: 'cleared' },
      { id: 's2', authority: 'Морской порт', status: 'cleared' },
      { id: 's3', authority: 'Таможня Ирана', status: 'cleared' },
    ],
  },
  esg: { railKg: 540, seaKg: 780, roadKg: 120, pureRoadKg: 4380, rating: 'A+' },
};

