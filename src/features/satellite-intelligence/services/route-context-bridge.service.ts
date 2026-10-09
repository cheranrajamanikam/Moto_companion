import { RiderAIContext } from '../../rider-ai/types/ai-context';
import { getMockRiderAIContext } from '../../rider-ai/adapters/mock-context.adapter';
import { RouteIntelligence } from '../types/route-intelligence.types';
import { Hazard } from '../types/hazard.types';
import { RouteWeatherSummary } from './map-api.service';
import {
  toRiderAIRouteContext,
  toRiderAIHazards,
  toRiderAIWeatherContext,
} from '../utils/rider-ai-bridge';

const STORAGE_KEY = 'motocompanion_active_route_context';

export type RouteContextListener = (context: RiderAIContext) => void;

class RouteContextBridgeService {
  private activeContext: RiderAIContext | null = null;
  private listeners: Set<RouteContextListener> = new Set();
  private hasCustomRoute = false;

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RiderAIContext;
        if (parsed && parsed.route && parsed.route.safetyScore !== undefined) {
          this.activeContext = parsed;
          this.hasCustomRoute = !parsed.isDemoData;
        }
      }
    } catch (e) {
      console.warn('[RouteContextBridgeService] Failed to hydrate stored route context:', e);
    }
  }

  /**
   * Returns current active Rider AI context.
   * If no custom route has been planned, returns verified demo context.
   */
  getActiveContext(): RiderAIContext {
    if (this.activeContext) {
      return this.activeContext;
    }
    return getMockRiderAIContext();
  }

  /**
   * Checks whether the current context is derived from a live/dynamic route.
   */
  hasActiveCustomRoute(): boolean {
    return this.hasCustomRoute;
  }

  /**
   * Authoritative publisher: updates active route context from Map / Route Intelligence.
   */
  updateActiveRoute(
    intel: RouteIntelligence,
    weather?: RouteWeatherSummary | null,
    hazards?: Hazard[]
  ): RiderAIContext {
    const baseDemo = getMockRiderAIContext();
    const routeCtx = toRiderAIRouteContext(intel);
    const hazardCtx = toRiderAIHazards(hazards || intel.hazards);
    const weatherCtx = toRiderAIWeatherContext(weather);

    // Explicit freshness & provenance determination
    let dataFreshness: RiderAIContext['dataFreshness'] = 'recent';
    const weatherFreshness = weather?.provenance?.freshness;

    if (weatherFreshness === 'live/current' || weatherFreshness === 'recent') {
      dataFreshness = 'live';
    } else if (weatherFreshness === 'cached') {
      dataFreshness = 'cached';
    } else if (weatherFreshness === 'demo') {
      dataFreshness = 'demo';
    } else {
      dataFreshness = 'recent';
    }

    const isDemo = false; // Active route is present and authoritative

    const updatedContext: RiderAIContext = {
      rider: baseDemo.rider,
      bike: baseDemo.bike,
      route: routeCtx,
      ride: {
        id: `ride-${intel.routeId}`,
        title: `${intel.routeName} Ride`,
        origin: intel.origin,
        destination: intel.destination,
        totalDistanceKm: Math.round(intel.totalDistanceKm),
        estimatedDurationMinutes: intel.totalDurationMinutes,
        safetyScore: intel.safetyScore.overallScore,
        status: 'in-progress',
        departureTime: 'Now',
        waypoints: intel.segments.map((s) => s.destinationName),
        isDemoData: isDemo,
      },
      hazards: hazardCtx,
      weather: weatherCtx,
      location: {
        isLiveGPS: false,
        latitude: intel.routePolyline[0] ? intel.routePolyline[0][1] : 12.9716,
        longitude: intel.routePolyline[0] ? intel.routePolyline[0][0] : 77.5946,
        currentRoad: intel.origin,
        nearestTown: intel.origin,
        headingDegrees: 0,
        altitudeM: intel.segments[0]?.elevationGainM || 900,
        lastUpdatedTimestamp: Date.now(),
      },
      dataFreshness,
      isDemoData: isDemo,
      generatedTimestamp: Date.now(),
    };

    this.activeContext = updatedContext;
    this.hasCustomRoute = !isDemo;

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContext));
      } catch (e) {
        console.warn('[RouteContextBridgeService] Could not persist route context to sessionStorage:', e);
      }
    }

    this.notifyListeners(updatedContext);
    return updatedContext;
  }

  /**
   * Resets active route context back to verified demo baseline.
   */
  clearActiveRoute(): void {
    this.activeContext = null;
    this.hasCustomRoute = false;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    const defaultContext = getMockRiderAIContext();
    this.notifyListeners(defaultContext);
  }

  /**
   * Subscribes a React component or listener to route context changes.
   */
  subscribe(listener: RouteContextListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(context: RiderAIContext): void {
    this.listeners.forEach((listener) => {
      try {
        listener(context);
      } catch (err) {
        console.error('[RouteContextBridgeService] Listener notification error:', err);
      }
    });
  }
}

export const routeContextBridgeService = new RouteContextBridgeService();
