import { Coordinates, DataProvenance } from '../routing/routing.interface';

export type OSINTCategory =
  | 'seismic'
  | 'thermal'
  | 'weather-alert'
  | 'road-hazard'
  | 'wildlife';

export interface OSINTEvent {
  id: string;
  category: OSINTCategory;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  coordinates: Coordinates; // [lon, lat]
  magnitude?: number;
  radiusKm?: number;
  confidence?: number;
  provenance: DataProvenance;
}

export interface IOSINTProvider {
  getEvents(bbox?: [number, number, number, number]): Promise<OSINTEvent[]>;
}
