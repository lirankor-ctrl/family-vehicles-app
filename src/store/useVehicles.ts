import { useState, useEffect, useCallback, useMemo } from 'react';
import { Vehicle, Note, VehicleDocument } from '../types';

const STORAGE_KEY = 'family_vehicles_v1';

function load(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Vehicle[]) : [];
  } catch {
    return [];
  }
}

function persist(vehicles: Vehicle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch {
    // localStorage quota exceeded — data stays in memory for this session
    console.warn('localStorage quota exceeded; data not persisted.');
  }
}

type VehicleInput = Pick<
  Vehicle,
  'driverName' | 'vehicleType' | 'licensePlate' | 'licenseExpiryDate' | 'insuranceExpiryDate' | 'photo'
>;

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(load);

  useEffect(() => {
    persist(vehicles);
  }, [vehicles]);

  const addVehicle = useCallback((data: VehicleInput): string => {
    const id  = crypto.randomUUID();
    const now = new Date().toISOString();
    setVehicles(prev => [
      ...prev,
      { ...data, id, notes: [], documents: [], createdAt: now, updatedAt: now },
    ]);
    return id;
  }, []);

  const updateVehicle = useCallback(
    (id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt'>>) => {
      setVehicles(prev =>
        prev.map(v =>
          v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v,
        ),
      );
    },
    [],
  );

  const deleteVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  /** Move to archive — flips `archived` flag and stamps `archivedAt`.
   *  Does NOT delete anything: notes, documents, dates all remain. */
  const archiveVehicle = useCallback((id: string) => {
    const now = new Date().toISOString();
    setVehicles(prev =>
      prev.map(v =>
        v.id === id ? { ...v, archived: true, archivedAt: now, updatedAt: now } : v,
      ),
    );
  }, []);

  /** Restore from archive — flips `archived` off and drops `archivedAt`
   *  (object spread + explicit delete keeps the persisted blob tidy). */
  const restoreVehicle = useCallback((id: string) => {
    const now = new Date().toISOString();
    setVehicles(prev =>
      prev.map(v => {
        if (v.id !== id) return v;
        const { archivedAt: _drop, ...rest } = v;
        return { ...rest, archived: false, updatedAt: now };
      }),
    );
  }, []);

  const addNote = useCallback((vehicleId: string, note: Omit<Note, 'id'>) => {
    const newNote: Note = { ...note, id: crypto.randomUUID() };
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId
          ? { ...v, notes: [newNote, ...v.notes], updatedAt: new Date().toISOString() }
          : v,
      ),
    );
  }, []);

  const deleteNote = useCallback((vehicleId: string, noteId: string) => {
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId
          ? { ...v, notes: v.notes.filter(n => n.id !== noteId), updatedAt: new Date().toISOString() }
          : v,
      ),
    );
  }, []);

  const addDocument = useCallback(
    (vehicleId: string, doc: Omit<VehicleDocument, 'id' | 'uploadedAt'>) => {
      const newDoc: VehicleDocument = {
        ...doc,
        id: crypto.randomUUID(),
        uploadedAt: new Date().toISOString(),
      };
      setVehicles(prev =>
        prev.map(v =>
          v.id === vehicleId
            ? { ...v, documents: [...v.documents, newDoc], updatedAt: new Date().toISOString() }
            : v,
        ),
      );
    },
    [],
  );

  const deleteDocument = useCallback((vehicleId: string, docId: string) => {
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId
          ? { ...v, documents: v.documents.filter(d => d.id !== docId), updatedAt: new Date().toISOString() }
          : v,
      ),
    );
  }, []);

  const getVehicle = useCallback(
    (id: string): Vehicle | undefined => vehicles.find(v => v.id === id),
    [vehicles],
  );

  // Memoized partitions — the canonical "is active" check is `!v.archived`
  // (treats missing field as active for backward compatibility with old data).
  const activeVehicles   = useMemo(() => vehicles.filter(v => !v.archived), [vehicles]);
  const archivedVehicles = useMemo(() => vehicles.filter(v =>  v.archived), [vehicles]);

  return {
    vehicles,            // full list (active + archived)
    activeVehicles,
    archivedVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,       // permanent delete
    archiveVehicle,
    restoreVehicle,
    addNote,
    deleteNote,
    addDocument,
    deleteDocument,
    getVehicle,
  };
}
