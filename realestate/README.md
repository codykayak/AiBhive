# Eugene Zoning Map

Interactive map of Eugene, Oregon displaying city base zoning layers on a dark basemap.

## Stack

- **React + Vite** — frontend framework
- **MapLibre GL JS** — open-source map renderer
- **OpenFreeMap dark** — free dark basemap tiles (no API key required)
- **Eugene GIS ArcGIS REST API** — live zoning polygons from `gis.eugene-or.gov`

## Features

- Dark-themed map centered on Eugene (44.05°N, 123.09°W)
- Live zoning layer fetched from the City of Eugene's public GIS
- Color-coded by zone type (residential, commercial, industrial, etc.)
- Click any zone polygon for a popup showing the zone code and description
- Toggle to show/hide the zoning overlay
- Scrollable legend with zone categories

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Production Build

```bash
npm run build
```

Output lands in `dist/`.

## Deploy to Google Cloud Run

```bash
# Build and push the container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/eugene-zoning-map

# Deploy to Cloud Run
gcloud run deploy eugene-zoning-map \
  --image gcr.io/YOUR_PROJECT/eugene-zoning-map \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --port 8080
```

## Data Sources

| Layer | Source | License |
|-------|--------|---------|
| Basemap | [OpenFreeMap](https://openfreemap.org) | ODbL |
| Zoning | [City of Eugene GIS](https://gis.eugene-or.gov/arcgis/rest/services/PDD/PDDZoning/MapServer) | Public |
