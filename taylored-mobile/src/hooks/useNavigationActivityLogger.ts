import { useEffect, useRef, type RefObject } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import { logScreenVisit } from '../lib/userActivityLog';

export function useNavigationActivityLogger(
  navigationRef: React.RefObject<NavigationContainerRef<any> | null>
): void {
  const lastRoute = useRef<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const route = navigationRef.current?.getCurrentRoute();
      const name = route?.name;
      if (!name || name === lastRoute.current) return;
      lastRoute.current = name;
      void logScreenVisit(name, typeof route?.params === 'object' ? JSON.stringify(route.params).slice(0, 80) : undefined);
    }, 800);
    return () => clearInterval(id);
  }, [navigationRef]);
}
