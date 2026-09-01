import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AccidentCase,
  AccidentMediaRef,
  AccidentSceneCategory,
  AccidentOtherParty,
  AccidentWitness,
  AccidentPoliceInfo,
  AccidentAmbulanceInfo,
  AccidentTowingInfo,
  AccidentFinalChecklist,
  ACCIDENT_SCENE_CATEGORIES,
  Vehicle,
} from '../types';
import { deleteMedia, deleteMediaForCase } from '../services/accidentMediaDb';

const STORAGE_KEY = 'family_accidents_v1';

function load(): AccidentCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AccidentCase[]) : [];
  } catch {
    return [];
  }
}

function persist(cases: AccidentCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {
    // localStorage quota exceeded — data stays in memory for this session
    console.warn('localStorage quota exceeded; accident cases not persisted.');
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function useAccidents() {
  const [cases, setCases] = useState<AccidentCase[]>(load);

  useEffect(() => {
    persist(cases);
  }, [cases]);

  /** Internal helper — every public mutator funnels through this so
   *  `updatedAt` is stamped consistently in one place. */
  const patchCase = useCallback((id: string, fn: (c: AccidentCase) => AccidentCase) => {
    setCases(prev =>
      prev.map(c => (c.id === id ? { ...fn(c), updatedAt: new Date().toISOString() } : c)),
    );
  }, []);

  const createCase = useCallback((): string => {
    const id = crypto.randomUUID();
    const now = new Date();
    const iso = now.toISOString();
    const newCase: AccidentCase = {
      id,
      createdAt: iso,
      updatedAt: iso,
      currentStep: 0,
      accidentDate: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
      accidentTime: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
      voiceRecordings: [],
      sceneMedia: ACCIDENT_SCENE_CATEGORIES.map(category => ({ category, media: [] })),
      otherParties: [],
      witnesses: [],
    };
    setCases(prev => [...prev, newCase]);
    return id;
  }, []);

  /** Permanently deletes the case and cascades to all of its IndexedDB media. */
  const deleteCase = useCallback(async (id: string) => {
    try {
      await deleteMediaForCase(id);
    } catch {
      // IndexedDB unavailable/failed — still remove the case record itself
    }
    setCases(prev => prev.filter(c => c.id !== id));
  }, []);

  const setStep = useCallback(
    (id: string, step: number) => patchCase(id, c => ({ ...c, currentStep: step })),
    [patchCase],
  );

  const markWizardCompleted = useCallback(
    (id: string) => patchCase(id, c => ({ ...c, wizardCompleted: true })),
    [patchCase],
  );

  const updateCaseFields = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          AccidentCase,
          | 'injuryAnswer'
          | 'accidentDate'
          | 'accidentTime'
          | 'locationText'
          | 'description'
          | 'directionOfTravel'
          | 'roadConditions'
          | 'notes'
        >
      >,
    ) => patchCase(id, c => ({ ...c, ...patch })),
    [patchCase],
  );

  const selectVehicle = useCallback(
    (id: string, vehicle: Vehicle) =>
      patchCase(id, c => ({
        ...c,
        vehicleId: vehicle.id,
        vehicleSnapshot: {
          driverName: vehicle.driverName,
          vehicleType: vehicle.vehicleType,
          licensePlate: vehicle.licensePlate,
          licenseExpiryDate: vehicle.licenseExpiryDate,
          insuranceExpiryDate: vehicle.insuranceExpiryDate,
          photo: vehicle.photo,
          documents: vehicle.documents,
        },
      })),
    [patchCase],
  );

  const addVoiceRecording = useCallback(
    (id: string, media: AccidentMediaRef) =>
      patchCase(id, c => ({ ...c, voiceRecordings: [...c.voiceRecordings, media] })),
    [patchCase],
  );

  const deleteVoiceRecording = useCallback(
    async (id: string, mediaId: string) => {
      try { await deleteMedia(mediaId); } catch { /* ignore */ }
      patchCase(id, c => ({ ...c, voiceRecordings: c.voiceRecordings.filter(m => m.id !== mediaId) }));
    },
    [patchCase],
  );

  const addSceneMedia = useCallback(
    (id: string, category: AccidentSceneCategory, media: AccidentMediaRef) =>
      patchCase(id, c => ({
        ...c,
        sceneMedia: c.sceneMedia.map(sc =>
          sc.category === category ? { ...sc, media: [...sc.media, media] } : sc,
        ),
      })),
    [patchCase],
  );

  const removeSceneMedia = useCallback(
    async (id: string, category: AccidentSceneCategory, mediaId: string) => {
      try { await deleteMedia(mediaId); } catch { /* ignore */ }
      patchCase(id, c => ({
        ...c,
        sceneMedia: c.sceneMedia.map(sc =>
          sc.category === category ? { ...sc, media: sc.media.filter(m => m.id !== mediaId) } : sc,
        ),
      }));
    },
    [patchCase],
  );

  const updateSceneNote = useCallback(
    (id: string, category: AccidentSceneCategory, note: string) =>
      patchCase(id, c => ({
        ...c,
        sceneMedia: c.sceneMedia.map(sc => (sc.category === category ? { ...sc, note } : sc)),
      })),
    [patchCase],
  );

  const addOtherParty = useCallback(
    (id: string): string => {
      const partyId = crypto.randomUUID();
      patchCase(id, c => ({ ...c, otherParties: [...c.otherParties, { id: partyId, documents: [] }] }));
      return partyId;
    },
    [patchCase],
  );

  const updateOtherParty = useCallback(
    (id: string, partyId: string, patch: Partial<Omit<AccidentOtherParty, 'id' | 'documents'>>) =>
      patchCase(id, c => ({
        ...c,
        otherParties: c.otherParties.map(p => (p.id === partyId ? { ...p, ...patch } : p)),
      })),
    [patchCase],
  );

  const addOtherPartyDocument = useCallback(
    (id: string, partyId: string, doc: AccidentMediaRef) =>
      patchCase(id, c => ({
        ...c,
        otherParties: c.otherParties.map(p =>
          p.id === partyId ? { ...p, documents: [...p.documents, doc] } : p,
        ),
      })),
    [patchCase],
  );

  const removeOtherPartyDocument = useCallback(
    async (id: string, partyId: string, mediaId: string) => {
      try { await deleteMedia(mediaId); } catch { /* ignore */ }
      patchCase(id, c => ({
        ...c,
        otherParties: c.otherParties.map(p =>
          p.id === partyId ? { ...p, documents: p.documents.filter(d => d.id !== mediaId) } : p,
        ),
      }));
    },
    [patchCase],
  );

  const removeOtherParty = useCallback(
    async (id: string, partyId: string) => {
      const kase = cases.find(c => c.id === id);
      const party = kase?.otherParties.find(p => p.id === partyId);
      if (party) {
        await Promise.all(party.documents.map(d => deleteMedia(d.id).catch(() => {})));
      }
      patchCase(id, c => ({ ...c, otherParties: c.otherParties.filter(p => p.id !== partyId) }));
    },
    [cases, patchCase],
  );

  const addWitness = useCallback(
    (id: string): string => {
      const witnessId = crypto.randomUUID();
      patchCase(id, c => ({ ...c, witnesses: [...c.witnesses, { id: witnessId }] }));
      return witnessId;
    },
    [patchCase],
  );

  const updateWitness = useCallback(
    (id: string, witnessId: string, patch: Partial<Omit<AccidentWitness, 'id'>>) =>
      patchCase(id, c => ({
        ...c,
        witnesses: c.witnesses.map(w => (w.id === witnessId ? { ...w, ...patch } : w)),
      })),
    [patchCase],
  );

  const removeWitness = useCallback(
    (id: string, witnessId: string) =>
      patchCase(id, c => ({ ...c, witnesses: c.witnesses.filter(w => w.id !== witnessId) })),
    [patchCase],
  );

  const updatePoliceInfo = useCallback(
    (id: string, patch: Partial<AccidentPoliceInfo>) =>
      patchCase(id, c => ({ ...c, policeInfo: { ...c.policeInfo, ...patch } })),
    [patchCase],
  );

  const updateAmbulanceInfo = useCallback(
    (id: string, patch: Partial<AccidentAmbulanceInfo>) =>
      patchCase(id, c => ({ ...c, ambulanceInfo: { ...c.ambulanceInfo, ...patch } })),
    [patchCase],
  );

  const updateTowingInfo = useCallback(
    (id: string, patch: Partial<AccidentTowingInfo>) =>
      patchCase(id, c => ({ ...c, towingInfo: { ...c.towingInfo, ...patch } })),
    [patchCase],
  );

  const toggleFinalChecklistItem = useCallback(
    (id: string, key: keyof AccidentFinalChecklist) =>
      patchCase(id, c => ({
        ...c,
        finalChecklist: { ...c.finalChecklist, [key]: !c.finalChecklist?.[key] },
      })),
    [patchCase],
  );

  const getCase = useCallback((id: string): AccidentCase | undefined => cases.find(c => c.id === id), [cases]);

  const sortedCases = useMemo(
    () => [...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [cases],
  );

  return {
    cases,
    sortedCases,
    createCase,
    deleteCase,
    setStep,
    markWizardCompleted,
    updateCaseFields,
    selectVehicle,
    addVoiceRecording,
    deleteVoiceRecording,
    addSceneMedia,
    removeSceneMedia,
    updateSceneNote,
    addOtherParty,
    updateOtherParty,
    addOtherPartyDocument,
    removeOtherPartyDocument,
    removeOtherParty,
    addWitness,
    updateWitness,
    removeWitness,
    updatePoliceInfo,
    updateAmbulanceInfo,
    updateTowingInfo,
    toggleFinalChecklistItem,
    getCase,
  };
}
