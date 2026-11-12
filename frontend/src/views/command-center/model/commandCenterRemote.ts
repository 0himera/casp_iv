import type { createCaspianClient, Operation, Role, ScenarioRequest, Shipment } from '@/shared/api/caspian';
import { applyAttestationTransition, applyRouteSwitchTransition, applyScenarioTransition } from '@/entities/shipment';

interface RemoteHandlerParams {
  shipment: Shipment;
  role: Role;
  realCard: boolean;
  client: ReturnType<typeof createCaspianClient>;
  updateLocal: (next: Shipment) => void;
  runRemote: (fn: () => Promise<Operation>) => void;
  setErrorBanner: (msg: string | null) => void;
  setScenario: (sc: ScenarioRequest['scenario']) => void;
}

export function buildCommandHandlers({
  shipment, role, realCard, client, updateLocal, runRemote, setErrorBanner, setScenario,
}: RemoteHandlerParams) {
  const id = shipment.id;
  return {
    selectScenario: (next: ScenarioRequest['scenario']) => {
      setErrorBanner(null); setScenario(next);
      updateLocal(applyScenarioTransition(shipment, next));
    },
    selectRoute: (routeId: string) => {
      setErrorBanner(null);
      if (realCard) runRemote(() => client.selectRoute(id, { route_id: routeId, forecast_id: shipment.forecast.id, expected_revision: shipment.revision }, crypto.randomUUID()));
      else updateLocal(applyRouteSwitchTransition(shipment, routeId));
    },
    attest: (decision: 'approved' | 'rejected') => {
      setErrorBanner(null);
      if (realCard) runRemote(() => client.attest(id, { decision, expected_revision: shipment.revision }, crypto.randomUUID()));
      else updateLocal(applyAttestationTransition(shipment, decision, role, false));
    },
    verifyEcmr: () => {
      setErrorBanner(null);
      if (realCard) runRemote(() => client.attest(id, { decision: 'approved', expected_revision: shipment.revision }, crypto.randomUUID()));
      else updateLocal(applyAttestationTransition(shipment, 'approved', 'customs', true));
    },
  };
}
