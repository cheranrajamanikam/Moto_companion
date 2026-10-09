import {
  IRoutingProvider,
  NormalizedRoute,
  NormalizedRouteStep,
  RouteRequestParams,
} from './routing.interface';

export class FallbackRouteAdapter implements IRoutingProvider {
  async calculateRoute(params: RouteRequestParams): Promise<NormalizedRoute> {
    const defaultOrigin = params.originName || 'Bangalore (Nelamangala Toll)';
    const defaultDest = params.destinationName || 'Chikmagalur (Town Center)';

    // Curated high-resolution road-following geometry for NH75 Bangalore -> Chikmagalur (57 vertices)
    const coordinates: [number, number][] = [
      [77.4987, 13.0982], [77.4664, 13.089], [77.434, 13.0798], [77.4017, 13.0706],
      [77.3694, 13.0614], [77.3371, 13.0521], [77.3047, 13.0429], [77.2724, 13.0337],
      [77.2401, 13.0245], [77.1901, 13.0191], [77.1401, 13.0137], [77.0901, 13.0083],
      [77.0401, 13.0028], [76.9902, 12.9974], [76.9402, 12.992], [76.8902, 12.9866],
      [76.8402, 12.9812], [76.8028, 12.9833], [76.7655, 12.9854], [76.7281, 12.9874],
      [76.6907, 12.9895], [76.6533, 12.9916], [76.6159, 12.9936], [76.5786, 12.9957],
      [76.5412, 12.9978], [76.4863, 12.9989], [76.4315, 13.0], [76.3766, 13.0012],
      [76.3218, 13.0023], [76.2669, 13.0034], [76.212, 13.0046], [76.1572, 13.0057],
      [76.1023, 13.0068], [76.0722, 13.0262], [76.0421, 13.0457], [76.012, 13.0651],
      [75.9819, 13.0846], [75.9517, 13.104], [75.9216, 13.1234], [75.8915, 13.1429],
      [75.8614, 13.1623], [75.8508, 13.1694], [75.8402, 13.1764], [75.8296, 13.1835],
      [75.819, 13.1906], [75.8083, 13.1977], [75.7977, 13.2048], [75.7871, 13.2118],
      [75.7765, 13.2189], [75.7759, 13.231], [75.7754, 13.2432], [75.7749, 13.2553],
      [75.7743, 13.2675], [75.7737, 13.2797], [75.7732, 13.2918], [75.7726, 13.304],
      [75.7721, 13.3161]
    ];

    const steps: NormalizedRouteStep[] = [
      {
        instruction: 'Head west on NH75 past Nelamangala Toll Plaza',
        distanceM: 48300,
        durationS: 2700,
        maneuver: 'depart',
        bearing: 255,
        location: [77.4987, 13.0982],
        roadName: 'NH75',
      },
      {
        instruction: 'Continue straight through Kunigal Bypass (watch speed breakers)',
        distanceM: 38200,
        durationS: 2200,
        maneuver: 'continue',
        bearing: 260,
        location: [77.2401, 13.0245],
        roadName: 'NH75',
      },
      {
        instruction: 'Follow NH75 straight past Bellur Cross towards Hassan',
        distanceM: 67700,
        durationS: 3600,
        maneuver: 'continue',
        bearing: 265,
        location: [76.8402, 12.9812],
        roadName: 'NH75',
      },
      {
        instruction: 'Take the right fork onto Belur Road (SH57) at Hassan Bypass',
        distanceM: 38500,
        durationS: 2700,
        maneuver: 'fork',
        bearing: 310,
        location: [76.1023, 13.0068],
        roadName: 'SH57',
      },
      {
        instruction: 'Turn left towards Mudigere Ghat approach (winding tarmac)',
        distanceM: 34200,
        durationS: 3200,
        maneuver: 'turn-left',
        bearing: 330,
        location: [75.8614, 13.1623],
        roadName: 'Belur-Mudigere Road',
      },
      {
        instruction: 'Arrive at Chikmagalur town destination on the right',
        distanceM: 20500,
        durationS: 1800,
        maneuver: 'arrive',
        bearing: 0,
        location: [75.7721, 13.3161],
        roadName: 'KM Road',
      },
    ];

    const alternates: NormalizedRoute[] = [];
    if (params.alternatives) {
      alternates.push({
        id: 'alt-arsikere-bypass',
        name: `${defaultOrigin} ➔ ${defaultDest} via Arsikere Bypass`,
        originName: defaultOrigin,
        destinationName: defaultDest,
        coordinates: [
          [77.4987, 13.0982], // Nelamangala
          [77.1023, 13.3412], // Tumkur Bypass
          [76.6214, 13.3145], // Tiptur
          [76.2567, 13.3156], // Arsikere
          [75.9812, 13.3189], // Halebeedu
          [75.7721, 13.3161], // Chikmagalur
        ],
        distanceKm: 258.6,
        durationMinutes: 345,
        elevationGainM: 920,
        steps: [],
        provenance: {
          source: 'MotoCompanion Curated Bypass Fixture',
          sourceUrl: 'https://motocompanion.app',
          timestamp: new Date().toISOString(),
          freshness: 'demo',
          confidence: 0.92,
          isDemoData: true,
        },
      });
    }

    return {
      id: 'fallback-blr-ckm',
      name: `${defaultOrigin} ➔ ${defaultDest} (NH75 & SH57)`,
      originName: defaultOrigin,
      destinationName: defaultDest,
      coordinates,
      distanceKm: 247.4,
      durationMinutes: 320,
      elevationGainM: 1180,
      steps,
      alternates: alternates.length > 0 ? alternates : undefined,
      provenance: {
        source: 'MotoCompanion Curated Indian Corridor',
        sourceUrl: 'https://motocompanion.app',
        timestamp: new Date().toISOString(),
        freshness: 'demo',
        confidence: 0.95,
        isDemoData: true,
      },
    };
  }
}

export const fallbackRouteAdapter = new FallbackRouteAdapter();
