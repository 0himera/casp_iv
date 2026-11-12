'use client';

import type { Shipment } from '@/shared/api/caspian';

interface CommandCenterStateActions {
  shipment: Shipment;
  stormActive: boolean;
  isBusy: boolean;
  selectScenario: (scenario: 'normal' | 'storm') => void;
  selectRoute: (routeId: string) => void;
  attest: (decision: 'approved') => void;
  verifyEcmr?: () => void;
}

export function useCommandCenterActions(s: CommandCenterStateActions) {
  const altRoute = s.shipment.routes.filter((r) => r.id !== s.shipment.selected_route_id && r.feasible && r.miss_probability !== null)
    .sort((a, b) => a.miss_probability! - b.miss_probability!)[0];

  return {
    canRunScenario: s.shipment.allowed_actions.includes('run_scenario'),
    canSelectRoute: s.shipment.allowed_actions.includes('select_route') && Boolean(altRoute),
    canAttest: s.shipment.allowed_actions.includes('attest'),
    onToggleStorm: () => void s.selectScenario(s.stormActive ? 'normal' : 'storm'),
    onRerouteAlternative: () => altRoute && s.selectRoute(altRoute.id),
    onVerifyEcmr: () => (s.verifyEcmr ? s.verifyEcmr() : s.attest('approved')),
  };
}
