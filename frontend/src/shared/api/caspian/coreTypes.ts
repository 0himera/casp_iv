import type { Shipment as ApiShipment } from '../../../../../api/public-data.types';

export type Role = 'logistician' | 'carrier' | 'customs';
export type Quality = 'observed' | 'forecast' | 'synthetic' | 'stale' | 'missing';
export type Action = ApiShipment['allowed_actions'][number];

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
  currency: 'RUB';
};

export type Geometry = {
  type: 'LineString';
  coordinates: Array<Array<number>>;
};
