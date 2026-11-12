import { calculateEsgSummary, type CargoItem, type ClearanceStepStatus } from '@/entities/cargo';

export function applyStormToCargo(cargo: CargoItem, stormActive: boolean): CargoItem {
  if (!cargo.affectedByEnzeliStorm || cargo.isRerouted || !stormActive) {
    return cargo;
  }
  const stormDelay = Math.max(cargo.delayHours + 6, 22);
  return {
    ...cargo,
    status: 'critical',
    delayHours: stormDelay,
    bottleneckReason:
      'Шторм в Энзели: волнение моря 3.8 м + очередь на причале. Срыв стыковки с ж/д составом',
    graphNodes: cargo.graphNodes.map((node) =>
      node.id === 'n3' || node.id === 'n5'
        ? { ...node, status: 'critical', delayHours: stormDelay }
        : node
    ),
  };
}

export function applyRerouteToCargo(cargo: CargoItem): CargoItem {
  const alt = cargo.alternativeRoute;
  if (!alt) return cargo;
  return {
    ...cargo,
    routeTitle: cargo.routeTitle.replace('Энзели', 'Амирабад'),
    status: 'in-transit',
    delayHours: Math.max(0, cargo.delayHours - alt.delayReductionHours),
    bottleneckReason: null,
    segments: alt.segments,
    currentPosition: alt.currentPosition,
    graphNodes: alt.graphNodes,
    esg: alt.esg,
    isRerouted: true,
  };
}

export function applyPreClearanceSteps(
  cargo: CargoItem,
  nextStatus: ClearanceStepStatus,
  isCleared: boolean
): CargoItem {
  return {
    ...cargo,
    smartContract: {
      ...cargo.smartContract,
      isCleared,
      eCmrStatus: isCleared ? 'Verified & Cleared' : 'Верификация блокчейн-шлюза...',
      steps: cargo.smartContract.steps.map((s) => (s.status === 'cleared' ? s : { ...s, status: nextStatus })),
    },
  };
}

export function computeHeaderKpis(cargos: CargoItem[]) {
  const totalDelay = cargos.reduce((acc, c) => acc + c.delayHours, 0);
  const avgHubHours = Math.round(16 + totalDelay / cargos.length);
  const savedCo2Tons = 138.4 + cargos.reduce((acc, c) => acc + calculateEsgSummary(c.esg).savedKg, 0) / 1000;
  return { avgHubHours, savedCo2Tons };
}
