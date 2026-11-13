import type { SwapCandidate } from './types';

export const DEFAULT_SWAP_CANDIDATE: SwapCandidate = {
  id: 'lot_aze_8104_swap',
  lotName: 'AZE-BAK-8104',
  partnerCompany: 'ООО «Каспийский Металл»',
  cargoType: 'Прокат стальной х/к в рулонах',
  massTonnes: 3900,
  currentPort: 'Махачкала (ММТП, терминал P3)',
  targetPort: 'Энзели (Иран)',
  terminalStorageSlot: 'Сектор B-4 (Готов к погрузке, P90: 100%)',
  assignedFerry: 'Паром «Композитор Караев» (ASCO)',
  ferryDepartsInHours: 4,
  shipDraughtM: 4.05,
  ukcSafeMarginM: 0.35,
  demurrageHedgedUsd: 22500,
  casperDeployHash: '0x7f4ad921ba89c31495cfa1082be81a94372f88b901ce2',
};
