import React from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { findUserApp, HiveAppPlaceholderScreen } from '../userApps';

type Params = { slug?: string; title?: string; summary?: string };

/**
 * Resolves a `UserApp` route to either the registered component for the
 * given slug, or the placeholder screen that tells the user to update
 * AiBhive if the build's screen hasn't shipped yet.
 */
export default function UserAppHostScreen() {
  const route = useRoute<RouteProp<{ UserApp: Params }, 'UserApp'>>();
  const slug = route.params?.slug;
  const entry = findUserApp(slug);
  if (entry) {
    const Component = entry.component;
    return <Component {...(route.params || {})} />;
  }
  return <HiveAppPlaceholderScreen />;
}
