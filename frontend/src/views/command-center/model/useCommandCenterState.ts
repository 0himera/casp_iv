'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCaspianPortsQuery } from '@/entities/cargo';
import { shipmentKeys, useHealthQuery, useShipmentDetailQuery, useShipmentsListQuery, API_BASE_URL } from '@/entities/shipment';
import { createCaspianClient, type Operation, type Role, type ScenarioRequest, type PlanningAssumptions } from '@/shared/api/caspian';
import { actionsForRole } from '@/entities/shipment/lib/permissions';
import { buildCommandHandlers } from './commandCenterRemote';
import { useOperationPolling } from './operationPolling';

export function useCommandCenterState() {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>('logistician');
  const [selectedId, setSelectedId] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);

  const health = useHealthQuery();
  const apiOnline = !health.isError && health.data?.status === 'ok';
  const listQuery = useShipmentsListQuery(role);
  const activeId = selectedId || (listQuery.isSuccess && !listQuery.isPlaceholderData ? listQuery.data.items[0]?.id : '') || '';
  const detail = useShipmentDetailQuery(activeId, role);
  const shipment = detail.data;
  const scenario = shipment.planning?.scenario ?? 'normal';
  const { data: ports } = useCaspianPortsQuery();
  const client = createCaspianClient(API_BASE_URL, () => role);
  const realCard = apiOnline && !detail.isPlaceholderData && !detail.isError && shipment.id === activeId;

  const refreshAll = useCallback((op?: Operation) => {
    if (op?.status === 'failed') setErrorBanner(`Операция не подтверждена: ${op.error_code ?? 'ошибка Casper'}`);
    void qc.invalidateQueries({ queryKey: shipmentKeys.all });
  }, [qc]);
  const polling = useOperationPolling(realCard ? shipment.pending_operation_id : null, role, apiOnline, refreshAll);
  const updateLocal = (next: typeof shipment) => qc.setQueryData(shipmentKeys.detail(activeId, role), next);
  const runRemote = (fn: () => Promise<Operation>) => {
    if (detail.isFetching || requestPending || polling.activeOperation || shipment.pending_operation_id) return;
    if (!realCard) { setErrorBanner('Демонстрационная карточка: операция не отправлена'); return; }
    setRequestPending(true);
    setErrorBanner(null);
    void fn().then(polling.startTracking).catch((e: Error) => { setErrorBanner(e.message); refreshAll(); }).finally(() => setRequestPending(false));
  };

  const handlers = buildCommandHandlers({
    shipment, role, client, runRemote,
  });

  const calculate = (next: ScenarioRequest['scenario'], assumptions = shipment.planning?.assumptions) => {
    if (!realCard || detail.isFetching || role !== 'logistician' || requestPending || polling.activeOperation || shipment.pending_operation_id) return;
    setRequestPending(true); setErrorBanner(null);
    void client.recalculate(activeId, { expected_revision: shipment.revision, scenario: next, assumptions }, crypto.randomUUID())
      .then((result) => { updateLocal(result); refreshAll(); })
      .catch((e: Error) => { setErrorBanner(e.message); refreshAll(); })
      .finally(() => setRequestPending(false));
  };

  return {
    items: listQuery.data.items,
    shipment: { ...shipment, allowed_actions: realCard ? actionsForRole(shipment, role) : [] },
    ports, apiOnline: realCard, role, scenario,
    errorBanner: errorBanner ?? polling.pollError,
    isBusy: requestPending || detail.isFetching || Boolean(polling.activeOperation || (realCard && shipment.pending_operation_id)),
    ...polling, setRole, setSelectedId,
    selectScenario: (next: ScenarioRequest['scenario']) => calculate(next),
    recalculate: (assumptions: PlanningAssumptions) => calculate(scenario, assumptions),
    selectRoute: (routeId: string) => {
      if (routeId === shipment.selected_route_id || polling.activeOperation || requestPending) return;
      handlers.selectRoute(routeId);
    },
    attest: handlers.attest,
    verifyEcmr: handlers.verifyEcmr,
    replaceDocument: handlers.replaceDocument,
  };
}
