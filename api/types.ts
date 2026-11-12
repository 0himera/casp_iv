// Generated from openapi.json. Run node tools/generate-types.mjs.

export type Role = "logistician" | "carrier" | "customs";

export type Quality = "observed" | "forecast" | "synthetic" | "stale" | "missing";

export type Action = "select_route" | "replace_document" | "attest" | "run_scenario";

export type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type Source = {
  id: string;
  name: string;
  url: string | null;
  quality: Quality;
  observed_at: string | null;
  note: string;
};

export type Eta = {
  p10: string | null;
  p50: string | null;
  p90: string | null;
};

export type Money = {
  amount_minor: number;
  currency: "RUB";
};

export type Geometry = {
  type: "LineString";
  coordinates: Array<Array<number>>;
};

export type Route = {
  id: string;
  name: string;
  ports: Array<string>;
  modes: Array<"rail" | "road" | "sea">;
  distance_km: number;
  geometry: Geometry;
  geometry_kind: "schematic" | "measured";
  eta: Eta;
  miss_probability: number | null;
  cost: Money;
  emissions_kg_co2e: number | null;
  emissions_method: string;
  feasible: boolean;
  infeasibility_reason: string | null;
  capacity_status: "confirmed" | "unknown" | "synthetic";
  requires_reapproval: boolean;
  source_ids: Array<string>;
};

export type Forecast = {
  id: string;
  generated_at: string;
  valid_until: string;
  method: "scenario_fixture" | "monte_carlo" | "ml";
  quality: Quality;
  ready_at: Eta;
  cargo_cutoff: string;
  miss_probability: number | null;
  reasons: Array<string>;
};

export type Document = {
  id: string;
  kind: "invoice" | "packing_list";
  filename: string;
  version: number;
  sha256: string;
};

export type Attestation = {
  role: Role;
  version: number;
  decision: "approved" | "rejected";
  status: "active" | "invalidated" | "expired" | "revoked";
  valid_until: string;
};

export type Passport = {
  version: number;
  status: "collecting" | "ready" | "blocked";
  documents_hash: string;
  route_hash: string;
  required_roles: Array<Role>;
  attestations: Array<Attestation>;
  network: "mock" | "casper-test";
  contract_address: string | null;
  transaction_hash: string | null;
  explorer_url: string | null;
};

export type TimelineEvent = {
  id: string;
  occurred_at: string;
  actor: string;
  title: string;
  passport_version: number;
};

export type Shipment = {
  id: string;
  revision: number;
  title: string;
  mass_tonnes: number;
  origin: Location;
  destination: Location;
  current_location: Location;
  movement_status: "planned" | "in_transit" | "at_port" | "delivered";
  scenario_time: string;
  updated_at: string;
  data_mode: "synthetic" | "mixed" | "live";
  selected_route_id: string;
  forecast: Forecast;
  routes: Array<Route>;
  documents: Array<Document>;
  passport: Passport;
  timeline: Array<TimelineEvent>;
  sources: Array<Source>;
  allowed_actions: Array<Action>;
  pending_operation_id: string | null;
};

export type ShipmentSummary = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  movement_status: "planned" | "in_transit" | "at_port" | "delivered";
  eta: string | null;
  miss_probability: number | null;
  passport_status: "collecting" | "ready" | "blocked";
};

export type ShipmentList = {
  items: Array<ShipmentSummary>;
};

export type Operation = {
  id: string;
  shipment_id: string;
  status: "queued" | "submitted" | "confirmed" | "simulated" | "failed";
  kind: "select_route" | "replace_document" | "attest";
  network: "mock" | "casper-test";
  transaction_hash: string | null;
  explorer_url: string | null;
  created_at: string;
  result_revision: number | null;
  error_code: string | null;
};

export type Health = {
  status: "ok";
  mode: "mock";
  api_version: string;
};

export type ErrorResponse = {
  error: {
  code: string;
  message: string;
};
};

export type RouteSelectionRequest = {
  route_id: string;
  forecast_id: string;
  expected_revision: number;
};

export type DocumentRevisionRequest = {
  document_id: string;
  filename: string;
  content_base64: string;
  expected_revision: number;
};

export type AttestationRequest = {
  decision: "approved" | "rejected";
  expected_revision: number;
};

export type ScenarioRequest = {
  shipment_id: string;
  scenario: "normal" | "storm" | "missing_data";
  expected_revision: number;
};
