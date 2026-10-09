import { OSINTEvent } from '../osint/osint.interface';
import { Hazard, HazardCategory, HazardSeverity } from '../../../src/features/satellite-intelligence/types/hazard.types';

export function normalizeOSINTToHazards(events: OSINTEvent[]): Hazard[] {
  return events.map((event) => {
    let category: HazardCategory = 'accident-incident';
    if (event.category === 'road-hazard') category = 'road-damage';
    else if (event.category === 'weather-alert') category = 'weather-hazard';
    else if (event.category === 'wildlife') category = 'terrain-route-complexity';
    else if (event.category === 'seismic') category = 'accident-incident';
    else if (event.category === 'thermal') category = 'accident-incident';

    let severity: HazardSeverity = 'low';
    if (event.severity === 'critical') severity = 'critical';
    else if (event.severity === 'high') severity = 'high';
    else if (event.severity === 'moderate') severity = 'medium';

    return {
      id: event.id,
      category,
      title: event.title,
      description: event.description,
      severity,
      coordinates: event.coordinates,
      corridorDistanceKm: 0,
      locationName: event.title,
      verificationCount: event.confidence ? Math.round(event.confidence * 10) : 5,
      source: event.provenance.isDemoData
        ? 'demo'
        : event.category === 'seismic'
        ? 'usgs-earthquake'
        : event.category === 'thermal'
        ? 'nasa-firms'
        : 'derived',
      sourceLabel: event.provenance.source,
      sourceUrl: event.provenance.sourceUrl,
      timestamp: new Date(event.provenance.timestamp).getTime(),
      freshness: event.provenance.freshness === 'live/current' ? 'live' : event.provenance.freshness === 'cached' ? 'cached' : event.provenance.freshness === 'recent' ? 'recent' : 'demo',
      confidence: event.confidence ?? event.provenance.confidence ?? 0.9,
      isDemoData: event.provenance.isDemoData,
      recommendedAction:
        severity === 'critical'
          ? 'Exercise extreme caution; consider bypassing sector or halting until verified clear.'
          : severity === 'high'
          ? 'Reduce speed, maintain heightened situational awareness, and avoid sudden braking.'
          : 'Maintain lane discipline and standard defensive riding posture.',
    };
  });
}
