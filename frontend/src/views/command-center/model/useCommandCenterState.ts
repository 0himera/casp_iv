'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCaspianPortsQuery } from '@/entities/cargo';
import { shipmentKeys, useHealthQuery, useShipmentDetailQuery, useShipmentsListQuery, API_BASE_URL } from '@/entities/shipment';
import { ApiError, createCaspianClient, type Operation, type Role, type ScenarioRequest } from '@/shared/api/caspian';
import { useOperationPolling } from './operationPolling';

export function useCommandCenterState() {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>('logistician');
  const [selectedId, setSelectedId] = useState('shp_demo_001');
  const [scenario, setScenario] = useState<ScenarioRequest['scenario']>('normal');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const health = useHealthQuery();
  const apiOnline = health.data?.status === 'ok';
  const { data: listData } = useShipmentsListQuery(role, apiOnline);
  const { data: shipment } = useShipmentDetailQuery(selectedId, role, apiOnline);
  const { data: ports } = useCaspianPortsQuery();
  const client = createCaspianClient(API_BASE_URL, () => role);

  const refreshAll = useCallback(() => void qc.invalidateQueries({ queryKey: shipmentKeys.all }), [qc]);
  const onSettled = useCallback((op: Operation) => {
    if (op.status === 'failed') setErrorBanner(`Операция не выполнена: ${op.error_code ?? 'FAILED'}`);
    refreshAll();
  }, [refreshAll]);

  const polling = useOperationPolling(shipment.pending_operation_id, role, apiOnline, onSettled);
  const isBusy = submitting || Boolean(polling.activeOperation) || Boolean(shipment.pending_operation_id);

  const runAction = async (fn: () => Promise<Operation>) => {
    if (!apiOnline) { setErrorBanner('Mock API (:4010) недоступен. Запустите: bun run mock-api'); return; }
    setSubmitting(true); setErrorBanner(null);
    try { polling.startTracking(await fn()); } catch (err) {
      if (err instanceof ApiError && err.status === 409) { setErrorBanner(err.message); refreshAll(); }
      else setErrorBanner(err instanceof Error ? err.message : 'Ошибка запроса');
    } finally { setSubmitting(false); }
  };

  const selectScenario = async (next: ScenarioRequest['scenario']) => {
    if (!apiOnline) { setErrorBanner('Mock API (:4010) недоступен. Запустите: bun run mock-api'); return; }
    setSubmitting(true); setErrorBanner(null);
    try {
      const updated = await client.setScenario({ shipment_id: shipment.id, scenario: next, expected_revision: shipment.revision }, crypto.randomUUID());
      setScenario(next); qc.setQueryData(shipmentKeys.detail(shipment.id, role), updated); refreshAll();
    } catch (err) { setErrorBanner(err instanceof Error ? err.message : 'Ошибка сценария'); refreshAll(); }
    finally { setSubmitting(false); }
  };

  return {
    items: listData.items, shipment, ports, apiOnline, role, scenario, errorBanner, isBusy, ...polling,
    setRole, setSelectedId, selectScenario,
    selectRoute: (routeId: string) => void runAction(() => client.selectRoute(shipment.id, { route_id: routeId, forecast_id: shipment.forecast.id, expected_revision: shipment.revision }, crypto.randomUUID())),
    attest: (decision: 'approved' | 'rejected') => void runAction(() => client.attest(shipment.id, { decision, expected_revision: shipment.revision }, crypto.randomUUID())),
    replaceDocument: (document_id: string, filename: string, content_base64: string) => void runAction(() => client.replaceDocument(shipment.id, { document_id, filename, content_base64, expected_revision: shipment.revision }, crypto.randomUUID())),
  };
}
