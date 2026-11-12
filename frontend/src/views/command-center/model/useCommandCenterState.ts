'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCaspianPortsQuery } from '@/entities/cargo';
import { applyAttestationTransition, applyRouteSwitchTransition, applyScenarioTransition, shipmentKeys, useHealthQuery, useShipmentDetailQuery, useShipmentsListQuery, API_BASE_URL } from '@/entities/shipment';
import { createCaspianClient, type Role, type ScenarioRequest } from '@/shared/api/caspian';
import { useOperationPolling } from './operationPolling';

export function useCommandCenterState() {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>('logistician');
  const [selectedId, setSelectedId] = useState('');
  const [scenario, setScenario] = useState<ScenarioRequest['scenario']>('normal');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const health = useHealthQuery();
  const apiOnline = health.data?.status === 'ok';
  const { data: listData } = useShipmentsListQuery(role, apiOnline);
  const activeId = selectedId || listData.items[0]?.id || 'shp_aa6da7b5570d40558753311ea265088e';
  const { data: shipment } = useShipmentDetailQuery(activeId, role, apiOnline);
  const { data: ports } = useCaspianPortsQuery();
  const client = createCaspianClient(API_BASE_URL, () => role);

  const refreshAll = useCallback(() => void qc.invalidateQueries({ queryKey: shipmentKeys.all }), [qc]);
  const polling = useOperationPolling(shipment.pending_operation_id, role, apiOnline, refreshAll);
  const updateLocal = (next: typeof shipment) => qc.setQueryData(shipmentKeys.detail(activeId, role), next);
  const runRemote = (fn: () => Promise<unknown>) => {
    if (apiOnline) void fn().catch((e: Error) => { setErrorBanner(e.message); refreshAll(); });
  };

  return {
    items: listData.items, shipment, ports, apiOnline, role, scenario, errorBanner,
    isBusy: Boolean(polling.activeOperation), ...polling,
    setRole, setSelectedId,
    selectScenario: (next: ScenarioRequest['scenario']) => {
      setErrorBanner(null); setScenario(next);
      updateLocal(applyScenarioTransition(shipment, next));
      runRemote(() => client.setScenario({ shipment_id: activeId, scenario: next, expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    selectRoute: (routeId: string) => {
      if (routeId === shipment.selected_route_id || polling.activeOperation) return;
      setErrorBanner(null); updateLocal(applyRouteSwitchTransition(shipment, routeId));
      runRemote(() => client.selectRoute(activeId, { route_id: routeId, forecast_id: shipment.forecast.id, expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    attest: (decision: 'approved' | 'rejected') => {
      setErrorBanner(null); updateLocal(applyAttestationTransition(shipment, decision, role, false));
      runRemote(() => client.attest(activeId, { decision, expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    verifyEcmr: () => {
      setErrorBanner(null); updateLocal(applyAttestationTransition(shipment, 'approved', 'customs', true));
      runRemote(() => client.attest(activeId, { decision: 'approved', expected_revision: shipment.revision }, crypto.randomUUID()));
    },
    replaceDocument: () => setErrorBanner('Замена документов доступна в режиме онлайн'),
  };
}
