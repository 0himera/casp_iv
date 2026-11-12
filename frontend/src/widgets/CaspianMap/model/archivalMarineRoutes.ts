import { seaRoute } from '@/entities/shipment/lib/marineGeometry';
import { ARCHIVAL_GEO, projectArchivalCoord } from './archivalPins';

export const ARCHIVAL_MARINE_ROUTES = ARCHIVAL_GEO.routes.flatMap((route) => {
  const coordinates = seaRoute(route.from, route.to);
  if (!coordinates) return [];
  const d = coordinates.map(([lng, lat], i) => {
    const point = projectArchivalCoord(lng, lat);
    return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');
  return [{ ...route, d }];
});
