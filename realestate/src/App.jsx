import { useState } from 'react';
import Map from './components/Map';
import Toolbar from './components/Toolbar';
import Legend from './components/Legend';
import { useZoningData } from './hooks/useZoningData';
import './App.css';

export default function App() {
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
    </div>
  );
}
