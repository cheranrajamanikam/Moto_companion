import { PRESET_ROUTE_POIS } from '../../../src/features/satellite-intelligence/data/preset-pois';
import { IPOIProvider, POISearchParams, RoutePOI } from './poi.interface';

export class FallbackPOIAdapter implements IPOIProvider {
  async getPOIsInBBox(params: POISearchParams): Promise<RoutePOI[]> {
    const key = params.corridorKey || 'blr-ckm';
    const rawPois = PRESET_ROUTE_POIS[key] || PRESET_ROUTE_POIS['blr-ckm'] || [];

    const normalized: RoutePOI[] = rawPois.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      coordinates: p.coordinates,
      corridorDistanceKm: p.distanceFromOriginKm,
      detourDistanceKm: p.detourDistanceKm,
      distanceFromCenterlineKm: p.distanceFromRouteKm,
      fuelGrade: p.fuelGradeStatus,
      services: p.serviceType ? [p.serviceType] : undefined,
      address: p.address,
      locationName: p.address,
      provenance: {
        source: 'MotoCompanion Curated Fixtures',
        timestamp: new Date().toISOString(),
        freshness: 'demo',
        confidence: 0.95,
        isDemoData: true,
      },
    }));

    if (params.categories && params.categories.length > 0) {
      const allowed = new Set(params.categories);
      return normalized.filter((p) => allowed.has(p.category));
    }

    return normalized;
  }
}

export const fallbackPOIAdapter = new FallbackPOIAdapter();
