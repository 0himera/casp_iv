import type { createCaspianClient, Role, ScenarioRequest, Shipment } from '@/shared/api/caspian';
import { applyAttestationTransition, applyRouteSwitchTransition, applyScenarioTransition } from '@/entities/shipment';

interface RemoteHandlerParams {
  shipment: Shipment;
  role: Role;
  client: ReturnType<typeof createCaspianClient>;
  updateLocal: (next: Shipment) => void;
  runRemote: (fn: () => Promise<unknown>) => void;
  setErrorBanner: (msg: string | null) => void;
  setScenario: (sc: ScenarioRequest['scenario']) => void;
}

export function buildCommandHandlers({
  shipment, role, client, updateLocal, runRemote, setErrorBanner, setScenario,
}: RemoteHandlerParams) {
  const id = shipment.id;
  return {
    selectScenario: (next: ScenarioRequest['scenario']) => {
      setErrorBanner(null); setScenario(next);
      updateLocal(applyScenarioTransition(shipment, next));
      runRemote(() => client.setScenario({ shipment_id: id, scenario: next, expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    selectRoute: (routeId: string) => {
      setErrorBanner(null); updateLocal(applyRouteSwitchTransition(shipment, routeId));
      runRemote(() => client.selectRoute(id, { route_id: routeId, forecast_id: shipment.forecast.id, expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    attest: (decision: 'approved' | 'rejected') => {
      setErrorBanner(null); updateLocal(applyAttestationTransition(shipment, decision, role, false));
      runRemote(() => client.attest(id, { decision, expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    verifyEcmr: () => {
      setErrorBanner(null); updateLocal(applyAttestationTransition(shipment, 'approved', 'customs', true));
      runRemote(() => client.attest(id, { decision: 'approved', expected_revision: shipment.revision }, crypto.randomUUID()));
    },
  };
}
