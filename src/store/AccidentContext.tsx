import { createContext, useContext, ReactNode } from 'react';
import { useAccidents } from './useAccidents';

type AccidentContextType = ReturnType<typeof useAccidents>;

const AccidentContext = createContext<AccidentContextType | null>(null);

export function AccidentProvider({ children }: { children: ReactNode }) {
  const store = useAccidents();
  return <AccidentContext.Provider value={store}>{children}</AccidentContext.Provider>;
}

export function useAccidentStore(): AccidentContextType {
  const ctx = useContext(AccidentContext);
  if (!ctx) throw new Error('useAccidentStore must be inside AccidentProvider');
  return ctx;
}
