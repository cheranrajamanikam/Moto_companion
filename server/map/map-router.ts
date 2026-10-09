import type { IncomingMessage, ServerResponse } from 'http';
import { osrmRouteAdapter } from './routing/osrm-adapter';
import { nominatimSearchAdapter } from './search/nominatim-adapter';
import { overpassPOIAdapter } from './pois/overpass-adapter';
import { openMeteoWeatherAdapter } from './weather/open-meteo-adapter';
import { usgsEarthquakeAdapter } from './osint/usgs-adapter';
import { nasaFirmsAdapter } from './osint/nasa-firms-adapter';
import { normalizeOSINTToHazards } from './normalization/hazard-normalizer';
import { globalMemoryCache } from './cache/memory-cache';
import { POICategory } from './pois/poi.interface';
import { Coordinates } from './routing/routing.interface';

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const json = JSON.stringify(data);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(json));
  res.end(json);
}

function parseCoords(str?: string | null): Coordinates | null {
  if (!str) return null;
  const parts = str.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

function parseBBox(str?: string | null): [number, number, number, number] | null {
  if (!str) return null;
  const parts = str.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length >= 4 && parts.every((n) => !isNaN(n))) {
    return [parts[0], parts[1], parts[2], parts[3]];
  }
  return null;
}

export async function handleMapRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): Promise<void> {
  const rawUrl = req.url || '/';
  const parsed = new URL(rawUrl, 'http://localhost:3000');
  let pathname = parsed.pathname;
  if (pathname.startsWith('/api/map')) {
    pathname = pathname.replace('/api/map', '') || '/';
  }
  const searchParams = parsed.searchParams;

  // CORS headers for local developer testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    // 1. Health check & Diagnostics
    if (pathname === '/health' || pathname === '/api/map/health') {
      const stats = globalMemoryCache.getStats();
      const firmsStatus = nasaFirmsAdapter.getStatus();
      sendJson(res, 200, {
        status: 'online',
        service: 'MotoCompanion Map Intelligence Platform',
        version: '1.0.0',
        cache: stats,
        providers: {
          osrm: 'active',
          nominatim: 'active',
          overpass: 'active',
          openMeteo: 'active',
          usgs: 'active',
          nasaFirms: firmsStatus.isConfigured ? 'active' : 'disabled-unconfigured',
        },
      });
      return;
    }

    // 2. Road Routing: /api/map/route
    if (pathname === '/route' || pathname === '/api/map/route') {
      const origin = parseCoords(searchParams.get('origin')) || [77.4987, 13.0982]; // Default: Nelamangala
      const destination = parseCoords(searchParams.get('destination')) || [75.7721, 13.3161]; // Default: Chikmagalur
      const originName = searchParams.get('originName') || 'Bangalore (Nelamangala)';
      const destinationName = searchParams.get('destinationName') || 'Chikmagalur';
      const alternatives = searchParams.get('alternatives') === 'true';

      const route = await osrmRouteAdapter.calculateRoute({
        origin,
        destination,
        originName,
        destinationName,
        alternatives,
      });

      sendJson(res, 200, route);
      return;
    }

    // 3. Search / Geocoding: /api/map/search
    if (pathname === '/search' || pathname === '/api/map/search') {
      const q = (searchParams.get('q') || '').trim();
      if (!q) {
        sendJson(res, 400, { error: 'Query parameter "q" is required' });
        return;
      }

      // Input sanitization: cap length and strip unsafe characters
      const sanitized = q.slice(0, 100).replace(/[<>{}\\]/g, '');
      const limit = parseInt(searchParams.get('limit') || '5', 10);
      const viewbox = parseBBox(searchParams.get('viewbox')) || undefined;

      const places = await nominatimSearchAdapter.search({
        query: sanitized,
        limit,
        viewbox,
      });

      sendJson(res, 200, places);
      return;
    }

    // 4. Reverse Geocoding: /api/map/reverse-geocode
    if (pathname === '/reverse-geocode' || pathname === '/api/map/reverse-geocode') {
      const latStr = searchParams.get('lat');
      const lonStr = searchParams.get('lng') || searchParams.get('lon');

      if (!latStr || !lonStr) {
        sendJson(res, 400, { error: 'Parameters "lat" and "lng" are required' });
        return;
      }

      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        sendJson(res, 400, { error: 'Invalid coordinate bounds' });
        return;
      }

      const place = await nominatimSearchAdapter.reverseGeocode([lon, lat]);
      sendJson(res, 200, place || { error: 'Location could not be resolved' });
      return;
    }

    // 5. POIs: /api/map/pois
    if (pathname === '/pois' || pathname === '/api/map/pois') {
      const bbox = parseBBox(searchParams.get('bbox')) || undefined;
      const corridorKey = searchParams.get('corridorKey') || undefined;
      const catParam = searchParams.get('categories');
      const categories = catParam ? (catParam.split(',') as POICategory[]) : undefined;

      const pois = await overpassPOIAdapter.getPOIsInBBox({
        bbox,
        corridorKey,
        categories,
      });

      sendJson(res, 200, pois);
      return;
    }

    // 6. Route Weather: /api/map/weather
    if (pathname === '/weather' || pathname === '/api/map/weather') {
      const pointsParam = searchParams.get('points');
      const checkpointList: { name: string; coordinates: Coordinates }[] = [];

      if (pointsParam) {
        for (const item of pointsParam.split(';')) {
          const [name, coordStr] = item.split(':');
          const coords = parseCoords(coordStr);
          if (name && coords) {
            checkpointList.push({ name: name.trim(), coordinates: coords });
          }
        }
      }

      const weather = await openMeteoWeatherAdapter.getWeatherForCheckpoints(checkpointList);
      sendJson(res, 200, weather);
      return;
    }

    // 7. OSINT & Hazards: /api/map/osint
    if (pathname === '/osint' || pathname === '/api/map/osint') {
      const bbox = parseBBox(searchParams.get('bbox')) || undefined;
      const format = searchParams.get('format') || 'events'; // 'events' | 'hazards'

      const [usgsEvents, firmsEvents] = await Promise.all([
        usgsEarthquakeAdapter.getEvents(bbox),
        nasaFirmsAdapter.getEvents(bbox),
      ]);

      const allEvents = [...usgsEvents, ...firmsEvents];

      if (format === 'hazards') {
        const hazards = normalizeOSINTToHazards(allEvents);
        sendJson(res, 200, hazards);
        return;
      }

      sendJson(res, 200, allEvents);
      return;
    }

    return next();
  } catch (error) {
    console.error('[handleMapRequest] Unhandled error:', error);
    sendJson(res, 500, {
      error: 'Internal Map Intelligence Service Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
