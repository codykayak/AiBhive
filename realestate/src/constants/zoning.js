export const EUGENE_CENTER = [-123.0868, 44.0521];
export const EUGENE_ZOOM = 12;

// Eugene zoning ArcGIS REST endpoint — Base Zones layer (id: 0)
// outSR=4326 reprojects from WKID 2914 to WGS84 for MapLibre
export const ZONING_URL =
  'https://gis.eugene-or.gov/arcgis/rest/services/PDD/PDDZoning/MapServer/0/query' +
  '?where=1%3D1&outFields=zonecode%2Czonename%2Czonejuris&outSR=4326&f=geojson';

// Zone code → display color mapping for dark theme
export const ZONE_COLORS = {
  'R-1':   '#4a7c4e',  // Low-Density Residential — muted green
  'R-1.5': '#5a9e5f',  // Rowhouse
  'R-2':   '#f5a623',  // Medium-Density — amber
  'R-3':   '#e8742a',  // Limited High-Density — orange
  'R-4':   '#d9534f',  // High-Density — red-orange
  'C-1':   '#7b68ee',  // Neighborhood Commercial — medium slate
  'C-2':   '#9b59b6',  // Community Commercial — purple
  'C-3':   '#8e44ad',  // Major Commercial
  'GO':    '#5b8dd9',  // General Office — blue
  'E-1':   '#2980b9',  // Campus Employment
  'E-2':   '#1abc9c',  // Mixed Use Employment — teal
  'I-2':   '#95a5a6',  // Light-Medium Industrial — grey
  'I-3':   '#7f8c8d',  // Heavy Industrial
  'PL':    '#3498db',  // Public Land
  'NR':    '#27ae60',  // Natural Resource
  'PRO':   '#16a085',  // Park / Recreation
  'AG':    '#d4ac0d',  // Agricultural
};

export const DEFAULT_ZONE_COLOR = '#444c56';

export const ZONE_DESCRIPTIONS = {
  'R-1':   'Low-Density Residential',
  'R-1.5': 'Rowhouse',
  'R-2':   'Medium-Density Residential',
  'R-3':   'Limited High-Density Residential',
  'R-4':   'High-Density Residential',
  'C-1':   'Neighborhood Commercial',
  'C-2':   'Community Commercial',
  'C-3':   'Major Commercial',
  'GO':    'General Office',
  'E-1':   'Campus Employment',
  'E-2':   'Mixed Use Employment',
  'I-2':   'Light-Medium Industrial',
  'I-3':   'Heavy Industrial',
  'PL':    'Public Land',
  'NR':    'Natural Resource',
  'PRO':   'Park, Recreation & Open Space',
  'AG':    'Agricultural',
};
