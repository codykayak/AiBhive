import { createContext, useContext } from 'react';
import { PUBLIC_FABLE_API, type FableApiOptions } from './shared';

export const FableApiContext = createContext<FableApiOptions>(PUBLIC_FABLE_API);

export function useFableApi() {
  return useContext(FableApiContext);
}
