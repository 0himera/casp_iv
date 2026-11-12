'use client';

import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import { useLiveOverview } from '@/entities/cargo';
import { useCorridors } from '../../model/useCorridors';

export function CorridorLines({ highlighted }: { highlighted: string[] }) {
  const live = useLiveOverview();
  const network = useCorridors();
  const data: FeatureCollection<LineString> = { type: 'FeatureCollection', features: (network.data?.items ?? []).flatMap((edge) => {
    const points = edge.port_ids.map((id) => live.data?.items.find((item) => item.port.id === id)?.port.coordinates);
    if (!points[0] || !points[1]) return [];
    return [{ type: 'Feature' as const, properties: { highlighted: highlighted.includes(edge.id) ? 1 : 0 }, geometry: { type: 'LineString' as const, coordinates: points.map((p) => [p!.longitude, p!.latitude]) } }];
  }) };
  return <Source id="published-corridors" type="geojson" data={data}>
    <Layer id="published-corridors-line" type="line" paint={{ 'line-color': ['case', ['==', ['get', 'highlighted'], 1], '#f4be68', '#8db4c5'], 'line-width': ['case', ['==', ['get', 'highlighted'], 1], 5, 1.5], 'line-dasharray': [2, 3], 'line-opacity': 0.8 }} />
  </Source>;
}
