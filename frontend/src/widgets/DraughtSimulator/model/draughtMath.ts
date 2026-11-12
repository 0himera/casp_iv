export interface BasinPortSpec {
  id: string;
  label: string;
  baseDepthM: number;
  criticalMsl: number;
  surchargePerTonne: number;
  congestionBase: number;
}

export const BASIN_PORTS: BasinPortSpec[] = [
  { id: 'astrakhan', label: 'Астрахань (ВКМСК)', baseDepthM: 4.5, criticalMsl: -28.45, surchargePerTonne: 185, congestionBase: 64 },
  { id: 'makhachkala', label: 'Махачкала (РФ)', baseDepthM: 6.8, criticalMsl: -29.1, surchargePerTonne: 120, congestionBase: 41 },
  { id: 'aktau', label: 'Актау (KZ)', baseDepthM: 7.4, criticalMsl: -29.2, surchargePerTonne: 110, congestionBase: 48 },
  { id: 'baku', label: 'Баку / Алят (AZ)', baseDepthM: 7.2, criticalMsl: -29.15, surchargePerTonne: 115, congestionBase: 52 },
];

export function computeDraughtTelemetry(port: BasinPortSpec, msl: number, tonnes: number) {
  const drawdown = Math.max(0, Math.abs(msl) - 28.0);
  const availableDepth = Math.max(2.6, Number((port.baseDepthM - drawdown * 0.95).toFixed(2)));
  const requiredDraught = Number((2.8 + (tonnes / 8000) * 2.1).toFixed(2));
  const ukc = Number((availableDepth - requiredDraught).toFixed(2));
  const safeDwt = Math.max(1200, Math.round((availableDepth - 2.6) * 1950));
  const ecoEscrow = Math.round(tonnes * port.surchargePerTonne * (msl < port.criticalMsl ? 1.35 : 1));
  const congestion = Math.min(98, Math.round(port.congestionBase + drawdown * 18));
  return { availableDepth, requiredDraught, ukc, safeDwt, ecoEscrow, congestion, atRisk: ukc < 0.45 };
}
