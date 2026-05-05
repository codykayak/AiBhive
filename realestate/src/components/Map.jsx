import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  EUGENE_CENTER,
  EUGENE_ZOOM,
  ZONE_COLORS,
  DEFAULT_ZONE_COLOR,
  ZONE_DESCRIPTIONS,
} from '../constants/zoning';

const ZONING_SOURCE = 'eugene-zoning';
const ZONING_FILL_LAYER = 'zoning-fill';
const ZONING_OUTLINE_LAYER = 'zoning-outline';

// Build a MapLibre match expression from the zone color map
function buildColorExpression() {
  const expr = ['match', ['get', 'zonecode']];
  for (const [code, color] of Object.entries(ZONE_COLORS)) {
    expr.push(code, color);
  }
  expr.push(DEFAULT_ZONE_COLOR);
  return expr;
}

export default function Map({ geojson, zoningVisible }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  // Initialise map once
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: EUGENE_CENTER,
      zoom: EUGENE_ZOOM,
      minZoom: 9,
      maxZoom: 19,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(
      new maplibregl.ScaleControl({ unit: 'imperial' }),
      'bottom-right',
    );

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '280px',
      className: 'zoning-popup',
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add / update zoning source + layers when geojson arrives
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    function addLayers() {
      if (!map.getSource(ZONING_SOURCE)) {
        map.addSource(ZONING_SOURCE, { type: 'geojson', data: geojson });
      } else {
        map.getSource(ZONING_SOURCE).setData(geojson);
      }

      if (!map.getLayer(ZONING_FILL_LAYER)) {
        map.addLayer({
          id: ZONING_FILL_LAYER,
          type: 'fill',
          source: ZONING_SOURCE,
          paint: {
            'fill-color': buildColorExpression(),
            'fill-opacity': 0.45,
          },
        });
      }

      if (!map.getLayer(ZONING_OUTLINE_LAYER)) {
        map.addLayer({
          id: ZONING_OUTLINE_LAYER,
          type: 'line',
          source: ZONING_SOURCE,
          paint: {
            'line-color': '#ffffff',
            'line-opacity': 0.15,
            'line-width': 0.5,
          },
        });
      }
    }

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('load', addLayers);
    }
  }, [geojson]);

  // Toggle layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function applyVisibility() {
      const v = zoningVisible ? 'visible' : 'none';
      if (map.getLayer(ZONING_FILL_LAYER)) {
        map.setLayoutProperty(ZONING_FILL_LAYER, 'visibility', v);
      }
      if (map.getLayer(ZONING_OUTLINE_LAYER)) {
        map.setLayoutProperty(ZONING_OUTLINE_LAYER, 'visibility', v);
      }
    }

    if (map.isStyleLoaded()) {
      applyVisibility();
    } else {
      map.once('load', applyVisibility);
    }
  }, [zoningVisible]);

  // Click handler — show popup with zone info
  const handleClick = useCallback((e) => {
    const map = mapRef.current;
    if (!map || !zoningVisible) return;

    const features = map.queryRenderedFeatures(e.point, {
      layers: [ZONING_FILL_LAYER],
    });

    if (!features.length) {
      popupRef.current.remove();
      return;
    }

    const { zonecode, zonename } = features[0].properties;
    const desc =
      ZONE_DESCRIPTIONS[zonecode] ||
      zonename ||
      'Unknown zone';

    popupRef.current
      .setLngLat(e.lngLat)
      .setHTML(
        `<div class="popup-content">
          <span class="popup-badge" style="background:${ZONE_COLORS[zonecode] ?? DEFAULT_ZONE_COLOR}">${zonecode}</span>
          <p class="popup-desc">${desc}</p>
        </div>`,
      )
      .addTo(map);
  }, [zoningVisible]);

  // Cursor change on hover
  const handleMouseEnter = useCallback(() => {
    const map = mapRef.current;
    if (map && zoningVisible) map.getCanvas().style.cursor = 'pointer';
  }, [zoningVisible]);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = '';
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    function attach() {
      map.on('click', ZONING_FILL_LAYER, handleClick);
      map.on('mouseenter', ZONING_FILL_LAYER, handleMouseEnter);
      map.on('mouseleave', ZONING_FILL_LAYER, handleMouseLeave);
    }

    if (map.isStyleLoaded()) {
      attach();
    } else {
      map.once('load', attach);
    }

    return () => {
      map.off('click', ZONING_FILL_LAYER, handleClick);
      map.off('mouseenter', ZONING_FILL_LAYER, handleMouseEnter);
      map.off('mouseleave', ZONING_FILL_LAYER, handleMouseLeave);
    };
  }, [geojson, handleClick, handleMouseEnter, handleMouseLeave]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
