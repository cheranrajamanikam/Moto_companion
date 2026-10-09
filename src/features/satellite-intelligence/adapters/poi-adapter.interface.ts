import { RoutePOI, POICategory } from '../types/poi.types';

export interface IPOISearchParams {
  category?: POICategory;
  corridorKey?: string;
  maxDetourKm?: number;
}

export interface IPOIAdapter {
  getRoutePOIs(params?: IPOISearchParams): Promise<RoutePOI[]>;
}
