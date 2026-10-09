import { RiderContext } from './rider';
import { BikeContext } from './bike';
import { RouteContext } from './route';
import { RideContext } from './ride';
import { HazardContext } from './hazard';
import { WeatherContext } from './weather';
import { LocationContext } from './location';

export type DataFreshness = 'demo' | 'live' | 'cached' | 'unavailable';

/**
 * Unified context delivered to the AI companion engine.
 * Houses rider profile, motorcycle specs, active route, hazards, weather, and GPS state.
 */
export interface RiderAIContext {
  rider?: RiderContext;
  bike?: BikeContext;
  route?: RouteContext;
  ride?: RideContext;
  hazards?: HazardContext[];
  weather?: WeatherContext;
  location?: LocationContext;
  dataFreshness: DataFreshness;
  isDemoData: boolean;
  generatedTimestamp: number;
}
