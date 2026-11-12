import type { MultimodalNodeData, RouteSegment } from '@/shared/types/transit';

export const CARGO_8841_SEGMENTS: RouteSegment[] = [
  { mode: 'rail', coordinates: [[37.61, 55.75], [44.51, 48.7], [47.5, 42.98]] },
  { mode: 'sea', coordinates: [[47.5, 42.98], [49.4, 40.2], [49.46, 37.47]] },
  { mode: 'road', coordinates: [[49.46, 37.47], [51.39, 35.69], [56.28, 27.18]] },
];

export const CARGO_8841_ALT_SEGMENTS: RouteSegment[] = [
  { mode: 'rail', coordinates: [[37.61, 55.75], [44.51, 48.7], [47.5, 42.98]] },
  { mode: 'sea', coordinates: [[47.5, 42.98], [51.2, 40.1], [53.37, 36.85]] },
  { mode: 'rail', coordinates: [[53.37, 36.85], [51.39, 35.69], [56.28, 27.18]] },
];

export const CARGO_8841_NODES: MultimodalNodeData[] = [
  { id: 'n1', label: 'Ж/Д терминал', location: 'Москва-Товарная', mode: 'rail', status: 'ok', delayHours: 0, eta: '10 ноя, 08:00' },
  { id: 'n2', label: 'Порт погрузки', location: 'Махачкала', mode: 'sea', status: 'ok', delayHours: 0, eta: '12 ноя, 14:30' },
  { id: 'n3', label: 'Морской паром', location: 'Рейд Энзели', mode: 'sea', status: 'critical', delayHours: 18, eta: '14 ноя, 06:00' },
  { id: 'n4', label: 'Таможня (Pre-clearance)', location: 'Пост Энзели', mode: 'customs', status: 'warning', delayHours: 4, eta: '14 ноя, 22:00' },
  { id: 'n5', label: 'Порт выгрузки', location: 'Энзели Терминал 2', mode: 'sea', status: 'warning', delayHours: 6, eta: '15 ноя, 04:00' },
  { id: 'n6', label: 'Авто/ЖД доставка', location: 'Бендер-Аббас / Мумбаи', mode: 'road', status: 'ok', delayHours: 0, eta: '19 ноя, 18:00' },
];

export const CARGO_8841_ALT_NODES: MultimodalNodeData[] = [
  { id: 'n1', label: 'Ж/Д терминал', location: 'Москва-Товарная', mode: 'rail', status: 'ok', delayHours: 0, eta: '10 ноя, 08:00' },
  { id: 'n2', label: 'Порт погрузки', location: 'Махачкала', mode: 'sea', status: 'ok', delayHours: 0, eta: '12 ноя, 14:30' },
  { id: 'n3', label: 'Морской паром', location: 'Курс на Амирабад', mode: 'sea', status: 'ok', delayHours: 2, eta: '13 ноя, 20:00' },
  { id: 'n4', label: 'Таможня (Pre-clearance)', location: 'Пост Амирабад', mode: 'customs', status: 'ok', delayHours: 0, eta: '14 ноя, 01:00' },
  { id: 'n5', label: 'Порт выгрузки', location: 'Амирабад Ж/Д хаб', mode: 'sea', status: 'ok', delayHours: 0, eta: '14 ноя, 05:00' },
  { id: 'n6', label: 'Авто/ЖД доставка', location: 'Бендер-Аббас / Мумбаи', mode: 'rail', status: 'ok', delayHours: 0, eta: '18 ноя, 11:00' },
];

