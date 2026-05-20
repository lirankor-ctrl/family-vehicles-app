import { createContext, useContext, ReactNode } from 'react';
import { useChecklists } from './useChecklists';

type ChecklistContextType = ReturnType<typeof useChecklists>;

const ChecklistContext = createContext<ChecklistContextType | null>(null);

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const store = useChecklists();
  return <ChecklistContext.Provider value={store}>{children}</ChecklistContext.Provider>;
}

export function useChecklistStore(): ChecklistContextType {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error('useChecklistStore must be inside ChecklistProvider');
  return ctx;
}
