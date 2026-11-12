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
      updateLocal(applyRouteSwitchTransition(shipment, routeId));
      const isBackendRoute = routeId === 'route_astra' || routeId === 'route_makh';
      if (realCard && isBackendRoute) {
        runRemote(() =>
          client.selectRoute(
            id,
            {
              route_id: routeId,
              forecast_id: shipment.forecast.id,
              expected_revision: shipment.revision,
            },
            crypto.randomUUID()
          )
        );
      }
    },
    attest: (decision: 'approved' | 'rejected') => {
      setErrorBanner(null);
      updateLocal(applyAttestationTransition(shipment, decision, role, false));
      if (realCard) runRemote(() => client.attest(id, { decision, expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    verifyEcmr: () => {
      setErrorBanner(null);
      updateLocal(applyAttestationTransition(shipment, 'approved', 'customs', true));
      if (realCard) runRemote(() => client.attest(id, { decision: 'approved', expected_revision: shipment.revision }, crypto.randomUUID()));
    },
  };
}
