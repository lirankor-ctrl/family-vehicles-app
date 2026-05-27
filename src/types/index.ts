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
