import fs from 'node:fs';
import path from 'node:path';
import { IOSINTProvider, OSINTEvent } from './osint.interface';
import { globalMemoryCache } from '../cache/memory-cache';
import { providerLimiters } from '../rate-limit/token-bucket';

function getFirmsKey(): string {
  if (process.env.FIRMS_MAP_KEY && process.env.FIRMS_MAP_KEY.trim()) {
    return process.env.FIRMS_MAP_KEY.trim();
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k.trim() === 'FIRMS_MAP_KEY') {
          return v.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    }
  } catch {}
  return '';
}

export class NASAFIRMSAdapter implements IOSINTProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
    timeoutMs = 4500
  ) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Safe status inspection without leaking secrets
   */
  getStatus(): { isConfigured: boolean; provider: string } {
    const key = getFirmsKey();
    return {
      provider: 'NASA FIRMS',
      isConfigured: Boolean(key && key.length > 5),
    };
  }

  async getEvents(bbox?: [number, number, number, number]): Promise<OSINTEvent[]> {
    const key = getFirmsKey();

    // Graceful degradation when key is missing: do not crash, flag internally
    if (!key) {
      // Configuration-missing: returns empty array without throwing
      return [];
    }

    const [minLon, minLat, maxLon, maxLat] = bbox || [75.5, 12.8, 77.8, 13.6];
    const cacheKey = `osint:firms:${minLon.toFixed(1)},${minLat.toFixed(1)},${maxLon.toFixed(1)},${maxLat.toFixed(1)}`;

    return globalMemoryCache.fetchOrDedupe<OSINTEvent[]>(
      cacheKey,
      15 * 60 * 1000, // 15 minutes TTL
      async () => {
        const allowed = await providerLimiters.firms.acquire(1, 2000);
        if (!allowed) {
          console.warn('[NASAFIRMSAdapter] Rate limit exceeded for FIRMS, skipping active query');
          return [];
        }

        try {
          // NASA FIRMS Area API format: /api/area/csv/[MAP_KEY]/[SOURCE]/[W,S,E,N]/[DAY_RANGE]
          const areaString = `${minLon},${minLat},${maxLon},${maxLat}`;
          const url = `${this.baseUrl}/${key}/VIIRS_SNPP_NRT/${areaString}/1`;

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'MotoCompanion-Navigation-Platform/1.0',
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            console.warn(`[NASAFIRMSAdapter] HTTP ${response.status} from NASA FIRMS, disabling active thermal layer`);
            return [];
          }

          const csvText = await response.text();
          const lines = csvText.trim().split(/\r?\n/);
          if (lines.length <= 1) {
            return [];
          }

          // CSV Header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight
          const header = lines[0].split(',');
          const latIdx = header.indexOf('latitude');
          const lonIdx = header.indexOf('longitude');
          const confIdx = header.indexOf('confidence');

          const events: OSINTEvent[] = [];
          for (let i = 1; i < Math.min(lines.length, 25); i++) {
            const cols = lines[i].split(',');
            const lat = parseFloat(cols[latIdx]);
            const lon = parseFloat(cols[lonIdx]);
            const conf = cols[confIdx] || 'nominal';

            if (!isNaN(lat) && !isNaN(lon)) {
              events.push({
                id: `firms-${i}-${Date.now()}`,
                category: 'thermal',
                title: 'Thermal Anomaly / Active Burn Point',
                description: `High-temperature hotspot detected via VIIRS satellite observation (Confidence: ${conf}).`,
                severity: conf === 'high' ? 'high' : 'moderate',
                coordinates: [lon, lat],
                confidence: conf === 'high' ? 0.95 : 0.8,
                provenance: {
                  source: 'NASA FIRMS VIIRS NRT',
                  sourceUrl: 'https://firms.modaps.eosdis.nasa.gov',
                  timestamp: new Date().toISOString(),
                  freshness: 'recent',
                  confidence: conf === 'high' ? 0.95 : 0.8,
                  isDemoData: false,
                },
              });
            }
          }

          return events;
        } catch (error) {
          console.warn('[NASAFIRMSAdapter] Fetch failed or timed out:', error instanceof Error ? error.message : error);
          return [];
        }
      }
    );
  }
}

export const nasaFirmsAdapter = new NASAFIRMSAdapter();
