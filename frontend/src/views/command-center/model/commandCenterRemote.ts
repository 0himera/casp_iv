import type { createCaspianClient, Operation, Role, Shipment } from '@/shared/api/caspian';

interface RemoteHandlerParams {
  shipment: Shipment;
  role: Role;
  client: ReturnType<typeof createCaspianClient>;
  runRemote: (fn: () => Promise<Operation>) => void;
}

export function buildCommandHandlers({ shipment, client, role, runRemote }: RemoteHandlerParams) {
  const id = shipment.id;
  return {
    changeJourney: (origin: string, destination: string) => runRemote(() => client.changeJourney(id, {
      origin_port_id: origin, destination_port_id: destination, expected_revision: shipment.revision,
    }, crypto.randomUUID())),
    selectRoute: (routeId: string) => runRemote(() => client.selectRoute(id, {
      route_id: routeId, forecast_id: shipment.forecast.id,
      expected_revision: shipment.revision,
    }, crypto.randomUUID())),
    attest: (decision: 'approved' | 'rejected') => runRemote(() => client.attest(id, {
      decision, expected_revision: shipment.revision,
    }, crypto.randomUUID())),
    revoke: () => runRemote(() => client.revoke(id, shipment.revision, crypto.randomUUID())),
    verifyEcmr: () => {
      if (role === 'customs') runRemote(() => client.attest(id, {
        decision: 'approved', expected_revision: shipment.revision,
      }, crypto.randomUUID()));
    },
    replaceDocument: (documentId: string, filename: string, contentBase64: string) =>
      runRemote(() => client.replaceDocument(id, {
        document_id: documentId, filename, content_base64: contentBase64,
        expected_revision: shipment.revision,
      }, crypto.randomUUID())),
  };
}
