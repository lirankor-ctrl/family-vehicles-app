export type NoteType = 'treatment' | 'general';

export interface Note {
  id: string;
  date: string;
  description: string;
  type: NoteType;
}

export interface VehicleDocument {
  id: string;
  docType: 'license' | 'insurance';
  fileName: string;
  fileData: string;
  mimeType: string;
  uploadedAt: string;
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
}
