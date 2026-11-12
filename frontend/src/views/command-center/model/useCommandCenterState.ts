'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCaspianPortsQuery } from '@/entities/cargo';
import {
  applyAttestationTransition,
  applyRouteSwitchTransition,
  applyScenarioTransition,
  shipmentKeys,
  useHealthQuery,
  useShipmentDetailQuery,
  useShipmentsListQuery,
  API_BASE_URL,
} from '@/entities/shipment';
import { createCaspianClient, type Role, type ScenarioRequest } from '@/shared/api/caspian';
import { useOperationPolling } from './operationPolling';

export function useCommandCenterState() {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>('logistician');
  const [selectedId, setSelectedId] = useState('shp_demo_001');
  const [scenario, setScenario] = useState<ScenarioRequest['scenario']>('normal');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const health = useHealthQuery();
  const apiOnline = health.data?.status === 'ok';
  const { data: listData } = useShipmentsListQuery(role, apiOnline);
  const { data: shipment } = useShipmentDetailQuery(selectedId, role, apiOnline);
  const { data: ports } = useCaspianPortsQuery();
  const client = createCaspianClient(API_BASE_URL, () => role);

  const refreshAll = useCallback(() => void qc.invalidateQueries({ queryKey: shipmentKeys.all }), [qc]);
  const polling = useOperationPolling(shipment.pending_operation_id, role, apiOnline, refreshAll);
  const updateLocal = (next: typeof shipment) => qc.setQueryData(shipmentKeys.detail(shipment.id, role), next);

  const selectScenario = (next: ScenarioRequest['scenario']) => {
    setScenario(next);
    updateLocal(applyScenarioTransition(shipment, next));
    if (apiOnline) void client.setScenario({ shipment_id: shipment.id, scenario: next, expected_revision: shipment.revision }, crypto.randomUUID()).catch(() => refreshAll());
  };

  const selectRoute = (routeId: string) => {
    updateLocal(applyRouteSwitchTransition(shipment, routeId));
    if (apiOnline) void client.selectRoute(shipment.id, { route_id: routeId, forecast_id: shipment.forecast.id, expected_revision: shipment.revision }, crypto.randomUUID()).catch(() => refreshAll());
  };

  return {
    items: listData.items, shipment, ports, apiOnline, role, scenario, errorBanner,
    isBusy: Boolean(polling.activeOperation), ...polling,
    setRole, setSelectedId, selectScenario, selectRoute,
    attest: (decision: 'approved' | 'rejected') => {
      updateLocal(applyAttestationTransition(shipment, decision, role, false));
      if (apiOnline) void client.attest(shipment.id, { decision, expected_revision: shipment.revision }, crypto.randomUUID()).catch(() => refreshAll());
    },
    verifyEcmr: () => {
      updateLocal(applyAttestationTransition(shipment, 'approved', 'customs', true));
      if (apiOnline) void client.attest(shipment.id, { decision: 'approved', expected_revision: shipment.revision }, crypto.randomUUID()).catch(() => refreshAll());
    },
    replaceDocument: () => setErrorBanner('Замена документов доступна в режиме онлайн'),
  };
}
