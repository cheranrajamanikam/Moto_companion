import {
  RiderContext,
  BikeContext,
  RouteContext,
  RideContext,
  HazardContext,
  WeatherContext,
  LocationContext,
  RiderAIContext,
} from '../types';

/**
 * STRICT REQUIREMENT (Section 5 & 12):
 * Clearly label demo information as DEMO DATA.
 * This is the SINGLE SOURCE OF TRUTH for demo/mock context data.
 * Member 1 can swap this adapter with production API hooks without modifying the UI layer.
 */
export const DEMO_DATA_LABEL = 'DEMO DATA';

export const MOCK_RIDER: RiderContext = {
  id: 'rider-demo-001',
  name: 'Demo Rider',
  experienceLevel: 'intermediate',
  totalRidesLogged: 47,
  pacePreference: 'moderate',
  safetyPriority: 'balanced',
  preferences: {
    avoidNightRiding: true,
    avoidHeavyRain: false,
    maxContinuousRidingMinutes: 90,
    preferScenicRoutes: true,
  },
};

export const MOCK_BIKE: BikeContext = {
  id: 'bike-demo-himalayan-452',
  brand: 'Royal Enfield',
  model: 'Himalayan',
  engineCc: 452,
  category: 'adventure',
  fuelCapacityL: 17,
  estimatedRangeKm: 420,
  currentFuelPercent: 85,
  hasABS: true,
  abs: 'dual-channel',
  terrainSuitability: ['tarmac', 'gravel', 'ghat-hairpin', 'broken-road'],
  notes: 'Fitted with Dual-Channel ABS (switchable rear), dual-purpose CEAT Gripp-XL tyres, crash guards, and rear luggage rack.',
};

export const MOCK_ROUTE: RouteContext = {
  id: 'route-blr-ckm-001',
  name: 'Bangalore to Chikmagalur via Hassan & Belur',
  origin: 'Bangalore',
  destination: 'Chikmagalur',
  distanceKm: 247,
  durationMinutes: 320, // 5h 20m
  difficulty: 'moderate',
  elevationGainM: 1180,
  safetyScore: 82, // 82/100
  sharpTurns: 12,
  roadCondition: 'patchy',
  roadConditionDescription:
    'Smooth 4-lane highway (NH75) until Hassan; two-lane scenic winding asphalt with intermittent patchwork on Belur-Mudigere approach.',
  ghatPasses: ['Mudigere Ghat', 'Charmadi Foothills'],
  recommendedDepartureWindow: '05:30 AM - 06:15 AM (cool morning weather, minimal truck traffic)',
};

export const MOCK_RIDE: RideContext = {
  id: 'ride-session-001',
  title: 'Weekend Western Ghats Expedition',
  origin: 'Bangalore (Nelamangala Toll)',
  destination: 'Chikmagalur (Town Center)',
  totalDistanceKm: 247,
  estimatedDurationMinutes: 320,
  safetyScore: 82,
  status: 'scheduled',
  departureTime: '06:00 AM IST',
  waypoints: ['Kunigal Bypass', 'Channarayapatna', 'Hassan Junction', 'Belur Temple Road'],
  isDemoData: true,
};

export const MOCK_HAZARDS: HazardContext[] = [
  {
    id: 'hz-001',
    type: 'Unmarked Speed Breakers',
    category: 'speed-breaker',
    severity: 'high',
    distanceKm: 48,
    locationName: 'Kunigal Bypass (NH75)',
    description: 'Cluster of 3 sharp unpainted asphalt speed breakers after toll crossover.',
    recommendation: 'Drop speed to under 30 km/h; stand on pegs if fully loaded with luggage.',
    verifiedCount: 14,
    reportedAgo: '3 hours ago',
  },
  {
    id: 'hz-002',
    type: 'Wet Gravel on Hairpin #4',
    category: 'gravel-patch',
    severity: 'medium',
    distanceKm: 198,
    locationName: 'Mudigere Ghat Section',
    description: 'Loose road construction gravel scattered across descending right-hander apex.',
    recommendation: 'Maintain upright bike angle; complete all braking prior to turn entry.',
    verifiedCount: 9,
    reportedAgo: '45 minutes ago',
  },
  {
    id: 'hz-003',
    type: 'Dense Evening Fog Window',
    category: 'fog-low-visibility',
    severity: 'medium',
    distanceKm: 225,
    locationName: 'Kottigehara Pass Elevation',
    description: 'Sudden temperature drop causes dense mountain mist from 4:30 PM onwards.',
    recommendation: 'Switch on hazard lights or auxiliary yellow fog lamps; keep safe following gap.',
    verifiedCount: 22,
    reportedAgo: '1 hour ago',
  },
];

export const MOCK_WEATHER: WeatherContext = {
  isAvailable: true,
  condition: 'Partly Cloudy',
  temperatureC: 24,
  feelsLikeC: 25,
  rainProbability: 35,
  windSpeedKmh: 14,
  visibilityKm: 8.5,
  radarAlert: 'Scattered pre-monsoon shower band tracking south-west towards Hassan between 2 PM and 4 PM.',
  optimalRidingWindow: '06:00 AM - 12:30 PM for dry tarmac throughout the plains.',
};

export const MOCK_LOCATION: LocationContext = {
  isLiveGPS: false, // Strict honesty: Demo mode, not live hardware GPS
  latitude: 12.9716,
  longitude: 77.5946,
  currentRoad: 'NH75 (Nelamangala Gateway)',
  nearestTown: 'Bangalore Outskirts',
  headingDegrees: 285,
  altitudeM: 920,
  lastUpdatedTimestamp: Date.now(),
};

/**
 * Composite Mock Context adapter
 */
export function getMockRiderAIContext(): RiderAIContext {
  return {
    rider: MOCK_RIDER,
    bike: MOCK_BIKE,
    route: MOCK_ROUTE,
    ride: MOCK_RIDE,
    hazards: MOCK_HAZARDS,
    weather: MOCK_WEATHER,
    location: MOCK_LOCATION,
    dataFreshness: 'demo',
    isDemoData: true,
    generatedTimestamp: Date.now(),
  };
}
