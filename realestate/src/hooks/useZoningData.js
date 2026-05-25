import { useState, useEffect } from 'react';
import { ZONING_URL } from '../constants/zoning';

export function useZoningData() {
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchZoning() {
      try {
        // The ArcGIS endpoint returns max 1000 features per request.
        // We paginate using resultOffset until all features are collected.
        const pageSize = 1000;
        let offset = 0;
        const allFeatures = [];
        let exceededLimit = true;

        while (exceededLimit) {
          const url =
            ZONING_URL +
            `&resultOffset=${offset}&resultRecordCount=${pageSize}`;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching zoning data`);

          const data = await res.json();
          if (cancelled) return;

          allFeatures.push(...(data.features ?? []));
          exceededLimit = data.exceededTransferLimit === true;
          offset += pageSize;
        }

        if (!cancelled) {
          setGeojson({
            type: 'FeatureCollection',
            features: allFeatures,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchZoning();
    return () => { cancelled = true; };
  }, []);

  return { geojson, loading, error };
}
