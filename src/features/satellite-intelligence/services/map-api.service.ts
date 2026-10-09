import { PRESET_CORRIDORS } from '../data/preset-corridors';
import { PRESET_ROUTE_POIS } from '../data/preset-pois';
import { RoutePOI } from '../types/poi.types';
import { Hazard } from '../types/hazard.types';

export interface RouteApiResult {
  id: string;
  name: string;
  originName: string;
  destinationName: string;
  coordinates: [number, number][]; // [lon, lat]
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  advantage?: string;
  distanceDeltaKm?: number;
  safetyScoreDelta?: number;
  steps: Array<{
    instruction: string;
    distanceM: number;
    durationS: number;
    maneuver: string;
    bearing: number;
    location: [number, number];
    roadName?: string;
  }>;
  alternates?: RouteApiResult[];
  provenance: {
    source: string;
    sourceUrl?: string;
    timestamp: string;
    freshness: 'live/current' | 'recent' | 'cached' | 'demo';
    isDemoData: boolean;
  };
}

export interface RouteWeatherPoint {
  locationName: string;
  coordinates: [number, number]; // [lon, lat]
  temperatureC: number;
  rainProbabilityPercent: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeedKmh: number;
  visibilityKm: number;
  roadGripRisk: 'low' | 'moderate' | 'high';
}

export interface RouteWeatherSummary {
  checkpoints: RouteWeatherPoint[];
  maxRainProbability: number;
  overallCondition: string;
  advisory: string;
  provenance: {
    source: string;
    sourceUrl?: string;
    timestamp: string;
    freshness: 'live/current' | 'recent' | 'cached' | 'demo';
    isDemoData: boolean;
  };
}

export interface PlaceApiResult {
  id: string;
  name: string;
  displayName: string;
  category: string;
  type: string;
  coordinates: [number, number]; // [lon, lat]
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  locality?: string;
  importance?: number;
  boundingBox?: [number, number, number, number]; // [minLat, maxLat, minLon, maxLon]
  boundaryGeojson?: any; // Polygon or MultiPolygon GeoJSON geometry
  isAdministrativeBoundary?: boolean;
  provenance: {
    source: string;
    sourceUrl?: string;
    timestamp: string;
    freshness: 'live/current' | 'recent' | 'cached' | 'demo';
    isDemoData: boolean;
  };
}

