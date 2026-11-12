import type { Eta, Geometry, Money, Quality, Role } from './coreTypes';

export type Route = {
  id: string;
  name: string;
  ports: Array<string>;
  modes: Array<'rail' | 'road' | 'sea'>;
  distance_km: number;
  geometry: Geometry;
  geometry_kind: 'schematic' | 'measured';
  eta: Eta;
  miss_probability: number | null;
  cost: Money;
  emissions_kg_co2e: number | null;
  emissions_method: string;
  feasible: boolean;
  infeasibility_reason: string | null;
  capacity_status: 'confirmed' | 'unknown' | 'synthetic';
  requires_reapproval: boolean;
  source_ids: Array<string>;
};

export type Forecast = {
  id: string;
  generated_at: string;
  valid_until: string;
  method: 'scenario_fixture' | 'monte_carlo' | 'ml';
  quality: Quality;
  ready_at: Eta;
  cargo_cutoff: string;
  miss_probability: number | null;
  reasons: Array<string>;
};

export type Document = {
  id: string;
  kind: 'invoice' | 'packing_list';
  filename: string;
  version: number;
  sha256: string;
};

export type Attestation = {
  role: Role;
  version: number;
  decision: 'approved' | 'rejected';
  status: 'active' | 'invalidated' | 'expired' | 'revoked';
  valid_until: string;
};
