'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/entities/shipment';
import { createCaspianClient, type Operation, type Role } from '@/shared/api/caspian';

const STORAGE_KEY = 'caspian_pending_op';

export function useOperationPolling(
  pendingFromServer: string | null,
  role: Role,
  apiOnline: boolean,
  onSettled: (op: Operation) => void
) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAtRef = useRef<number>(0);

  const startTracking = useCallback((op: Operation) => {
    startedAtRef.current = Date.now();
    setTimedOut(false);
    setOperation(op);
    sessionStorage.setItem(STORAGE_KEY, op.id);
  }, []);

  const pollOnce = useCallback(async (opId: string) => {
    const client = createCaspianClient(API_BASE_URL, () => role);
    const next = await client.getOperation(opId);
    if (next.status === 'confirmed' || next.status === 'simulated' || next.status === 'failed') {
      sessionStorage.removeItem(STORAGE_KEY);
      setOperation(null);
      setTimedOut(false);
      onSettled(next);
      return;
    }
    setOperation(next);
    if (Date.now() - startedAtRef.current >= 30_000) setTimedOut(true);
  }, [onSettled, role]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
    const opId = operation?.id ?? pendingFromServer ?? saved;
    if (!opId || !apiOnline) return;
    if (!startedAtRef.current) startedAtRef.current = Date.now();
    const timer = setInterval(() => void pollOnce(opId), 1000);
    return () => clearInterval(timer);
  }, [apiOnline, operation?.id, pendingFromServer, pollOnce]);

  const recheckNow = () => {
    const opId = operation?.id ?? pendingFromServer;
    if (opId && apiOnline) void pollOnce(opId);
  };

  return { activeOperation: operation, operationTimedOut: timedOut, startTracking, recheckNow };
}
