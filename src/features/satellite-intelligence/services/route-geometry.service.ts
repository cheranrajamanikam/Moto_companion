import { MapBounds } from '../types/map.types';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two [longitude, latitude] coordinates in kilometers.
 */
export function computeHaversineDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates the bounding box for a series of [lon, lat] coordinates.
 */
export function computeRouteBounds(coordinates: [number, number][]): MapBounds {
  if (!coordinates || coordinates.length === 0) {
    return { minLon: 0, minLat: 0, maxLon: 0, maxLat: 0 };
  }

  let minLon = coordinates[0][0];
  let maxLon = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  for (const [lon, lat] of coordinates) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLon, minLat, maxLon, maxLat };
}

/**
 * Computes geographic midpoint for centering the map viewport.
 */
export function computeRouteCenter(coordinates: [number, number][]): [number, number] {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0];
  }

  const bounds = computeRouteBounds(coordinates);
  return [(bounds.minLon + bounds.maxLon) / 2, (bounds.minLat + bounds.maxLat) / 2];
}

/**
 * Computes total path length in kilometers along an array of coordinates.
 */
export function computeTotalDistanceKm(coordinates: [number, number][]): number {
  if (!coordinates || coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += computeHaversineDistanceKm(coordinates[i], coordinates[i + 1]);
  }
  return Math.round(total * 10) / 10;
}

/**
 * Checks if a given point lies within a distance threshold of a polyline.
 */
export function isCoordinateNearCorridor(
  point: [number, number],
  polyline: [number, number][],
  thresholdKm: number = 3.0
): boolean {
  if (!polyline || polyline.length === 0) return false;
  for (const vertex of polyline) {
    if (computeHaversineDistanceKm(point, vertex) <= thresholdKm) {
      return true;
    }
  }
  return false;
}

/**
 * Computes minimum distance from a coordinate to a polyline in kilometers.
 */
export function computeMinDistanceToPolylineKm(
  point: [number, number],
  polyline: [number, number][]
): number {
  if (!polyline || polyline.length === 0) return 0;
  let minDist = Infinity;
  for (const vertex of polyline) {
    const d = computeHaversineDistanceKm(point, vertex);
    if (d < minDist) minDist = d;
  }
  return Math.round(minDist * 10) / 10;
}

export interface RouteProgressResult {
  closestIndex: number;
  completedCoordinates: [number, number][];
  remainingCoordinates: [number, number][];
  remainingDistanceKm: number;
  progressPercent: number;
  distanceFromRouteKm: number;
}

/**
 * Calculates current rider progress along a route polyline given a GPS location.
 * Splits polyline into completed and remaining segments.
 */
export function computeRouteProgress(
  userLocation: [number, number],
  polyline: [number, number][]
): RouteProgressResult | null {
  if (!polyline || polyline.length < 2 || !userLocation) return null;

  let closestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < polyline.length; i++) {
    const dist = computeHaversineDistanceKm(userLocation, polyline[i]);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  // If rider is more than 5km away from the corridor, do not infer progress along the route
  if (minDistance > 5.0) {
    return null;
  }

  const completed = polyline.slice(0, closestIndex + 1);
  const remaining = polyline.slice(closestIndex);

  let remainingDist = 0;
  for (let i = 0; i < remaining.length - 1; i++) {
    remainingDist += computeHaversineDistanceKm(remaining[i], remaining[i + 1]);
  }

  const totalDist = computeTotalDistanceKm(polyline);
  const completedDist = Math.max(0, totalDist - remainingDist);
  const progressPercent = totalDist > 0 ? Math.min(100, Math.round((completedDist / totalDist) * 100)) : 0;

  return {
    closestIndex,
    completedCoordinates: completed,
    remainingCoordinates: remaining,
    remainingDistanceKm: Math.round(remainingDist * 10) / 10,
    progressPercent,
    distanceFromRouteKm: Math.round(minDistance * 10) / 10,
  };
}

export interface ProjectedRouteStation {
  projectedPoint: [number, number];
  distanceFromRouteKm: number;
  routeDistanceKm: number;
  segmentIndex: number;
}

