'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCaspianPortsQuery } from '@/entities/cargo';
import { applyAttestationTransition, applyRouteSwitchTransition, applyScenarioTransition, shipmentKeys, useHealthQuery, useShipmentDetailQuery, useShipmentsListQuery, API_BASE_URL } from '@/entities/shipment';
import { createCaspianClient, type Operation, type Role, type ScenarioRequest } from '@/shared/api/caspian';
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
  const listData = listQuery.data;
  const activeId = selectedId || (!listQuery.isPlaceholderData ? listData.items[0]?.id : '') || '';
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
  return {
    items: listData.items, shipment, ports, apiOnline: realCard, role, scenario,
    errorBanner: errorBanner ?? polling.pollError,
    isBusy: requestPending || Boolean(polling.activeOperation || (realCard && shipment.pending_operation_id)), ...polling, setRole, setSelectedId,
    selectScenario: (next: ScenarioRequest['scenario']) => {
      setErrorBanner('Сценарий демонстрационный; API не выдаёт эти значения за фактические');
      setScenario(next);
      if (!realCard) updateLocal(applyScenarioTransition(shipment, next));
    },
    selectRoute: (routeId: string) => {
      if (routeId === shipment.selected_route_id || polling.activeOperation || requestPending) return;
      setErrorBanner(null);
      if (realCard) runRemote(() => client.selectRoute(activeId, { route_id: routeId, forecast_id: shipment.forecast.id, expected_revision: shipment.revision }, crypto.randomUUID()));
      else updateLocal(applyRouteSwitchTransition(shipment, routeId));
    },
    attest: (decision: 'approved' | 'rejected') => {
      setErrorBanner(null);
      if (realCard) runRemote(() => client.attest(activeId, { decision, expected_revision: shipment.revision }, crypto.randomUUID()));
      else updateLocal(applyAttestationTransition(shipment, decision, role, false));
    },
    verifyEcmr: () => setErrorBanner('Для согласования выберите роль и подтвердите её отдельно; это не решение таможни.'),
    replaceDocument: () => setErrorBanner('Для замены документа выберите файл в карточке'),
  };
}
