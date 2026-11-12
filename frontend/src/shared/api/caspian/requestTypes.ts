export type ShipmentSummary = {
  id: string;
  title: string;
  origin: string;
  destination: string;
  movement_status: 'planned' | 'in_transit' | 'at_port' | 'delivered';
  eta: string | null;
  miss_probability: number | null;
  passport_status: 'collecting' | 'ready' | 'blocked';
};

export type ShipmentList = { items: Array<ShipmentSummary> };

export type Operation = {
  id: string;
  shipment_id: string;
  status: 'queued' | 'submitted' | 'confirmed' | 'simulated' | 'failed';
  kind: 'select_route' | 'replace_document' | 'attest';
  network: 'mock' | 'casper-test';
  transaction_hash: string | null;
  explorer_url: string | null;
  created_at: string;
  result_revision: number | null;
  error_code: string | null;
};

export type Health = { status: 'ok'; mode: 'mock'; api_version: string };
export type ErrorResponse = { error: { code: string; message: string } };

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
  decision: 'approved' | 'rejected';
  expected_revision: number;
};

export type ScenarioRequest = {
  shipment_id: string;
  scenario: 'normal' | 'storm' | 'missing_data';
  expected_revision: number;
};
