'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCaspianPortsQuery } from '@/entities/cargo';
import { shipmentKeys, useHealthQuery, useShipmentDetailQuery, useShipmentsListQuery, API_BASE_URL } from '@/entities/shipment';
import { createCaspianClient, type Operation, type Role, type ScenarioRequest } from '@/shared/api/caspian';
import { buildCommandHandlers } from './commandCenterRemote';
import { useOperationPolling } from './operationPolling';

export function useCommandCenterState() {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>('logistician');
  const [selectedId, setSelectedId] = useState('');
  const [scenario, setScenario] = useState<ScenarioRequest['scenario']>('normal');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);

  const health = useHealthQuery();
  const apiOnline = !health.isError && health.data?.status === 'ok';
  const listQuery = useShipmentsListQuery(role, apiOnline);
  const activeId = selectedId || (!listQuery.isPlaceholderData ? listQuery.data.items[0]?.id : '') || '';
  const detail = useShipmentDetailQuery(activeId, role, apiOnline);
  const shipment = detail.data;
  const { data: ports } = useCaspianPortsQuery();
  const client = createCaspianClient(API_BASE_URL, () => role);
  const realCard = apiOnline && !detail.isPlaceholderData && !detail.isError && shipment.id === activeId;

  const refreshAll = useCallback(() => void qc.invalidateQueries({ queryKey: shipmentKeys.all }), [qc]);
  const polling = useOperationPolling(realCard ? shipment.pending_operation_id : null, role, apiOnline, refreshAll);
  const updateLocal = (next: typeof shipment) => qc.setQueryData(shipmentKeys.detail(activeId, role), next);
  const runRemote = (fn: () => Promise<Operation>) => {
    if (!realCard) { setErrorBanner('Демонстрационная карточка: операция не отправлена'); return; }
    setRequestPending(true);
    void fn().then(polling.startTracking).catch((e: Error) => { setErrorBanner(e.message); refreshAll(); }).finally(() => setRequestPending(false));
  };

  const handlers = buildCommandHandlers({
    shipment, role, realCard, client, updateLocal, runRemote, setErrorBanner, setScenario,
  });

  return {
    items: listQuery.data.items, shipment, ports, apiOnline: realCard, role, scenario,
    errorBanner: errorBanner ?? polling.pollError,
    isBusy: requestPending || Boolean(polling.activeOperation || (realCard && shipment.pending_operation_id)),
    ...polling, setRole, setSelectedId,
    selectScenario: handlers.selectScenario,
    selectRoute: (routeId: string) => {
      if (routeId === shipment.selected_route_id || polling.activeOperation || requestPending) return;
      handlers.selectRoute(routeId);
    },
    attest: handlers.attest,
    verifyEcmr: handlers.verifyEcmr,
    replaceDocument: () => setErrorBanner('Замена документов доступна в карточке отправки'),
  };
}
