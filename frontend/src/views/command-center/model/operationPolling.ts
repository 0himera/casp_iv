'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Operation, Role } from '@/shared/api/caspian';
import { fetchOperationState } from './operationFetch';

const STORAGE_KEY = 'caspian_pending_op';

export function useOperationPolling(
  pendingFromServer: string | null, role: Role, apiOnline: boolean, onSettled: (op: Operation) => void
) {
  const [operation, setOperation] = useState<Operation | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const startedAtRef = useRef(0);
  const inFlightRef = useRef(false);
  const missingIdRef = useRef<string | null>(null);

  const startTracking = useCallback((op: Operation) => {
    startedAtRef.current = Date.now();
    setTimedOut(false); setPollError(null); missingIdRef.current = null;
    setOperation(op); sessionStorage.setItem(STORAGE_KEY, op.id);
  }, []);

  const pollOnce = useCallback(async (opId: string) => {
    if (inFlightRef.current || missingIdRef.current === opId) return;
    inFlightRef.current = true;
    const res = await fetchOperationState(opId, role);
    inFlightRef.current = false;
    if (res.isNotFound) {
      missingIdRef.current = opId; sessionStorage.removeItem(STORAGE_KEY);
      setPollError(res.error); return;
    }
    if (res.error) { setPollError(res.error); return; }
    if (!res.next) return;
    setPollError(null);
    if (['confirmed', 'simulated', 'failed'].includes(res.next.status)) {
      sessionStorage.removeItem(STORAGE_KEY);
      setOperation(null); setTimedOut(false);
      onSettled(res.next); return;
    }
    setOperation(res.next);
    if (Date.now() - startedAtRef.current >= 30_000) setTimedOut(true);
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
    if (opId && apiOnline) { missingIdRef.current = null; void pollOnce(opId); }
  };
  return { activeOperation: operation, operationTimedOut: timedOut, pollError, startTracking, recheckNow };
}
