import { Hazard } from '../types/hazard.types';
import { RouteSegment } from '../types/route-intelligence.types';
import {
  RouteSafetyScore,
  SafetyBreakdown,
  SafetyDeduction,
  SafetyTier,
} from '../types/safety-score.types';

export interface WeatherConditionSummary {
  rainProbabilityPercent?: number;
  windSpeedKmh?: number;
  visibilityKm?: number;
  temperatureC?: number;
  weatherDescription?: string;
}

export interface ScoringInput {
  segments: RouteSegment[];
  hazards: Hazard[];
  totalElevationGainM: number;
  sharpTurnsCount?: number;
  weather?: WeatherConditionSummary;
  riderSkillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Pure calculation engine applying transparent, explainable deduction rules.
 *
 * Scoring Formula:
 * Route Safety Score = 100 - sum(Deductions) [Clamped: 10 - 100]
 */
export function calculateRouteSafetyScore(input: ScoringInput): RouteSafetyScore {
  const deductions: SafetyDeduction[] = [];
  const skillMultiplier = input.riderSkillLevel === 'beginner' ? 1.25 : input.riderSkillLevel === 'advanced' ? 0.85 : 1.0;

  // 1. Road Condition Deductions (Max 25 pts)
  let roadDeduction = 0;
  const patchySegments = input.segments.filter((s) => s.surfaceType === 'tarmac-patchy');
  const brokenSegments = input.segments.filter((s) => s.surfaceType === 'gravel-broken');

  if (brokenSegments.length > 0) {
    const pts = Math.min(15, Math.round(10 * brokenSegments.length * skillMultiplier));
    roadDeduction += pts;
    deductions.push({
      category: 'road',
      factor: 'Unpaved / Broken Gravel Segments',
      pointsDeducted: pts,
      explanation: `${brokenSegments.length} segment(s) feature loose gravel or unfinished roadbed, increasing tyre slip risk.`,
    });
  }

  if (patchySegments.length > 0) {
    const pts = Math.min(10, Math.round(5 * patchySegments.length));
    roadDeduction += pts;
    deductions.push({
      category: 'road',
      factor: 'Patchwork & Irregular Asphalt',
      pointsDeducted: pts,
      explanation: `${patchySegments.length} sector(s) contain recurring asphalt patchwork and seam irregularities.`,
    });
  }
  const finalRoadDeduction = Math.min(25, roadDeduction);
  const roadConditionScore = Math.max(0, 100 - Math.round((finalRoadDeduction / 25) * 100));

  // 2. Hazard Exposure Deductions (Max 30 pts)
  let hazardDeduction = 0;
  for (const hazard of input.hazards) {
    let pts = 0;
    if (hazard.severity === 'critical') pts = 15;
    else if (hazard.severity === 'high') pts = 8;
    else if (hazard.severity === 'medium') pts = 4;
    else pts = 1;

    pts = Math.round(pts * skillMultiplier);
    hazardDeduction += pts;

    deductions.push({
      category: 'hazard',
      factor: `${hazard.title} (${hazard.severity.toUpperCase()})`,
      pointsDeducted: pts,
      explanation: `Reported at km ${hazard.corridorDistanceKm}: ${hazard.description} Recommendation: ${hazard.recommendedAction}`,
    });
  }
  const finalHazardDeduction = Math.min(30, hazardDeduction);
  const hazardExposureScore = Math.max(0, 100 - Math.round((finalHazardDeduction / 30) * 100));

  // 3. Terrain & Topography Deductions (Max 20 pts)
  let terrainDeduction = 0;
  const ghatSegments = input.segments.filter((s) => s.surfaceType === 'ghat-pass');
  if (ghatSegments.length > 0 || input.totalElevationGainM > 1000) {
    const pts = input.totalElevationGainM > 2000 ? 14 : input.totalElevationGainM > 1000 ? 8 : 4;
    terrainDeduction += pts;
    deductions.push({
      category: 'terrain',
      factor: 'High Elevation & Mountain Pass',
      pointsDeducted: pts,
      explanation: `Corridor ascends +${input.totalElevationGainM}m elevation. Demands sustained low-gear engine braking and brake thermal management.`,
    });
  }

  if (input.sharpTurnsCount && input.sharpTurnsCount > 8) {
    const pts = Math.min(6, Math.round((input.sharpTurnsCount / 4) * skillMultiplier));
    terrainDeduction += pts;
    deductions.push({
      category: 'terrain',
      factor: 'Hairpin Turn Density',
      pointsDeducted: pts,
      explanation: `${input.sharpTurnsCount} tight hairpin turns detected along mountain passes requiring deliberate corner entry speeds.`,
    });
  }
  const finalTerrainDeduction = Math.min(20, terrainDeduction);
  const terrainScore = Math.max(0, 100 - Math.round((finalTerrainDeduction / 20) * 100));

  // 4. Weather & Environmental Deductions (Max 15 pts)
  let weatherDeduction = 0;
  if (input.weather) {
    if (input.weather.rainProbabilityPercent && input.weather.rainProbabilityPercent > 40) {
      const pts = input.weather.rainProbabilityPercent > 70 ? 9 : 5;
      weatherDeduction += pts;
      deductions.push({
        category: 'weather',
        factor: 'High Rain Probability',
        pointsDeducted: pts,
        explanation: `${input.weather.rainProbabilityPercent}% precipitation chance forecasted along route. Wet asphalt increases stopping distances by ~40%.`,
      });
    }

    if (input.weather.visibilityKm !== undefined && input.weather.visibilityKm < 3.0) {
      const pts = input.weather.visibilityKm < 1.0 ? 6 : 3;
      weatherDeduction += pts;
      deductions.push({
        category: 'weather',
        factor: 'Reduced Visibility / Mountain Fog',
        pointsDeducted: pts,
        explanation: `Visibility restricted to ~${input.weather.visibilityKm} km. Headlight dipped-beam and hazard beacons recommended.`,
      });
    }

    if (input.weather.windSpeedKmh && input.weather.windSpeedKmh > 35) {
      const pts = 4;
      weatherDeduction += pts;
      deductions.push({
        category: 'weather',
        factor: 'Strong Crosswinds',
        pointsDeducted: pts,
        explanation: `Sustained winds of ${input.weather.windSpeedKmh} km/h recorded. Exercise caution on elevated viaducts and exposed ridgelines.`,
      });
    }
  }
  const finalWeatherDeduction = Math.min(15, weatherDeduction);
  const weatherScore = Math.max(0, 100 - Math.round((finalWeatherDeduction / 15) * 100));

  // 5. Complexity & Night/Highway Deductions (Max 10 pts)
  let complexityDeduction = 0;
  const speedBreakerHazards = input.hazards.filter((h) => h.category === 'road-damage' || h.title.toLowerCase().includes('speed breaker'));
  if (speedBreakerHazards.length >= 2) {
    const pts = 4;
    complexityDeduction += pts;
    deductions.push({
      category: 'complexity',
      factor: 'Frequent Traffic Calming & Unmarked Humps',
      pointsDeducted: pts,
      explanation: 'Multiple unmarked speed humps across highway bypasses demand high vigilance.',
    });
  }
  const finalComplexityDeduction = Math.min(10, complexityDeduction);
  const complexityScore = Math.max(0, 100 - Math.round((finalComplexityDeduction / 10) * 100));

  // Calculate Overall Score
  const totalDeductions =
    finalRoadDeduction +
    finalHazardDeduction +
    finalTerrainDeduction +
    finalWeatherDeduction +
    finalComplexityDeduction;

  const rawOverall = 100 - totalDeductions;
  const overallScore = Math.max(10, Math.min(100, rawOverall));

  // Assign Safety Tier
  let safetyTier: SafetyTier = 'optimal';
  if (overallScore < 50) safetyTier = 'hazardous';
  else if (overallScore < 70) safetyTier = 'high-risk';
  else if (overallScore < 85) safetyTier = 'moderate-risk';
  else safetyTier = 'optimal';

  // Generate Human Advisory
  let summaryAdvisory = '';
  if (safetyTier === 'optimal') {
    summaryAdvisory = 'Optimal riding corridor with clear surface, favorable weather, and manageable road geometry.';
  } else if (safetyTier === 'moderate-risk') {
    summaryAdvisory = 'Moderate risk corridor. Exercise vigilance through winding ghat sections and maintain safe following distances.';
  } else if (safetyTier === 'high-risk') {
    summaryAdvisory = 'High risk advisory. Severe road surface flaws, rain, or mountain hazards present. Moderate pace strongly advised.';
  } else {
    summaryAdvisory = 'Hazardous corridor condition. Major route obstructions or extreme terrain warnings active. Consider alternate bypass.';
  }

  const breakdown: SafetyBreakdown = {
    roadConditionScore,
    hazardExposureScore,
    terrainScore,
    weatherScore,
    complexityScore,
    deductions,
  };

  return {
    overallScore,
    safetyTier,
    breakdown,
    summaryAdvisory,
    confidence: 0.92,
  };
}
