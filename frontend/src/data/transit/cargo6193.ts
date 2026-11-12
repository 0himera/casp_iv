import type { CargoItem } from '@/shared/types/transit';

export const CARGO_6193: CargoItem = {
  id: 'trk-6193',
  code: 'TRK-6193',
  routeTitle: 'СПб → Астрахань → Энзели → Исфахан',
  cargoType: 'Лесоматериалы и бумага',
  weightTons: 25.5,
  status: 'delay-risk',
  delayHours: 8,
  bottleneckReason: 'Высокая загрузка причала Энзели (89%). Прогнозируется ожидание разгрузки',
  segments: [
    { mode: 'rail', coordinates: [[30.33, 59.93], [44.51, 48.7], [48.03, 46.34]] },
    { mode: 'sea', coordinates: [[48.03, 46.34], [49.2, 41.5], [49.46, 37.47]] },
    { mode: 'road', coordinates: [[49.46, 37.47], [51.39, 35.69], [51.67, 32.65]] },
  ],
  currentPosition: [48.95, 42.1],
  graphNodes: [
    { id: 'n1', label: 'Ж/Д терминал', location: 'СПб-Товарный', mode: 'rail', status: 'ok', delayHours: 0, eta: '08 ноя, 16:00' },
    { id: 'n2', label: 'Порт погрузки', location: 'Астрахань', mode: 'sea', status: 'ok', delayHours: 0, eta: '11 ноя, 21:00' },
    { id: 'n3', label: 'Морской паром', location: 'Каспий · Центр', mode: 'sea', status: 'warning', delayHours: 8, eta: '14 ноя, 09:00' },
    { id: 'n4', label: 'Таможня (Pre-clearance)', location: 'Пост Энзели', mode: 'customs', status: 'warning', delayHours: 3, eta: '14 ноя, 16:00' },
    { id: 'n5', label: 'Порт выгрузки', location: 'Энзели', mode: 'sea', status: 'warning', delayHours: 5, eta: '14 ноя, 20:00' },
    { id: 'n6', label: 'Авто/ЖД доставка', location: 'Исфахан', mode: 'road', status: 'ok', delayHours: 0, eta: '16 ноя, 14:00' },
  ],
  affectedByEnzeliStorm: true,
  alternativeRoute: {
    label: 'Перестроить маршрут (через Амирабад / Западную ж/д ветку)',
    reason: 'Перенаправление судна в Амирабад со стыковкой на ж/д платформу',
    segments: [
      { mode: 'rail', coordinates: [[30.33, 59.93], [44.51, 48.7], [48.03, 46.34]] },
      { mode: 'sea', coordinates: [[48.03, 46.34], [51.2, 41.4], [53.37, 36.85]] },
      { mode: 'rail', coordinates: [[53.37, 36.85], [51.39, 35.69], [51.67, 32.65]] },
    ],
    currentPosition: [49.4, 42.3],
    graphNodes: [
      { id: 'n1', label: 'Ж/Д терминал', location: 'СПб-Товарный', mode: 'rail', status: 'ok', delayHours: 0, eta: '08 ноя, 16:00' },
      { id: 'n2', label: 'Порт погрузки', location: 'Астрахань', mode: 'sea', status: 'ok', delayHours: 0, eta: '11 ноя, 21:00' },
      { id: 'n3', label: 'Морской паром', location: 'Курс на Амирабад', mode: 'sea', status: 'ok', delayHours: 1, eta: '13 ноя, 22:00' },
      { id: 'n4', label: 'Таможня (Pre-clearance)', location: 'Пост Амирабад', mode: 'customs', status: 'ok', delayHours: 0, eta: '14 ноя, 02:00' },
      { id: 'n5', label: 'Порт выгрузки', location: 'Амирабад', mode: 'sea', status: 'ok', delayHours: 0, eta: '14 ноя, 06:00' },
      { id: 'n6', label: 'Авто/ЖД доставка', location: 'Исфахан Ж/Д', mode: 'rail', status: 'ok', delayHours: 0, eta: '15 ноя, 19:00' },
    ],
    delayReductionHours: 7,
    esg: { railKg: 1320, seaKg: 810, roadKg: 180, pureRoadKg: 5890, rating: 'A+' },
  },
  smartContract: {
    hash: '0x2b8f...7d11',
    eCmrStatus: 'Проверка ФТС завершена',
    accelerationHours: 12,
    isCleared: false,
    steps: [
      { id: 's1', authority: 'РФ ФТС', status: 'cleared' },
      { id: 's2', authority: 'Морской порт', status: 'pending' },
      { id: 's3', authority: 'Таможня Ирана', status: 'pending' },
    ],
  },
  esg: { railKg: 1120, seaKg: 850, roadKg: 690, pureRoadKg: 5890, rating: 'B' },
};

