import {
  IRoutingProvider,
  NormalizedRoute,
  RouteRequestParams,
} from './routing.interface';
import { normalizeOSRMResponse } from '../normalization/route-normalizer';
import { fallbackRouteAdapter } from './fallback-route';
import { globalMemoryCache } from '../cache/memory-cache';
import { providerLimiters } from '../rate-limit/token-bucket';

export class OSRMRouteAdapter implements IRoutingProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl = 'https://router.project-osrm.org',
    timeoutMs = 8000
  ) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async calculateRoute(params: RouteRequestParams): Promise<NormalizedRoute> {
    const cacheKey = `route:osrm:${params.origin[0]},${params.origin[1]}:${params.destination[0]},${params.destination[1]}:${params.alternatives}`;

    return globalMemoryCache.fetchOrDedupe<NormalizedRoute>(
      cacheKey,
      3600 * 1000, // 1 hour TTL
      async () => {
        // Enforce rate limiter
        const allowed = await providerLimiters.osrm.acquire(1, 2000);
        if (!allowed) {
          console.warn('[OSRMRouteAdapter] Rate limit exceeded, falling back to curated route');
          return fallbackRouteAdapter.calculateRoute(params);
        }

        const url = `${this.baseUrl}/route/v1/driving/${params.origin[0]},${params.origin[1]};${params.destination[0]},${params.destination[1]}?overview=full&geometries=geojson&steps=true&alternatives=${params.alternatives ? 'true' : 'false'}`;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'MotoCompanion-Navigation-Platform/1.0',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            console.warn(`[OSRMRouteAdapter] HTTP ${response.status} from OSRM, using fallback route`);
            return fallbackRouteAdapter.calculateRoute(params);
          }

          const json = await response.json();
          const normalized = normalizeOSRMResponse(json, params, 'recent');

          if (!normalized) {
            console.warn('[OSRMRouteAdapter] Invalid route response structure, using fallback route');
            return fallbackRouteAdapter.calculateRoute(params);
          }

          return normalized;
        } catch (error) {
          console.warn('[OSRMRouteAdapter] Fetch failed or timed out:', error instanceof Error ? error.message : error);
          return fallbackRouteAdapter.calculateRoute(params);
        }
      }
    );
  }
}

export const osrmRouteAdapter = new OSRMRouteAdapter();
