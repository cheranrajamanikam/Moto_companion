export type MotorcycleCategory =
  | 'adventure'
  | 'cruiser'
  | 'naked'
  | 'sport'
  | 'sport-touring'
  | 'classic'
  | 'scooter';

export type TerrainType = 'tarmac' | 'gravel' | 'broken-road' | 'offroad' | 'ghat-hairpin';

/**
 * Contextual information about the motorcycle.
 * In production, this will be populated from Member 1's garage/bike management system.
 */
export interface BikeContext {
  id?: string;
  brand?: string;
  model?: string;
  engineCc?: number;
  category?: MotorcycleCategory;
  fuelCapacityL?: number;
  estimatedRangeKm?: number;
  currentFuelPercent?: number;
  hasABS?: boolean;
  abs?: 'dual-channel' | 'single-channel' | 'none' | string;
  terrainSuitability?: TerrainType[];
  notes?: string;
}