/**
 * Projects an arbitrary coordinate onto the nearest segment of a route polyline.
 * Returns the exact road-surface coordinate, perpendicular distance in km,
 * and cumulative route distance from origin.
 */
export function projectOntoRoute(
  point: [number, number],
  polyline: [number, number][]
): ProjectedRouteStation {
  if (!polyline || polyline.length === 0) {
    return {
      projectedPoint: point,
      distanceFromRouteKm: 0,
      routeDistanceKm: 0,
      segmentIndex: 0,
    };
  }
  if (polyline.length === 1) {
    return {
      projectedPoint: polyline[0],
      distanceFromRouteKm: computeHaversineDistanceKm(point, polyline[0]),
      routeDistanceKm: 0,
      segmentIndex: 0,
    };
  }

  let minDistanceKm = Infinity;
  let bestProjected: [number, number] = polyline[0];
  let bestSegmentIndex = 0;
  let bestSegmentFraction = 0;

  // Precompute segment lengths for cumulative distance calculation
  const segDistances: number[] = [];
  for (let i = 0; i < polyline.length - 1; i++) {
    segDistances.push(computeHaversineDistanceKm(polyline[i], polyline[i + 1]));
  }

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];

    const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
    const cosMidLat = Math.cos(midLat);

    const dx = (b[0] - a[0]) * cosMidLat;
    const dy = b[1] - a[1];
    const segLenSq = dx * dx + dy * dy;

    let t = 0;
    if (segLenSq > 1e-12) {
      const px = (point[0] - a[0]) * cosMidLat;
      const py = point[1] - a[1];
      t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
    }

    const projLon = a[0] + t * (b[0] - a[0]);
    const projLat = a[1] + t * (b[1] - a[1]);
    const projCoord: [number, number] = [projLon, projLat];

    const distKm = computeHaversineDistanceKm(point, projCoord);
    if (distKm < minDistanceKm) {
      minDistanceKm = distKm;
      bestProjected = projCoord;
      bestSegmentIndex = i;
      bestSegmentFraction = t;
    }
  }

  // Calculate cumulative driving distance along route polyline up to projected point
  let cumulativeKm = 0;
  for (let i = 0; i < bestSegmentIndex; i++) {
    cumulativeKm += segDistances[i];
  }
  cumulativeKm += bestSegmentFraction * segDistances[bestSegmentIndex];

  return {
    projectedPoint: bestProjected,
    distanceFromRouteKm: Math.round(minDistanceKm * 100) / 100,
    routeDistanceKm: Math.round(cumulativeKm * 10) / 10,
    segmentIndex: bestSegmentIndex,
  };
}

/**
 * Traverses a route polyline to find the exact coordinate at a specified distance from origin.
 */
export function interpolatePointAlongRoute(
  distanceKm: number,
  polyline: [number, number][]
): [number, number] {
  if (!polyline || polyline.length === 0) return [0, 0];
  if (polyline.length === 1 || distanceKm <= 0) return polyline[0];

  let cumulative = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const segDist = computeHaversineDistanceKm(polyline[i], polyline[i + 1]);
    if (cumulative + segDist >= distanceKm) {
      const remaining = distanceKm - cumulative;
      const fraction = segDist > 0 ? Math.max(0, Math.min(1, remaining / segDist)) : 0;
      return [
        polyline[i][0] + fraction * (polyline[i + 1][0] - polyline[i][0]),
        polyline[i][1] + fraction * (polyline[i + 1][1] - polyline[i][1]),
      ];
    }
    cumulative += segDist;
  }

  return polyline[polyline.length - 1];
}

/**
 * Computes a small roadside offset perpendicular to the route heading so POIs appear
 * cleanly alongside the road corridor rather than on the center divider or off in the countryside.
 */
export function offsetCoordinateLaterally(
  point: [number, number],
  polyline: [number, number][],
  offsetMeters: number = 35
): [number, number] {
  if (!polyline || polyline.length < 2) return point;

  const station = projectOntoRoute(point, polyline);
  const segIdx = station.segmentIndex;
  const a = polyline[segIdx];
  const b = polyline[segIdx + 1] || polyline[segIdx];

  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(midLat);

  const dx = (b[0] - a[0]) * cosLat;
  const dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len < 1e-8) return station.projectedPoint;

  // Normal vector pointing to the right side of route progression
  const nx = dy / len;
  const ny = -dx / len;

  // 1 degree latitude ~ 111,320 meters
  const deltaLat = (offsetMeters / 111320) * ny;
  const deltaLon = (offsetMeters / (111320 * (cosLat || 1))) * nx;

  return [
    station.projectedPoint[0] + deltaLon,
    station.projectedPoint[1] + deltaLat,
  ];
}

