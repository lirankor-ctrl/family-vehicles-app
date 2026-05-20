import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useVehicleStore } from './VehicleContext';
import {
  ActiveAlert,
  NotificationSettings,
  getActiveAlerts,
  loadSeenIds,
  loadSettings,
  saveSeenIds,
  saveSettings,
} from '../services/notifications';

interface NotificationStore {
  enabled:      boolean;
  setEnabled:   (v: boolean) => void;
  activeAlerts: ActiveAlert[];
  unseenAlerts: ActiveAlert[];
  showToast:    boolean;
  /** Marks every currently-active alert as seen. Safe to call repeatedly. */
  markAllSeen:  () => void;
}

const NotificationContext = createContext<NotificationStore | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { vehicles } = useVehicleStore();

  const [settings, setSettings] = useState<NotificationSettings>(() => loadSettings());
  const [seenIds,  setSeenIds]  = useState<string[]>(() => loadSeenIds());

  useEffect(() => { saveSettings(settings); }, [settings]);

  const activeAlerts = useMemo(() => getActiveAlerts(vehicles), [vehicles]);

  // prune seen IDs that no longer correspond to an active alert.
  // functional setState lets us avoid putting seenIds in the deps array.
  useEffect(() => {
    const activeIds = new Set(activeAlerts.map(a => a.id));
    setSeenIds(prev => {
      const pruned = prev.filter(id => activeIds.has(id));
      if (pruned.length === prev.length) return prev;
      saveSeenIds(pruned);
      return pruned;
    });
  }, [activeAlerts]);

  const unseenAlerts = useMemo(() => {
    const seen = new Set(seenIds);
    return activeAlerts.filter(a => !seen.has(a.id));
  }, [activeAlerts, seenIds]);

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings(s => ({ ...s, enabled }));
  }, []);

  const markAllSeen = useCallback(() => {
    const ids = activeAlerts.map(a => a.id);
    setSeenIds(ids);
    saveSeenIds(ids);
  }, [activeAlerts]);

  const value: NotificationStore = {
    enabled:      settings.enabled,
    setEnabled,
    activeAlerts,
    unseenAlerts,
    // showToast = there's something to surface AND the user hasn't muted it.
    // Once they hit X or "הצג", markAllSeen() empties unseen → toast hides.
    showToast:    settings.enabled && unseenAlerts.length > 0,
    markAllSeen,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationStore {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
