import { createContext, useContext, type ReactNode } from 'react';
import type { User } from 'firebase/auth';

const ResearchLabUserContext = createContext<User | null>(null);

export function ResearchLabUserProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return <ResearchLabUserContext.Provider value={user}>{children}</ResearchLabUserContext.Provider>;
}

export function useResearchLabUser() {
  return useContext(ResearchLabUserContext);
}
