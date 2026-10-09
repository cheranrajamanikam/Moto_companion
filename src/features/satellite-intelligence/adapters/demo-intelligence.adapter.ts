import { RouteIntelligence } from '../types/route-intelligence.types';
import { PRESET_CORRIDORS, DEFAULT_CORRIDOR_KEY } from '../data/preset-corridors';
import { calculateRouteSafetyScore } from '../services/safety-scoring.service';

export interface CorridorOption {
  key: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
}

export class DemoIntelligenceAdapter {
  /**
   * Retrieves intelligence data for a pre-configured Indian motorcycle corridor.
   */
  async getRouteIntelligence(corridorKey: string = DEFAULT_CORRIDOR_KEY): Promise<RouteIntelligence> {
    // Deterministic instant resolution for offline/demo operation
    const corridor = PRESET_CORRIDORS[corridorKey] || PRESET_CORRIDORS[DEFAULT_CORRIDOR_KEY];

    // Recalculate dynamic safety score with scoring engine to ensure mathematical consistency
    const dynamicSafetyScore = calculateRouteSafetyScore({
      segments: corridor.segments,
      hazards: corridor.hazards,
      totalElevationGainM: corridor.totalElevationGainM,
      sharpTurnsCount: corridor.segments.some((s) => s.surfaceType === 'ghat-pass') ? 14 : 4,
      weather: {
        rainProbabilityPercent: 60,
        windSpeedKmh: 18,
        visibilityKm: 4.5,
      },
      riderSkillLevel: 'intermediate',
    });

    return {
      ...corridor,
      safetyScore: dynamicSafetyScore,
      metadata: {
        ...corridor.metadata,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Synchronous accessor for preset corridors (used during SSR and initial component mounting).
   */
  getRouteIntelligenceSync(corridorKey: string = DEFAULT_CORRIDOR_KEY): RouteIntelligence {
    const corridor = PRESET_CORRIDORS[corridorKey] || PRESET_CORRIDORS[DEFAULT_CORRIDOR_KEY];
    const dynamicSafetyScore = calculateRouteSafetyScore({
      segments: corridor.segments,
      hazards: corridor.hazards,
      totalElevationGainM: corridor.totalElevationGainM,
      sharpTurnsCount: corridor.segments.some((s) => s.surfaceType === 'ghat-pass') ? 14 : 4,
      weather: {
        rainProbabilityPercent: 60,
        windSpeedKmh: 18,
        visibilityKm: 4.5,
      },
      riderSkillLevel: 'intermediate',
    });

    return {
      ...corridor,
      safetyScore: dynamicSafetyScore,
      metadata: {
        ...corridor.metadata,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Returns list of all curated Indian motorcycle touring corridors.
   */
  getAvailableCorridors(): CorridorOption[] {
    return Object.entries(PRESET_CORRIDORS).map(([key, data]) => ({
      key,
      name: data.routeName,
      origin: data.origin,
      destination: data.destination,
      distanceKm: data.totalDistanceKm,
    }));
  }
}

export const demoIntelligenceAdapter = new DemoIntelligenceAdapter();
