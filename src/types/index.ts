export type NoteType = 'treatment' | 'general';

export interface Note {
  id: string;
  date: string;
  description: string;
  type: NoteType;
  /** Optional treatment title — added in v1.1; old persisted notes have it undefined. */
  title?: string;
}

export interface VehicleDocument {
  id: string;
  docType: 'license' | 'insurance';
  fileName: string;
  fileData: string;
  mimeType: string;
  uploadedAt: string;
}

/** Stable keys for the four supported vehicle subscriptions/services. */
export type SubscriptionKey = 'pango' | 'kvish6' | 'carmel' | 'fastlane';

export interface Subscription {
  key: SubscriptionKey;
  /** Whether the subscription is active for this vehicle. */
  active: boolean;
  /** Free-text note (e.g. "דרך העבודה"). */
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  driverName: string;
  vehicleType?: string;
  licensePlate?: string;
  licenseExpiryDate?: string;
  insuranceExpiryDate?: string;
  notes: Note[];
  documents: VehicleDocument[];
  createdAt: string;
  updatedAt: string;
  /** Archive flag — added in v1.2; missing on old persisted vehicles
   *  → treat as active (`!v.archived` is the canonical "is active" check). */
  archived?: boolean;
  /** ISO date when the vehicle was archived. Cleared on restore. */
  archivedAt?: string;
  /** Vehicle photo as a (resized) base64 data URL — added in v1.3.
   *  Missing on old persisted vehicles → fall back to the default illustration. */
  photo?: string;
  /** Subscriptions/services for this vehicle — added in v1.3.
   *  Only items the user actually filled in (active OR with notes) are shown. */
  subscriptions?: Subscription[];
}

// ─────────────────────────────────────────────────────────────────────────
// Accident Mode — added in v1.4. Fully additive: does not touch Vehicle,
// Note, VehicleDocument or Checklist. Stored under its own localStorage key
// (`family_accidents_v1`, see useAccidents.ts). Binary media (photos, video,
// audio, scanned documents) is NOT stored here — only a lightweight
// reference to a blob kept in IndexedDB (see services/accidentMediaDb.ts).
// ─────────────────────────────────────────────────────────────────────────

export type InjuryAnswer = 'yes' | 'no' | 'unsure';

/** A pointer to a binary blob stored in IndexedDB — never the blob itself. */
export interface AccidentMediaRef {
  id: string;
  kind: 'photo' | 'video' | 'audio' | 'document';
  fileName: string;
  mimeType: string;
  createdAt: string;
}

/** Fixed set of guided scene-documentation categories (step 8 of the wizard). */
export const ACCIDENT_SCENE_CATEGORIES = [
  'wide_scene',
  'my_car_all_sides',
  'my_car_damage_closeup',
  'other_car',
  'other_car_damage_closeup',
  'other_car_plate',
  'vehicles_position',
  'road_signs',
  'traffic_lights',
  'road_markings',
  'skid_marks',
  'debris',
  'additional_info',
] as const;

export type AccidentSceneCategory = typeof ACCIDENT_SCENE_CATEGORIES[number];

export interface AccidentSceneItem {
  category: AccidentSceneCategory;
  media: AccidentMediaRef[];
  note?: string;
}

/** An additional vehicle/driver involved in the accident (not the user's own). */
export interface AccidentOtherParty {
  id: string;
  driverName?: string;
  phone?: string;
  idNumber?: string;
  licensePlate?: string;
  vehicleModel?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  notes?: string;
  documents: AccidentMediaRef[];
}

export interface AccidentWitness {
  id: string;
  name?: string;
  phone?: string;
  note?: string;
}

export interface AccidentPoliceInfo {
  arrived?: boolean;
  reportNumber?: string;
  notes?: string;
}

export interface AccidentAmbulanceInfo {
  arrived?: boolean;
  notes?: string;
}

export interface AccidentTowingInfo {
  ordered?: boolean;
  company?: string;
  phone?: string;
  takenTo?: string;
  notes?: string;
}

/** Reminder-only checkboxes shown on the "before you leave" step — never block completion. */
export interface AccidentFinalChecklist {
  scenePhotographed?: boolean;
  ownCarDamagePhotographed?: boolean;
  otherCarPhotographed?: boolean;
  otherCarPlatePhotographed?: boolean;
  otherDriverDetailsCollected?: boolean;
  documentsPhotographed?: boolean;
  witnessDetailsCollected?: boolean;
  locationTimeDocumented?: boolean;
  policeTowDocumented?: boolean;
}

export interface AccidentCase {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Index of the wizard step the user last left off on (0-based). */
  currentStep: number;
  /** True once the user has reached the end of the guided wizard at least once. */
  wizardCompleted?: boolean;

  accidentDate?: string;
  accidentTime?: string;

  vehicleId?: string;
  /** Snapshot of the selected vehicle's info at selection time — copied (not
   *  live-referenced) so later edits or deletion of the Vehicle never alter
   *  or break historical accident-case data. */
  vehicleSnapshot?: {
    driverName: string;
    vehicleType?: string;
    licensePlate?: string;
    licenseExpiryDate?: string;
    insuranceExpiryDate?: string;
    photo?: string;
    documents: VehicleDocument[];
  };
  injuryAnswer?: InjuryAnswer;

  locationText?: string;
  description?: string;
  directionOfTravel?: string;
  roadConditions?: string;
  notes?: string;

  voiceRecordings: AccidentMediaRef[];
  sceneMedia: AccidentSceneItem[];
  otherParties: AccidentOtherParty[];
  witnesses: AccidentWitness[];

  policeInfo?: AccidentPoliceInfo;
  ambulanceInfo?: AccidentAmbulanceInfo;
  towingInfo?: AccidentTowingInfo;

  finalChecklist?: AccidentFinalChecklist;
}