class MapApiService {
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return '/api/map';
    }
    const host = (typeof process !== 'undefined' && process.env?.VITE_TEST_HOST) || 'http://localhost:3000';
    return `${host}/api/map`;
  }

  /**
   * Fetches road-following route from OSRM backend with automatic fallback to preset corridor geometry.
   */
  async getRoute(options: {
    origin?: [number, number];
    destination?: [number, number];
    originName?: string;
    destinationName?: string;
    corridorKey?: string;
    alternatives?: boolean;
  }): Promise<RouteApiResult> {
    const corridorKey = options.corridorKey || 'blr-ckm';
    const preset = PRESET_CORRIDORS[corridorKey] || PRESET_CORRIDORS['blr-ckm'];

    const origin = options.origin || preset.routePolyline[0];
    const destination = options.destination || preset.routePolyline[preset.routePolyline.length - 1];
    const originName = options.originName || preset.origin;
    const destinationName = options.destinationName || preset.destination;

    try {
      const query = new URLSearchParams({
        origin: `${origin[0]},${origin[1]}`,
        destination: `${destination[0]},${destination[1]}`,
        originName,
        destinationName,
        alternatives: options.alternatives ? 'true' : 'false',
      });

      const response = await fetch(`${this.getBaseUrl()}/route?${query.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.coordinates && data.coordinates.length > 0) {
          if (options.alternatives && (!data.alternates || data.alternates.length === 0) && preset.alternateRoute) {
            data.alternates = [
              {
                id: preset.alternateRoute.id,
                name: preset.alternateRoute.name,
                originName: preset.origin,
                destinationName: preset.destination,
                coordinates: preset.alternateRoute.coordinates,
                distanceKm: preset.alternateRoute.distanceKm,
                durationMinutes: preset.alternateRoute.durationMinutes,
                elevationGainM: 950,
                advantage: preset.alternateRoute.advantage,
                distanceDeltaKm: preset.alternateRoute.distanceDeltaKm,
                safetyScoreDelta: preset.alternateRoute.safetyScoreDelta,
                steps: [],
                provenance: {
                  source: 'MotoCompanion Curated Bypass Fixture',
                  timestamp: new Date().toISOString(),
                  freshness: 'demo',
                  isDemoData: true,
                },
              },
            ];
          }
          return data;
        }
      }
    } catch (err) {
      console.warn('[MapApiService] Backend route fetch failed, using fallback corridor:', err);
    }

    // Curated offline alternates if available in preset
    const alternates: RouteApiResult[] = preset.alternateRoute
      ? [
          {
            id: preset.alternateRoute.id,
            name: preset.alternateRoute.name,
            originName: preset.origin,
            destinationName: preset.destination,
            coordinates: preset.alternateRoute.coordinates,
            distanceKm: preset.alternateRoute.distanceKm,
            durationMinutes: preset.alternateRoute.durationMinutes,
            elevationGainM: 950,
            advantage: preset.alternateRoute.advantage,
            distanceDeltaKm: preset.alternateRoute.distanceDeltaKm,
            safetyScoreDelta: preset.alternateRoute.safetyScoreDelta,
            steps: [
              {
                instruction: `Depart ${preset.origin} via ${preset.alternateRoute.via}`,
                distanceM: 0,
                durationS: 0,
                maneuver: 'depart',
                bearing: 0,
                location: preset.alternateRoute.coordinates[0],
              },
              {
                instruction: `Arrive at ${preset.destination}`,
                distanceM: preset.alternateRoute.distanceKm * 1000,
                durationS: preset.alternateRoute.durationMinutes * 60,
                maneuver: 'arrive',
                bearing: 0,
                location: preset.alternateRoute.coordinates[preset.alternateRoute.coordinates.length - 1],
              },
            ],
            provenance: {
              source: 'MotoCompanion Curated Bypass Fixture',
              timestamp: new Date().toISOString(),
              freshness: 'demo',
              isDemoData: true,
            },
          },
        ]
      : [];

    // Graceful offline fallback
    return {
      id: `fallback-${corridorKey}`,
      name: preset.routeName,
      originName: preset.origin,
      destinationName: preset.destination,
      coordinates: preset.routePolyline,
      distanceKm: preset.totalDistanceKm,
      durationMinutes: preset.totalDurationMinutes,
      elevationGainM: preset.totalElevationGainM,
      alternates: alternates.length > 0 ? alternates : undefined,
      steps: [
        {
          instruction: `Depart ${preset.origin}`,
          distanceM: 0,
          durationS: 0,
          maneuver: 'depart',
          bearing: 0,
          location: origin,
        },
        {
          instruction: `Arrive at ${preset.destination}`,
          distanceM: preset.totalDistanceKm * 1000,
          durationS: preset.totalDurationMinutes * 60,
          maneuver: 'arrive',
          bearing: 0,
          location: destination,
        },
      ],
      provenance: {
        source: 'MotoCompanion Preset Corridor',
        timestamp: new Date().toISOString(),
        freshness: 'demo',
        isDemoData: true,
      },
    };
  }

  /**
   * Compliant place search (explicit user submit only, strictly no continuous autocomplete).
   */
  async searchPlaces(query: string, limit: number = 5): Promise<PlaceApiResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const params = new URLSearchParams({
        q: trimmed,
        limit: limit.toString(),
      });

      const response = await fetch(`${this.getBaseUrl()}/search?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[MapApiService] Backend search failed, using local place directory:', err);
    }

    // Offline directory fallback
    const offlinePlaces: PlaceApiResult[] = [
      {
        id: 'offline-nelamangala',
        name: 'Nelamangala Highway Toll',
        displayName: 'Nelamangala, Bengaluru Rural, Karnataka, India',
        category: 'place',
        type: 'town',
        coordinates: [77.4987, 13.0982],
        locality: 'Nelamangala',
        boundingBox: [13.072, 13.124, 77.362, 77.425],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
      {
        id: 'offline-kunigal',
        name: 'Kunigal Highway Bypass',
        displayName: 'Kunigal, Tumkur District, Karnataka, India',
        category: 'place',
        type: 'town',
        coordinates: [77.0256, 13.0244],
        locality: 'Kunigal',
        boundingBox: [13.002, 13.048, 77.012, 77.058],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
      {
        id: 'offline-hassan',
        name: 'Hassan Central Junction',
        displayName: 'Hassan, Hassan District, Karnataka, India',
        category: 'place',
        type: 'city',
        coordinates: [76.1011, 13.0072],
        locality: 'Hassan',
        boundingBox: [12.975, 13.042, 76.068, 76.145],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
      {
        id: 'offline-belur',
        name: 'Belur Temple Town',
        displayName: 'Belur, Hassan District, Karnataka, India',
        category: 'place',
        type: 'town',
        coordinates: [75.8606, 13.1623],
        locality: 'Belur',
        boundingBox: [13.142, 13.185, 75.838, 75.882],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
      {
        id: 'offline-mudigere',
        name: 'Mudigere Ghat Base',
        displayName: 'Mudigere, Chikkamagaluru District, Karnataka, India',
        category: 'place',
        type: 'town',
        coordinates: [75.6418, 13.1378],
        locality: 'Mudigere',
        boundingBox: [13.118, 13.158, 75.612, 75.665],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
      {
        id: 'offline-chikmagalur',
        name: 'Chikmagalur Hill Station',
        displayName: 'Chikmagalur, Chikkamagaluru District, Karnataka, India',
        category: 'place',
        type: 'city',
        coordinates: [75.7721, 13.3161],
        locality: 'Chikmagalur',
        boundingBox: [13.285, 13.352, 75.735, 75.815],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
      {
        id: 'offline-sakleshpur',
        name: 'Sakleshpur',
        displayName: 'Sakleshpur, Hassan District, Karnataka, India',
        category: 'place',
        type: 'town',
        coordinates: [75.7865, 12.9442],
        locality: 'Sakleshpur',
        boundingBox: [12.921, 12.968, 75.761, 75.812],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
      {
        id: 'offline-mysore',
        name: 'Mysore',
        displayName: 'Mysuru (Mysore), Karnataka, India',
        category: 'place',
        type: 'city',
        coordinates: [76.6548, 12.3051],
        locality: 'Mysuru',
        boundingBox: [12.261, 12.368, 76.598, 76.712],
        isAdministrativeBoundary: false,
        provenance: {
          source: 'MotoCompanion Offline Directory',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          isDemoData: true,
        },
      },
    ];

    return offlinePlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        p.displayName.toLowerCase().includes(trimmed.toLowerCase()) ||
        (p.locality && p.locality.toLowerCase().includes(trimmed.toLowerCase()))
    );
  }

  /**
   * Reverse geocodes coordinates to factual address and locality.
   */
  async reverseGeocode(lat: number, lng: number): Promise<PlaceApiResult | null> {
    try {
      const params = new URLSearchParams({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
      });

      const response = await fetch(`${this.getBaseUrl()}/reverse-geocode?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[MapApiService] Backend reverse-geocode failed, using coordinate estimation:', err);
    }

    // Factual fallback without inventing reviews or opening hours
    return {
      id: `coord-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: `Location at ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
      displayName: `Karnataka Corridor Vicinity (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
      category: 'coordinate',
      type: 'map-location',
      coordinates: [lng, lat],
      locality: 'Corridor Vicinity',
      provenance: {
        source: 'MotoCompanion Coordinate Inspector',
        timestamp: new Date().toISOString(),
        freshness: 'demo',
        isDemoData: true,
      },
    };
  }

  /**
   * Fetches POIs for the active corridor or geographic point.
   */
  async getPOIs(options?: {
    corridorKey?: string;
    category?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  }): Promise<RoutePOI[]> {
    try {
      const params = new URLSearchParams();
      if (options?.corridorKey) params.set('corridorKey', options.corridorKey);
      if (options?.category && options.category !== 'all') params.set('category', options.category);
      if (options?.lat !== undefined && options?.lng !== undefined) {
        params.set('lat', options.lat.toString());
        params.set('lng', options.lng.toString());
        params.set('radiusKm', (options.radiusKm || 20).toString());
      }

      const response = await fetch(`${this.getBaseUrl()}/pois?${params.toString()}`);
      if (response.ok) {
        const pois = await response.json();
        if (Array.isArray(pois) && pois.length > 0) {
          return pois;
        }
      }
    } catch (err) {
      console.warn('[MapApiService] Backend POI fetch failed, using curated preset:', err);
    }

    const corridorKey = options?.corridorKey || 'blr-ckm';
    const preset = PRESET_ROUTE_POIS[corridorKey] || PRESET_ROUTE_POIS['blr-ckm'] || [];
    if (options?.category && options.category !== 'all') {
      return preset.filter((p) => p.category === options.category);
    }
    return preset;
  }

  /**
   * Fetches weather checkpoints along the active corridor from Open-Meteo.
   */
  async getRouteWeather(options?: {
    corridorKey?: string;
    checkpoints?: Array<{ name: string; coordinates: [number, number] }>;
  }): Promise<RouteWeatherSummary> {
    try {
      const params = new URLSearchParams();
      if (options?.checkpoints && options.checkpoints.length > 0) {
        const pointsStr = options.checkpoints
          .map((p) => `${p.name}:${p.coordinates[0]},${p.coordinates[1]}`)
          .join(';');
        params.set('points', pointsStr);
      }

      const response = await fetch(`${this.getBaseUrl()}/weather?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.checkpoints && data.checkpoints.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('[MapApiService] Backend weather fetch failed, using fallback:', err);
    }

    // Curated offline weather fallback
    return {
      checkpoints: [
        {
          locationName: 'Nelamangala Plains',
          coordinates: [77.4987, 13.0982],
          temperatureC: 28,
          rainProbabilityPercent: 15,
          weatherCode: 1,
          weatherDescription: 'Partly Cloudy',
          windSpeedKmh: 12,
          visibilityKm: 10,
          roadGripRisk: 'low',
        },
        {
          locationName: 'Kunigal Midpoint',
          coordinates: [77.2401, 13.0245],
          temperatureC: 27,
          rainProbabilityPercent: 25,
          weatherCode: 2,
          weatherDescription: 'Scattered Clouds',
          windSpeedKmh: 14,
          visibilityKm: 10,
          roadGripRisk: 'low',
        },
        {
          locationName: 'Hassan Plateau',
          coordinates: [76.1023, 13.0068],
          temperatureC: 24,
          rainProbabilityPercent: 40,
          weatherCode: 3,
          weatherDescription: 'Overcast & Humid',
          windSpeedKmh: 18,
          visibilityKm: 8,
          roadGripRisk: 'moderate',
        },
        {
          locationName: 'Mudigere Ghat Summit',
          coordinates: [75.7765, 13.2189],
          temperatureC: 21,
          rainProbabilityPercent: 65,
          weatherCode: 61,
          weatherDescription: 'Passing Monsoon Showers',
          windSpeedKmh: 22,
          visibilityKm: 5,
          roadGripRisk: 'high',
        },
      ],
      maxRainProbability: 65,
      overallCondition: 'Passing showers in ghat sectors; dry on highway plains',
      advisory: 'Reduce lean angles on Mudigere Ghat curves due to wet asphalt.',
      provenance: {
        source: 'Open-Meteo Historical Fallback',
        sourceUrl: 'https://open-meteo.com',
        timestamp: new Date().toISOString(),
        freshness: 'demo',
        isDemoData: true,
      },
    };
  }

  /**
   * Fetches active OSINT hazard events (USGS earthquakes, NASA FIRMS thermal hotspots, road hazards).
   */
  async getOSINTHazards(options?: {
    bbox?: [number, number, number, number];
  }): Promise<Hazard[]> {
    try {
      const params = new URLSearchParams({ format: 'hazards' });
      if (options?.bbox) {
        params.set('bbox', options.bbox.join(','));
      }

      const response = await fetch(`${this.getBaseUrl()}/osint?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('[MapApiService] Backend OSINT fetch failed, using fallback:', err);
    }

    // Curated offline fallback hazards
    return [
      {
        id: 'hz-kunigal-humps',
        category: 'road-damage',
        title: 'Unmarked Speed Breaker Cluster',
        description: 'Three consecutive high-profile asphalt speed breakers at intersection entry.',
        severity: 'high',
        coordinates: [77.2401, 13.0245],
        corridorDistanceKm: 0.1,
        locationName: 'Kunigal Junction',
        recommendedAction: 'Reduce speed to 30 km/h and stand slightly on pegs.',
        verificationCount: 8,
        source: 'demo',
        sourceLabel: 'MotoCompanion Road Audits',
        timestamp: Date.now(),
        freshness: 'demo',
        confidence: 0.95,
        isDemoData: true,
      },
      {
        id: 'hz-mudigere-gravel',
        category: 'road-damage',
        title: 'Loose Gravel on Descending Hairpin',
        description: 'Aggregate spill on road shoulder following recent culvert maintenance.',
        severity: 'high',
        coordinates: [75.7765, 13.2189],
        corridorDistanceKm: 0.2,
        locationName: 'Mudigere Ghat Hairpin 4',
        recommendedAction: 'Maintain upright bike posture; avoid front brake application.',
        verificationCount: 12,
        source: 'demo',
        sourceLabel: 'Western Ghats Road Audits',
        timestamp: Date.now(),
        freshness: 'demo',
        confidence: 0.9,
        isDemoData: true,
      },
      {
        id: 'hz-ghat-rain-grip',
        category: 'weather-hazard',
        title: 'Intermittent Rain & Reduced Tyre Grip',
        description: 'Passing monsoon clouds reducing wet tarmac friction on ghat ascent.',
        severity: 'medium',
        coordinates: [75.7721, 13.3161],
        corridorDistanceKm: 0.3,
        locationName: 'Chikmagalur Foothills',
        recommendedAction: 'Smooth throttle roll-on; increase following distance.',
        verificationCount: 6,
        source: 'demo',
        sourceLabel: 'Environmental Observation',
        timestamp: Date.now(),
        freshness: 'demo',
        confidence: 0.85,
        isDemoData: true,
      },
    ];
  }
}

export const mapApiService = new MapApiService();
