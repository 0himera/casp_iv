export interface SwapCandidate {
  id: string;
  lotName: string;
  partnerCompany: string;
  cargoType: string;
  massTonnes: number;
  currentPort: string;
  targetPort: string;
  terminalStorageSlot: string;
  assignedFerry: string;
  ferryDepartsInHours: number;
  shipDraughtM: number;
  ukcSafeMarginM: number;
  demurrageHedgedUsd: number;
  casperDeployHash: string;
}

export type SwapStep = 'review' | 'executing' | 'confirmed';

export interface SlotSwapState {
  isOpen: boolean;
  step: SwapStep;
  candidate: SwapCandidate;
  isExecuted: boolean;
  activeShipmentId: string;
}
