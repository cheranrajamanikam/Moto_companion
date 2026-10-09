import { RouteIntelligence } from '../types/route-intelligence.types';
import { Hazard } from '../types/hazard.types';
import { RouteWeatherSummary } from '../services/map-api.service';
import {
  RouteContext,
  RouteDifficulty,
  RoadSurfaceQuality,
} from '../../rider-ai/types/route';
import {
  HazardContext,
  HazardCategory as RiderAIHazardCategory,
  HazardSeverity as RiderAIHazardSeverity,
} from '../../rider-ai/types/hazard';
import { WeatherContext } from '../../rider-ai/types/weather';

/**
 * Converts a Satellite RouteIntelligence object into Rider AI's RouteContext.
 * Zero-side-effect bridge: allows Rider AI to consume satellite corridor intelligence seamlessly.
 */
export function toRiderAIRouteContext(intelligence: RouteIntelligence): RouteContext {
  let difficulty: RouteDifficulty = 'moderate';
  if (intelligence.totalElevationGainM > 2000 || intelligence.safetyScore.overallScore < 60) {
    difficulty = 'hard';
  } else if (intelligence.totalElevationGainM < 600 && intelligence.safetyScore.overallScore > 85) {
    difficulty = 'easy';
  }

  let roadCondition: RoadSurfaceQuality = 'smooth';
  if (intelligence.safetyScore.breakdown.roadConditionScore < 60) {
    roadCondition = 'rough';
  } else if (intelligence.safetyScore.breakdown.roadConditionScore < 80) {
    roadCondition = 'patchy';
  }

  const ghatPasses = intelligence.segments
    .filter((s) => s.surfaceType === 'ghat-pass')
    .map((s) => `${s.originName}-${s.destinationName} Pass`);

  return {
    id: intelligence.routeId,
    name: intelligence.routeName,
    origin: intelligence.origin,
    destination: intelligence.destination,
    distanceKm: Math.round(intelligence.totalDistanceKm),
    durationMinutes: intelligence.totalDurationMinutes,
    difficulty,
    elevationGainM: intelligence.totalElevationGainM,
    safetyScore: intelligence.safetyScore.overallScore,
    safetyTier: intelligence.safetyScore.safetyTier,
    sharpTurns: intelligence.segments.some((s) => s.surfaceType === 'ghat-pass') ? 14 : 4,
    roadCondition,
    roadConditionDescription: intelligence.safetyScore.summaryAdvisory,
    ghatPasses: ghatPasses.length > 0 ? ghatPasses : undefined,
    recommendedDepartureWindow: '05:30 AM - 06:30 AM (cooler asphalt, optimal visibility)',
    deductions: intelligence.safetyScore.breakdown.deductions?.map((d) => ({
      category: d.category,
      factor: d.factor,
      pointsDeducted: d.pointsDeducted,
      explanation: d.explanation,
    })),
  };
}

/**
 * Converts Open-Meteo RouteWeatherSummary into Rider AI WeatherContext.
 */
export function toRiderAIWeatherContext(summary?: RouteWeatherSummary | null): WeatherContext {
  if (!summary || !summary.checkpoints || summary.checkpoints.length === 0) {
    return {
      isAvailable: false,
    };
  }

  const primaryPt = summary.checkpoints[0];
  const maxRain = summary.maxRainProbability ?? primaryPt.rainProbabilityPercent;

  return {
    isAvailable: true,
    condition: summary.overallCondition || primaryPt.weatherDescription,
    temperatureC: primaryPt.temperatureC,
    feelsLikeC: primaryPt.temperatureC,
    rainProbability: maxRain,
    windSpeedKmh: primaryPt.windSpeedKmh,
    visibilityKm: primaryPt.visibilityKm,
    radarAlert: summary.advisory,
    optimalRidingWindow:
      maxRain > 40
        ? 'Early morning departure recommended to minimize wet road adhesion risks.'
        : 'Optimal dry touring conditions across highway plains.',
  };
}

/**
 * Maps Satellite Intelligence hazard category to Rider AI's HazardCategory enum.
 */
function mapHazardCategory(cat: string): RiderAIHazardCategory {
  switch (cat) {
    case 'road-damage':
      return 'pothole-cluster';
    case 'flood-waterlogging':
      return 'water-logging';
    case 'landslide-rockfall':
      return 'landslide-debris';
    case 'weather-hazard':
      return 'fog-low-visibility';
    case 'terrain-route-complexity':
      return 'gravel-patch';
    default:
      return 'speed-breaker';
  }
}

/**
 * Converts Satellite Intelligence hazards to Rider AI HazardContext list.
 */
export function toRiderAIHazards(hazards: Hazard[]): HazardContext[] {
  return hazards.map((h) => {
    let severity: RiderAIHazardSeverity = 'medium';
    if (h.severity === 'critical' || h.severity === 'high') {
      severity = 'high';
    } else if (h.severity === 'low') {
      severity = 'low';
    }

    return {
      id: h.id,
      type: h.title,
      category: mapHazardCategory(h.category),
      severity,
      distanceKm: h.corridorDistanceKm,
      longitude: h.coordinates[0],
      latitude: h.coordinates[1],
      locationName: h.locationName,
      description: h.description,
      recommendation: h.recommendedAction,
      verifiedCount: h.verificationCount,
      reportedAgo: 'Satellite OSINT Radar Telemetry',
    };
  });
}
