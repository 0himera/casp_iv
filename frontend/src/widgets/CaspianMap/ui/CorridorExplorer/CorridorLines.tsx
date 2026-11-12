'use client';

import { Layer, Source } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import { getCssVarColor } from '@/shared/lib/theme-colors';
import { seaRoute } from '@/entities/shipment/lib/marineGeometry';
import { smoothSeaArc } from '../../model/caspianGraticule';
import { useCorridors } from '../../model/useCorridors';

export function CorridorLines({ highlighted }: { highlighted: string[] }) {
  const network = useCorridors();
  const accent = getCssVarColor('--primary', 'transparent');
  const corridor = getCssVarColor('--accent-cyan', 'transparent');
  const data: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: (network.data?.items ?? []).flatMap((edge) => {
      const points = seaRoute(edge.port_ids[0], edge.port_ids[1]);
      if (!points) return [];
      return [{
        type: 'Feature' as const,
        properties: { highlighted: highlighted.includes(edge.id) ? 1 : 0 },
        geometry: { type: 'LineString' as const, coordinates: smoothSeaArc(points, 0.1) },
      }];
    }),
  };

  return (
    <Source id="published-corridors" type="geojson" data={data}>
      <Layer
        id="published-corridors-line"
        type="line"
        paint={{
          'line-color': ['case', ['==', ['get', 'highlighted'], 1], accent, corridor],
          'line-width': ['case', ['==', ['get', 'highlighted'], 1], 3, 1.2],
          'line-dasharray': [2, 3],
          'line-opacity': 0.68,
        }}
      />
    </Source>
  );
}