/**
 * Validates whether a polyline represents genuine road-following geometry
 * (distinguishes dense road-following OSRM polylines from sparse/straight demo outlines).
 */
export function isValidRoadGeometry(coordinates: [number, number][] | undefined | null): boolean {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 20) {
    return false;
  }

  // Calculate total length and average segment length
  let totalKm = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalKm += computeHaversineDistanceKm(coordinates[i], coordinates[i + 1]);
  }

  const avgSegKm = totalKm / (coordinates.length - 1);
  // Real road polylines have dense vertices (average segment < 3.5 km)
  return avgSegKm < 3.5;
}

export interface DynamicWeatherCheckpoint {
  name: string;
  coordinates: [number, number];
  distanceKm: number;
}

/**
 * Samples 3-5 equidistant checkpoint stations along an active route polyline
 * for multi-coordinate Open-Meteo weather forecasting without spamming Nominatim.
 */
export function sampleRouteCheckpoints(
  polyline: [number, number][],
  originName: string = 'Origin',
  destinationName: string = 'Destination',
  targetCount: number = 4
): DynamicWeatherCheckpoint[] {
  if (!polyline || polyline.length === 0) return [];

  let totalDistKm = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    totalDistKm += computeHaversineDistanceKm(polyline[i], polyline[i + 1]);
  }

  // Curated corridor optimization: if the route is Bangalore-Chikmagalur (~247 km), preserve landmark names
  const isBlrCkm =
    polyline.length > 100 &&
    Math.abs(polyline[0][0] - 77.498) < 0.15 &&
    Math.abs(polyline[polyline.length - 1][0] - 75.772) < 0.15;

  if (isBlrCkm) {
    return [
      { name: 'Nelamangala Plains', coordinates: polyline[0], distanceKm: 0 },
      {
        name: 'Kunigal Midpoint',
        coordinates: interpolatePointAlongRoute(totalDistKm * 0.28, polyline),
        distanceKm: Math.round(totalDistKm * 0.28),
      },
      {
        name: 'Hassan Plateau',
        coordinates: interpolatePointAlongRoute(totalDistKm * 0.72, polyline),
        distanceKm: Math.round(totalDistKm * 0.72),
      },
      {
        name: 'Mudigere Ghat Summit',
        coordinates: polyline[polyline.length - 1],
        distanceKm: Math.round(totalDistKm),
      },
    ];
  }

  if (totalDistKm < 15 || polyline.length < 5) {
    // Short corridor: 2 points (Start and End)
    return [
      { name: `${originName} (Start)`, coordinates: polyline[0], distanceKm: 0 },
      {
        name: `${destinationName} (End)`,
        coordinates: polyline[polyline.length - 1],
        distanceKm: Math.round(totalDistKm),
      },
    ];
  }

  const count = Math.max(3, Math.min(5, targetCount));
  const checkpoints: DynamicWeatherCheckpoint[] = [];

  for (let i = 0; i < count; i++) {
    const fraction = i / (count - 1);
    const distKm = Math.round(totalDistKm * fraction * 10) / 10;
    const coords = interpolatePointAlongRoute(distKm, polyline);

    let label = '';
    if (i === 0) {
      label = `${originName} (Departure)`;
    } else if (i === count - 1) {
      label = `${destinationName} (Arrival)`;
    } else if (count === 3 || (count === 4 && i === 1)) {
      label = `Corridor Sector · Km ${Math.round(distKm)}`;
    } else if (count === 4 && i === 2) {
      label = `Midway Sector · Km ${Math.round(distKm)}`;
    } else {
      label = `Waystation ${i} · Km ${Math.round(distKm)}`;
    }

    checkpoints.push({
      name: label,
      coordinates: coords,
      distanceKm: distKm,
    });
  }

  return checkpoints;
}


