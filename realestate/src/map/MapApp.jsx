/**
 * Investor map CMS — isolated from marketing SEO pages.
 * Loaded only on /app/* via lazy import in App.jsx.
 */
import { useState } from 'react';
import Map from '../components/Map';
import Toolbar from '../components/Toolbar';
import Legend from '../components/Legend';
import { useZoningData } from '../hooks/useZoningData';
import '../App.css';

export default function MapApp() {
  const [zoningVisible, setZoningVisible] = useState(true);
  const { geojson, loading, error } = useZoningData();

  return (
    <div className="app-shell">
      <Toolbar
        zoningVisible={zoningVisible}
        onToggleZoning={() => setZoningVisible((v) => !v)}
        loading={loading}
        error={error}
      />
      <div className="map-container">
        <Map geojson={geojson} zoningVisible={zoningVisible} />
        <Legend visible={zoningVisible && !loading && !error} />
      </div>
      <a
        href="/"
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 200,
          background: '#0d1923ee',
          color: '#00c8b4',
          padding: '10px 16px',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          border: '1px solid #00c8b444',
        }}
      >
        ← Back to NW Investor site
      </a>
    </div>
  );
}
