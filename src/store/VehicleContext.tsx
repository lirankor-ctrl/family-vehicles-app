import { createContext, useContext, ReactNode } from 'react';
import { useVehicles } from './useVehicles';

type VehicleContextType = ReturnType<typeof useVehicles>;

const VehicleContext = createContext<VehicleContextType | null>(null);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const store = useVehicles();
  return <VehicleContext.Provider value={store}>{children}</VehicleContext.Provider>;
}

export function useVehicleStore(): VehicleContextType {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicleStore must be inside VehicleProvider');
  return ctx;
}
