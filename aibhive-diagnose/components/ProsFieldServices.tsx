import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { registerDiagnosePush, addNotificationResponseListener } from '@/lib/notifications/prosPush';
import {
  requestLocationPermissionIfTracking,
  startProsLocationTracker,
} from '@/lib/location/prosLocationTracker';
import { router } from 'expo-router';

/** Wires push registration + periodic GPS when signed into Pros. */
export function ProsFieldServices() {
  const { user, getIdToken } = useAuth();

  useEffect(() => {
    if (!user) return;
    void registerDiagnosePush(getIdToken);
    void requestLocationPermissionIfTracking(getIdToken);
    const stopTracker = startProsLocationTracker(getIdToken);
    const removeListener = addNotificationResponseListener((data) => {
      if (data.jobId) router.push(`/job/${data.jobId}` as never);
      else router.push('/(tabs)/alerts');
    });
    return () => {
      stopTracker();
      removeListener();
    };
  }, [user, getIdToken]);

  return null;
}
