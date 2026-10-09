import { IOSINTProvider, OSINTEvent } from './osint.interface';

export class FallbackHazardsAdapter implements IOSINTProvider {
  async getEvents(): Promise<OSINTEvent[]> {
    return [
      {
        id: 'hz-kunigal-humps',
        category: 'road-hazard',
        title: 'Unmarked Speed Breaker Cluster',
        description: 'Three consecutive high-profile asphalt speed breakers at the intersection entry.',
        severity: 'high',
        coordinates: [77.2401, 13.0245],
        confidence: 0.95,
        provenance: {
          source: 'MotoCompanion Rider Telemetry & Road Audits',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          confidence: 0.95,
          isDemoData: true,
        },
      },
      {
        id: 'hz-mudigere-gravel',
        category: 'road-hazard',
        title: 'Loose Gravel on Descending Hairpin',
        description: 'Aggregate spill on road shoulder following recent culvert maintenance.',
        severity: 'high',
        coordinates: [75.7765, 13.2189],
        confidence: 0.9,
        provenance: {
          source: 'MotoCompanion Western Ghats Road Audits',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          confidence: 0.9,
          isDemoData: true,
        },
      },
      {
        id: 'hz-ghat-rain-grip',
        category: 'weather-alert',
        title: 'Intermittent Rain & Reduced Tyre Grip',
        description: 'Passing monsoon clouds reducing wet tarmac friction on ghat ascent.',
        severity: 'moderate',
        coordinates: [75.7721, 13.3161],
        confidence: 0.85,
        provenance: {
          source: 'MotoCompanion Environmental Observation',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          confidence: 0.85,
          isDemoData: true,
        },
      },
    ];
  }
}

export const fallbackHazardsAdapter = new FallbackHazardsAdapter();
