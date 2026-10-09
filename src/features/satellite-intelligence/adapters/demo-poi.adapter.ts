import { IPOIAdapter, IPOISearchParams } from './poi-adapter.interface';
import { RoutePOI } from '../types/poi.types';
import { PRESET_ROUTE_POIS } from '../data/preset-pois';
import { DEFAULT_CORRIDOR_KEY } from '../data/preset-corridors';

export class DemoPOIAdapter implements IPOIAdapter {
  async getRoutePOIs(params: IPOISearchParams = {}): Promise<RoutePOI[]> {
    const corridorKey = params.corridorKey || DEFAULT_CORRIDOR_KEY;
    const allPois = PRESET_ROUTE_POIS[corridorKey] || PRESET_ROUTE_POIS[DEFAULT_CORRIDOR_KEY] || [];

    if (!params.category) {
      return allPois;
    }

    return allPois.filter((poi) => poi.category === params.category);
  }

  getRoutePOIsSync(params: IPOISearchParams = {}): RoutePOI[] {
    const corridorKey = params.corridorKey || DEFAULT_CORRIDOR_KEY;
    const allPois = PRESET_ROUTE_POIS[corridorKey] || PRESET_ROUTE_POIS[DEFAULT_CORRIDOR_KEY] || [];

    if (!params.category) {
      return allPois;
    }

    return allPois.filter((poi) => poi.category === params.category);
  }
}

export const demoPOIAdapter = new DemoPOIAdapter();
