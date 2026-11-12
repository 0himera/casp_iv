'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  cargoKeys,
  useCaspianPortsQuery,
  useForecastQuery,
  useTransitCargosQuery,
  type CargoItem,
} from '@/entities/cargo';
import { INITIAL_CARGOS } from '@/data/mockTransitData';
import {
  applyPreClearanceSteps,
  applyRerouteToCargo,
  applyStormToCargo,
  computeHeaderKpis,
} from './cargoStateTransforms';

export function useCommandCenterState() {
  const queryClient = useQueryClient();
  const { data: cargos } = useTransitCargosQuery();
  const { data: ports } = useCaspianPortsQuery();
  const [stormActive, setStormActive] = useState(false);
  const { data: forecast } = useForecastQuery(stormActive);
  const [selectedId, setSelectedId] = useState(INITIAL_CARGOS[0].id);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const selectedCargo = useMemo(
    () => cargos.find((c) => c.id === selectedId) ?? cargos[0],
    [cargos, selectedId]
  );
  const updateCargos = (fn: (prev: CargoItem[]) => CargoItem[]) =>
    queryClient.setQueryData<CargoItem[]>(cargoKeys.cargos(), (prev = INITIAL_CARGOS) => fn(prev));

  const toggleStorm = () => {
    const next = !stormActive;
    setStormActive(next);
    updateCargos((prev) =>
      next ? prev.map((c) => applyStormToCargo(c, true)) : INITIAL_CARGOS.map((b) => prev.find((p) => p.id === b.id && p.isRerouted) ?? b)
    );
  };

  const rerouteCargo = (id: string) =>
    updateCargos((prev) => prev.map((c) => (c.id === id ? applyRerouteToCargo(c) : c)));

  const runPreClearance = (id: string) => {
    setVerifyingId(id);
    updateCargos((prev) => prev.map((c) => (c.id === id ? applyPreClearanceSteps(c, 'verifying', false) : c)));
    setTimeout(() => {
      updateCargos((prev) => prev.map((c) => (c.id === id ? applyPreClearanceSteps(c, 'cleared', true) : c)));
      setVerifyingId(null);
    }, 1100);
  };

  return { cargos, ports, forecast, selectedCargo, stormActive, verifyingId, ...computeHeaderKpis(cargos), setSelectedId, toggleStorm, rerouteCargo, runPreClearance };
}
