# Caspian water mask

`caspian-water.geojson` is the largest enclosed water component inside 46–55°E,
36–48°N after subtracting Natural Earth 1:10m land polygons, retaining islands.
Source: https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip
Natural Earth data is public domain. The mask is generalized, not a navigation chart.

`tools/generate_marine_routes.py` builds a 0.04° water grid, validates whole edges
against a 0.005° inward buffer, then computes shortest paths and water-only visibility
smoothing. The output is `frontend/src/data/marineRoutes.json`; every final segment
must be covered by the water polygon. No straight-line fallback is permitted.

Port coordinates are snapped to offshore grid nodes within 25 km. The output
records the offshore gap, which can be large (Kuryk ~15 km). These are sea-only display
paths: port approaches, rivers, depth, draft, fairways, weather and restrictions are
not routed. Astrakhan is excluded because its river approach is not represented.
Unverified coordinates (Alat, Olya) are excluded. This does not establish a sailing.

Archive SHA-256: `e547d749445eaa0964aba76738090ec88f5e63c4585122170f98c67a7ea922dc`.
Natural Earth version: 5.1.1.
