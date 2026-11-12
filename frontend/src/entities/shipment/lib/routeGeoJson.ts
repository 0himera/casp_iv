import type { FeatureCollection, LineString, Feature } from 'geojson';
import { portCoordinate, seaRoute } from './marineGeometry';
import type { Shipment } from '@/shared/api/caspian';

export function buildMapRoutesGeoJson(shipment: Shipment): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  for (const route of shipment.routes) {
    const props = { id: route.id, selected: route.id === shipment.selected_route_id ? 1 : 0 };
    if (!route.modes.includes('sea')) {
      features.push({ type: 'Feature', properties: { ...props, primaryMode: route.modes[0] }, geometry: { type: 'LineString', coordinates: route.geometry.coordinates } });
      continue;
    }
    const first = portCoordinate(route.ports[0]);
    if (first && route.modes.some((mode) => mode !== 'sea')) {
      const points = route.geometry.coordinates;
      let nearest = 0;
      for (let i = 1; i < points.length; i++) {
        if (Math.hypot(points[i][0] - first[0], points[i][1] - first[1]) < Math.hypot(points[nearest][0] - first[0], points[nearest][1] - first[1])) nearest = i;
      }
      if (nearest > 0 && Math.hypot(points[nearest][0] - first[0], points[nearest][1] - first[1]) < 0.4) {
        features.push({ type: 'Feature', properties: { ...props, primaryMode: route.modes.find((m) => m !== 'sea') }, geometry: { type: 'LineString', coordinates: points.slice(0, nearest + 1) } });
      }
    }
    for (let i = 1; i < route.ports.length; i++) {
      const points = seaRoute(route.ports[i - 1], route.ports[i]);
      if (points) features.push({ type: 'Feature', properties: { ...props, primaryMode: 'sea' }, geometry: { type: 'LineString', coordinates: points } });
    }
  }
  return { type: 'FeatureCollection', features };
}

