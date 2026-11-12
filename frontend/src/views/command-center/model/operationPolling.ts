'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/entities/shipment';
import { ApiError, createCaspianClient, type Operation, type Role } from '@/shared/api/caspian';

const STORAGE_KEY = 'caspian_pending_op';

export function useOperationPolling(
  pendingFromServer: string | null,
  role: Role,
  apiOnline: boolean,
  onSettled: (op: Operation) => void
) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const inFlight = useRef(false);
  const missingId = useRef<string | null>(null);

  const startTracking = useCallback((op: Operation) => {
    startedAtRef.current = Date.now();
    setTimedOut(false);
    setPollError(null);
    missingId.current = null;
    setOperation(op);
    sessionStorage.setItem(STORAGE_KEY, op.id);
  }, []);

  const pollOnce = useCallback(async (opId: string) => {
    if (inFlight.current || missingId.current === opId) return;
    inFlight.current = true;
    const client = createCaspianClient(API_BASE_URL, () => role);
    try {
    const next = await client.getOperation(opId);
    setPollError(null);
    if (next.status === 'confirmed' || next.status === 'simulated' || next.status === 'failed') {
      sessionStorage.removeItem(STORAGE_KEY);
      setOperation(null);
      setTimedOut(false);
      onSettled(next);
      return;
    }
    setOperation(next);
    if (Date.now() - startedAtRef.current >= 30_000) setTimedOut(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        missingId.current = opId;
        sessionStorage.removeItem(STORAGE_KEY);
        setPollError('Операция не найдена. Обновите карточку или проверьте её вручную.');
      } else {
        setPollError('Не удалось проверить операцию; повторяем запрос состояния.');
      }
    } finally {
      inFlight.current = false;
    }
  }, [onSettled, role]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
    const opId = operation?.id ?? pendingFromServer ?? saved;
    if (!opId || !apiOnline) return;
    if (!startedAtRef.current) startedAtRef.current = Date.now();
    const timer = setInterval(() => void pollOnce(opId), 5000);
    return () => clearInterval(timer);
  }, [apiOnline, operation?.id, pendingFromServer, pollOnce]);

  const recheckNow = () => {
    const opId = operation?.id ?? pendingFromServer;
    if (opId && apiOnline) { missingId.current = null; void pollOnce(opId); }
  };

  return { activeOperation: operation, operationTimedOut: timedOut, pollError, startTracking, recheckNow };
}
