// Tipos principales de GeoPatitas

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
}

export interface Pet {
  id: string;
  name?: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  color?: string;
  description: string;
  photo?: string;
  userId: string;
}

export interface Report {
  id: string;
  type: 'lost' | 'found';
  pet: Pet;
  location: Location;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  status: 'active' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  region: string;
}

export interface Match {
  id: string;
  lostReportId: string;
  foundReportId: string;
  similarity: number;
  distance: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: Date;
}
