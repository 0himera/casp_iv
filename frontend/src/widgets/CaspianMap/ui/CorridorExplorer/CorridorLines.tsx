'use client';

import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import { seaRoute } from '@/entities/shipment/lib/marineGeometry';
import { useCorridors } from '../../model/useCorridors';

export function CorridorLines({ highlighted }: { highlighted: string[] }) {
  const network = useCorridors();
  const data: FeatureCollection<LineString> = { type: 'FeatureCollection', features: (network.data?.items ?? []).flatMap((edge) => {
    const points = seaRoute(edge.port_ids[0], edge.port_ids[1]);
    if (!points) return [];
    return [{ type: 'Feature' as const, properties: { highlighted: highlighted.includes(edge.id) ? 1 : 0 }, geometry: { type: 'LineString' as const, coordinates: points } }];
  }) };
  return <Source id="published-corridors" type="geojson" data={data}>
    <Layer id="published-corridors-line" type="line" paint={{ 'line-color': ['case', ['==', ['get', 'highlighted'], 1], '#f4be68', '#8db4c5'], 'line-width': ['case', ['==', ['get', 'highlighted'], 1], 5, 1.5], 'line-dasharray': [2, 3], 'line-opacity': 0.8 }} />
  </Source>;
}
