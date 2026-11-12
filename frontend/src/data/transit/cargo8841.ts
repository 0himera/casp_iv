import type { CargoItem } from '@/shared/types/transit';
import {
  CARGO_8841_ALT_NODES,
  CARGO_8841_ALT_SEGMENTS,
  CARGO_8841_NODES,
  CARGO_8841_SEGMENTS,
} from './cargo8841Paths';

export const CARGO_8841: CargoItem = {
  id: 'trk-8841',
  code: 'TRK-8841',
  routeTitle: 'Москва → Махачкала → Энзели → Мумбаи',
  cargoType: 'Промышленное оборудование (40ft HC)',
  weightTons: 26.4,
  status: 'critical',
  delayHours: 18,
  bottleneckReason:
    'Волнение моря 3.8 м + очередь на причале Энзели. Срыв стыковки с ж/д составом',
  segments: CARGO_8841_SEGMENTS,
  currentPosition: [48.72, 40.95],
  graphNodes: CARGO_8841_NODES,
  affectedByEnzeliStorm: true,
  alternativeRoute: {
    label: 'Перестроить маршрут (через Амирабад / Западную ж/д ветку)',
    reason: 'Обход штормовой зоны Энзели через свободный порт Амирабад',
    segments: CARGO_8841_ALT_SEGMENTS,
    currentPosition: [49.35, 40.7],
    graphNodes: CARGO_8841_ALT_NODES,
    delayReductionHours: 16,
    esg: { railKg: 1420, seaKg: 890, roadKg: 210, pureRoadKg: 6420, rating: 'A+' },
  },
  smartContract: {
    hash: '0x7f9a...3b2c',
    eCmrStatus: 'Ожидает верификации порта',
    accelerationHours: 14,
    isCleared: false,
    steps: [
      { id: 's1', authority: 'РФ ФТС', status: 'cleared' },
      { id: 's2', authority: 'Морской порт', status: 'pending' },
      { id: 's3', authority: 'Таможня Ирана', status: 'pending' },
    ],
  },
  esg: { railKg: 1180, seaKg: 940, roadKg: 760, pureRoadKg: 6420, rating: 'B' },
};

