import type { CargoItem } from '@/shared/types/transit';

export const CARGO_7405: CargoItem = {
  id: 'trk-7405',
  code: 'TRK-7405',
  routeTitle: 'Казань → Актау → Баку → Бендер-Аббас',
  cargoType: 'Полимеры и нефтехимия',
  weightTons: 28.2,
  status: 'in-transit',
  delayHours: 2,
  bottleneckReason: null,
  segments: [
    { mode: 'rail', coordinates: [[49.12, 55.79], [51.9, 47.1], [51.16, 43.65]] },
    { mode: 'sea', coordinates: [[51.16, 43.65], [49.45, 39.95]] },
    { mode: 'rail', coordinates: [[49.45, 39.95], [48.87, 38.44], [51.39, 35.69], [56.28, 27.18]] },
  ],
  currentPosition: [50.45, 41.9],
  graphNodes: [
    { id: 'n1', label: 'Ж/Д терминал', location: 'Казань Сорт.', mode: 'rail', status: 'ok', delayHours: 0, eta: '09 ноя, 12:00' },
    { id: 'n2', label: 'Порт погрузки', location: 'Актау Северный', mode: 'sea', status: 'ok', delayHours: 0, eta: '12 ноя, 05:00' },
    { id: 'n3', label: 'Морской паром', location: 'Актау — Аляты', mode: 'sea', status: 'ok', delayHours: 2, eta: '13 ноя, 02:00' },
    { id: 'n4', label: 'Таможня (Pre-clearance)', location: 'Астара (Запад)', mode: 'customs', status: 'ok', delayHours: 0, eta: '13 ноя, 19:00' },
    { id: 'n5', label: 'Порт выгрузки', location: 'Баку Аляты', mode: 'sea', status: 'ok', delayHours: 0, eta: '13 ноя, 06:00' },
    { id: 'n6', label: 'Авто/ЖД доставка', location: 'Бендер-Аббас', mode: 'rail', status: 'ok', delayHours: 0, eta: '16 ноя, 16:00' },
  ],
  alternativeRoute: null,
  smartContract: {
    hash: '0x9c3e...51a4',
    eCmrStatus: 'Ожидает транзита ИРИ',
    accelerationHours: 16,
    isCleared: false,
    steps: [
      { id: 's1', authority: 'РФ ФТС', status: 'cleared' },
      { id: 's2', authority: 'Морской порт', status: 'cleared' },
      { id: 's3', authority: 'Таможня Ирана', status: 'pending' },
    ],
  },
  esg: { railKg: 1680, seaKg: 620, roadKg: 190, pureRoadKg: 7150, rating: 'A+' },
};

