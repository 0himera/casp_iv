import type { Action, Location, Role, Source } from './coreTypes';
import type { Attestation, Document, Forecast, Route } from './routeDocTypes';
import type { PlanningSummary } from '../../../../../api/public-data.types';
export type { PlanningSummary, PlanningAssumptions, RecalculateRequest } from '../../../../../api/public-data.types';

export type Passport = {
  version: number;
  status: 'collecting' | 'ready' | 'blocked';
  documents_hash: string;
  route_hash: string;
  required_roles: Array<Role>;
  attestations: Array<Attestation>;
  network: 'mock' | 'casper-test';
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
  movement_status: 'planned' | 'in_transit' | 'at_port' | 'delivered';
  scenario_time: string;
  updated_at: string;
  data_mode: 'synthetic' | 'mixed' | 'live';
  selected_route_id: string;
  forecast: Forecast;
  routes: Array<Route>;
  documents: Array<Document>;
  passport: Passport;
  timeline: Array<TimelineEvent>;
  sources: Array<Source>;
  allowed_actions: Array<Action>;
  pending_operation_id: string | null;
  planning?: PlanningSummary | null;
};
