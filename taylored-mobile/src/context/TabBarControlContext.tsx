import React, { createContext, useContext } from 'react';

type TabBarControlContextValue = {
  tabBarHidden: boolean;
  setTabBarHidden: (hidden: boolean) => void;
};

export const TabBarControlContext = createContext<TabBarControlContextValue | null>(null);

export function useTabBarControl() {
  return useContext(TabBarControlContext);
}
