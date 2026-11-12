"""Offline sea-only display routes; uv run --with shapely python tools/generate_marine_routes.py.

No bathymetry, fairways or vessel restrictions: this is not a navigational router.
"""
import heapq
import json
import math
from pathlib import Path
from shapely.geometry import Point, LineString, shape
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parents[1]
water = shape(json.loads((ROOT / 'data/geography/caspian-water.geojson').read_text())['geometry'])
# Keep grid nodes and segments offshore according to this generalized dataset.
safe = water.buffer(-0.005)
inside = prep(safe)
STEP = 0.04
nodes = {}
for i in range(230):
    for j in range(300):
        coord = (46 + i * STEP, 36 + j * STEP)
        if inside.covers(Point(coord)):
            nodes[(i, j)] = coord


def distance(a, b):
    return 111.2 * math.hypot((a[0] - b[0]) * math.cos(math.radians((a[1] + b[1]) / 2)), a[1] - b[1])

adj = {k: [] for k in nodes}
for key, coord in nodes.items():
    for di, dj in ((1, 0), (0, 1), (1, 1), (1, -1)):
        other = (key[0] + di, key[1] + dj)
        if other in nodes and inside.covers(LineString([coord, nodes[other]])):
            cost = distance(coord, nodes[other])
            adj[key].append((other, cost)); adj[other].append((key, cost))

ports = json.loads((ROOT / 'data/ports.json').read_text())['ports']
anchors, excluded, aliases = {}, {}, {}
for p in ports:
    aliases[p['name_ru']] = p['id']; aliases[p['id']] = p['id']
    if p['longitude'] is None:
        excluded[p['id']] = 'UNVERIFIED_COORDINATES'; continue
    point = (p['longitude'], p['latitude'])
    key = min(nodes, key=lambda k: distance(point, nodes[k]))
    gap = distance(point, nodes[key])
    if gap > 25:
        excluded[p['id']] = 'RIVER_OR_COASTAL_APPROACH_NOT_ROUTED'; continue
    anchors[p['id']] = {'key': key, 'coordinate': nodes[key], 'port_coordinate': point, 'offshore_gap_km': round(gap, 2)}

routes = {}
for start_id, start in anchors.items():
    costs = {start['key']: 0}; previous = {}; queue = [(0, start['key'])]
    while queue:
        cost, key = heapq.heappop(queue)
        if cost != costs[key]: continue
        for other, length in adj[key]:
            candidate = cost + length
            if candidate < costs.get(other, float('inf')):
                costs[other] = candidate; previous[other] = key
                heapq.heappush(queue, (candidate, other))
    for end_id, end in anchors.items():
        if end_id <= start_id or end['key'] not in costs: continue
        key = end['key']; path = [nodes[key]]
        while key != start['key']:
            key = previous[key]; path.append(nodes[key])
        path.reverse()
        # Visibility smoothing only when the entire candidate segment remains water.
        smoothed = [path[0]]; i = 0
        while i < len(path) - 1:
            j = len(path) - 1
            while j > i + 1 and not inside.covers(LineString([path[i], path[j]])): j -= 1
            smoothed.append(path[j]); i = j
        assert water.covers(LineString(smoothed)), (start_id, end_id)
        routes[start_id + '|' + end_id] = smoothed

payload = {'method': 'water-mask-grid-visibility-v1', 'source': 'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip',
           'note': 'Sea-only display geometry, not navigation. Endpoints are offshore; port and river approaches omitted.',
           'grid_degrees': STEP, 'aliases': aliases, 'ports': {p['id']: [p['longitude'], p['latitude']] for p in ports if p['longitude'] is not None}, 'anchors': {k: {f:v for f,v in p.items() if f != 'key'} for k,p in anchors.items()},
           'excluded': excluded, 'routes': routes}
target = ROOT / 'frontend/src/data/marineRoutes.json'
target.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n')
print('Sea routes:', len(routes), 'nodes:', len(nodes), 'excluded:', excluded)
print('Offshore gaps:', {k:v['offshore_gap_km'] for k,v in anchors.items()})
