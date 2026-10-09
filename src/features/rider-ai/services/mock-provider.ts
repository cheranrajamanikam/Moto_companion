import {
  AIProvider,
} from './ai-provider';
import {
  AIMessage,
  AIResponse,
  RiderAIContext,
  RouteSafetyCardData,
  HazardCardData,
  WeatherCardData,
  FuelCardData,
  FoodCardData,
  RepairCardData,
  BikeSuitabilityCardData,
  AlternativeRouteCardData,
  RidePreparationCardData,
  RecommendationCardData,
} from '../types';

/**
 * MockAIProvider implements the AIProvider interface for Phase 3 development and offline simulation.
 * It strictly respects the honesty boundaries, consumes typed RiderAIContext,
 * and outputs structured cards matching motorcycle riding co-pilot requirements.
 */
export class MockAIProvider implements AIProvider {
  private simulatedLatencyMs: number;

  constructor(simulatedLatencyMs: number = 750) {
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  async sendMessage(
    query: string,
    context: RiderAIContext,
    _conversationHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    // Realistic thinking latency
    await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));

    const q = query.toLowerCase().trim();
    const messageId = `mock-resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Intent: Alternative Route ("Find a safer route", "bypass", "detour")
    if (
      q.includes('safer route') ||
      q.includes('alternative') ||
      q.includes('bypass') ||
      q.includes('another way') ||
      q.includes('detour')
    ) {
      const card: AlternativeRouteCardData = {
        type: 'alternative-route',
        alternativeName: 'Bangalore → Chikmagalur via Arsikere Bypass',
        originalDistanceKm: context.route?.distanceKm || 247,
        alternativeDistanceKm: 261,
        safetyScore: 91,
        safetyDelta: 9,
        timeDeltaMinutes: 18,
        reason:
          'Bypasses the sharp Mudigere hairpin curves by maintaining a gentler gradient through Arsikere and Kadur. Smoother asphalt with wider shoulders and lower heavy commercial truck volume.',
        highlightPass: 'Arsikere Valley Corridor',
      };

      return {
        messageId,
        text: 'Here is a safer alternative routing corridor that trades 14 additional kilometres for significantly gentler gradients and improved road width.',
        cards: [card],
        confidenceScore: 0.92,
        dataFreshness: context.dataFreshness,
      };
    }

    // 2. Intent: Route Safety ("Is my route safe?")
    if (q.includes('safe') || q.includes('safety') || q.includes('danger') || q.includes('risk')) {
      const card: RouteSafetyCardData = {
        type: 'route-safety',
        safetyScore: context.route?.safetyScore ?? 82,
        riskLevel: 'moderate',
        riskIndicators: [
          'High-speed commercial truck traffic on NH75 four-lane stretch until Hassan',
          'Sudden elevation gain (+1180m) entering the Western Ghats foothill pass',
          '12 technical hairpin curves on the Mudigere descent with patchy tarmac',
        ],
        explanation:
          'Based on the available route corridor data, this trip holds an 82/100 safety score. No route can ever be guaranteed 100% safe; exercise active throttle modulation through the ghat hairpins.',
        recommendedAction: 'Keep headlight on low beam, maintain 3-second braking margin behind buses.',
      };

      return {
        messageId,
        text: 'Based on the available demo route data for Bangalore → Chikmagalur (247 km), the overall safety index is 82/100 (Moderate Risk). The primary concerns are highway traffic flow until Hassan and descending hairpins after Belur.',
        cards: [card],
        confidenceScore: 0.95,
        dataFreshness: context.dataFreshness,
      };
    }

    // 3. Intent: Hazards ("What hazards are ahead?")
    if (q.includes('hazard') || q.includes('obstacle') || q.includes('road condition') || q.includes('pothole') || q.includes('breaker')) {
      const hazards = context.hazards || [];
      const cards: HazardCardData[] = hazards.map((h) => ({
        type: 'hazard',
        hazardId: h.id,
        hazardType: h.type,
        severity: h.severity,
        distanceAheadKm: h.distanceKm,
        locationName: h.locationName,
        description: h.description || '',
        precaution: h.recommendation || 'Reduce speed and scan road surface.',
      }));

      return {
        messageId,
        text: 'Using the current demo context, 3 route warnings are flagged ahead between Kunigal and Kottigehara pass. Live real-time road reporting is unavailable in this version.',
        cards,
        confidenceScore: 0.94,
        dataFreshness: context.dataFreshness,
      };
    }

    // 4. Intent: Weather ("Check weather")
    if (q.includes('weather') || q.includes('rain') || q.includes('temp') || q.includes('forecast') || q.includes('cloud')) {
      const weather = context.weather;
      const card: WeatherCardData = {
        type: 'weather',
        condition: weather?.condition || 'Partly Cloudy',
        temperatureC: weather?.temperatureC || 24,
        rainProbability: weather?.rainProbability || 35,
        windSpeedKmh: weather?.windSpeedKmh || 14,
        visibilityKm: weather?.visibilityKm || 8.5,
        ridingRecommendation:
          'Ideal dry tarmac window for morning departure (06:00 - 12:00). High probability of moisture and evening fog formation near Kottigehara elevation (+1180m).',
        cautionWindow: '16:00 - 18:30 (Dense mountain fog)',
      };

      return {
        messageId,
        text: `Weather conditions along your Bangalore → Chikmagalur itinerary are currently favorable with a 35% rain probability. Note: Live satellite Doppler feeds are simulated in demo mode.`,
        cards: [card],
        confidenceScore: 0.9,
        dataFreshness: context.dataFreshness,
      };
    }

    // 5. Intent: Fuel ("Find fuel")
    if (q.includes('fuel') || q.includes('petrol') || q.includes('gas') || q.includes('pump') || q.includes('range')) {
      const card: FuelCardData = {
        type: 'fuel',
        stops: [
          {
            name: 'Indian Oil COCO Kunigal',
            brand: 'IOCL',
            distanceKm: 52,
            hasHighOctane: true,
            is24Hours: true,
            recommendedRefuel: false,
          },
          {
            name: 'BPCL Ghar Highway Oasis',
            brand: 'Bharat Petroleum',
            distanceKm: 142,
            hasHighOctane: true,
            is24Hours: true,
            recommendedRefuel: true,
          },
          {
            name: 'HPCL Mudigere Foothills',
            brand: 'HPCL',
            distanceKm: 215,
            hasHighOctane: false,
            is24Hours: false,
            recommendedRefuel: false,
          },
        ],
        rangeRemainingKm: context.bike?.estimatedRangeKm || 420,
        criticalNotice:
          'Fill up before entering the Belur-Mudigere hill section. Premium 95 RON high-octane fuel is rarely available above 1,000m elevation.',
      };

      return {
        messageId,
        text: `Your ${context.bike?.brand || 'Royal Enfield'} ${context.bike?.model || 'Himalayan'} has an estimated 420 km tank range. Here are verified highway fuel stops along NH75:`,
        cards: [card],
        confidenceScore: 0.93,
        dataFreshness: context.dataFreshness,
      };
    }

    // 6. Intent: Food ("Find food")
    if (q.includes('food') || q.includes('eat') || q.includes('breakfast') || q.includes('dhaba') || q.includes('restaurant') || q.includes('cafe')) {
      const card: FoodCardData = {
        type: 'food',
        stops: [
          {
            name: 'Swathi Delicacy (NH75)',
            cuisine: 'South Indian & Filter Coffee',
            distanceKm: 78,
            rating: 4.6,
            hasMotorcycleParking: true,
            restroomCleanliness: 'verified',
          },
          {
            name: 'Hotel Mayura Yediyur',
            cuisine: 'Vegetarian Highway Thali',
            distanceKm: 96,
            rating: 4.3,
            hasMotorcycleParking: true,
            restroomCleanliness: 'verified',
          },
          {
            name: 'Planters Court (Chikmagalur Entrance)',
            cuisine: 'Malnad Cuisine & Continental',
            distanceKm: 242,
            rating: 4.5,
            hasMotorcycleParking: true,
            restroomCleanliness: 'verified',
          },
        ],
      };

      return {
        messageId,
        text: 'Here are rider-frequented highway stops with dedicated motorcycle parking and clean amenities along NH75:',
        cards: [card],
        confidenceScore: 0.91,
        dataFreshness: context.dataFreshness,
      };
    }

    // 7. Intent: Repair / Mechanic ("Find a repair stop")
    if (q.includes('repair') || q.includes('mechanic') || q.includes('puncture') || q.includes('breakdown') || q.includes('garage') || q.includes('fix')) {
      const card: RepairCardData = {
        type: 'repair',
        shops: [
          {
            name: 'Royal Enfield Authorized Service (Hassan)',
            specialization: 'Full Diagnostic & OEM Spares',
            distanceKm: 182,
            phone: '+91 8172 268900',
            openNow: true,
            hasTowService: true,
          },
          {
            name: 'Kunigal Highway Tyre & Puncture Care',
            specialization: 'Tubeless & Spoke Wheel Tubed Puncture Repair',
            distanceKm: 46,
            phone: '+91 94481 23410',
            openNow: true,
            hasTowService: false,
          },
          {
            name: 'Mudigere Ghat Roadside Recovery',
            specialization: 'Motorcycle Winch & Flatbed Towing',
            distanceKm: 218,
            phone: '+91 98450 88219',
            openNow: true,
            hasTowService: true,
          },
        ],
      };

      return {
        messageId,
        text: 'Emergency motorcycle assistance points on the Bangalore → Chikmagalur corridor. Keep emergency roadside contact numbers written down as mountain mobile reception can be intermittent.',
        cards: [card],
        confidenceScore: 0.92,
        dataFreshness: context.dataFreshness,
      };
    }

    // 8. Intent: Bike Suitability ("Is my bike suitable for this route?")
    if (q.includes('bike') || q.includes('suitable') || q.includes('himalayan') || q.includes('handle') || q.includes('fit') || q.includes('motorcycle')) {
      const bike = context.bike;
      const card: BikeSuitabilityCardData = {
        type: 'bike-suitability',
        bikeModel: `${bike?.brand || 'Royal Enfield'} ${bike?.model || 'Himalayan'} (${bike?.engineCc || 452}cc)`,
        suitabilityScore: 94,
        rating: 'ideal',
        matchedFactors: [
          '21-inch front wheel absorbs broken tarmac and culvert drops effortlessly',
          '200mm ground clearance handles speed breakers and gravel run-offs safely',
          'Linear mid-range torque curve excels on 8% - 12% mountain climbs without engine strain',
          'Dual-channel ABS provides critical traction assurance on wet ghat curves',
        ],
        potentialChallenges: [
          'Check rear luggage balance to maintain correct front-wheel trail geometry',
          'Drop cold tyre pressures by 2 PSI if tackling wet cobblestones near Belur',
        ],
        recommendation:
          'The Himalayan 452 is an ideal machine for this itinerary. Its chassis geometry and suspension travel are well suited for Western Ghat road transitions.',
      };

      return {
        messageId,
        text: `Analysis for ${bike?.brand || 'Royal Enfield'} ${bike?.model || 'Himalayan'} (${bike?.engineCc || 452}cc): This motorcycle is exceptionally well-suited for the Bangalore to Chikmagalur elevation profile (+1180m).`,
        cards: [card],
        confidenceScore: 0.96,
        dataFreshness: context.dataFreshness,
      };
    }

    // 9. Intent: Ride Preparation / Packing ("What should I carry?")
    if (q.includes('carry') || q.includes('pack') || q.includes('gear') || q.includes('prepare') || q.includes('checklist')) {
      const card: RidePreparationCardData = {
        type: 'ride-preparation',
        gearChecklist: [
          { item: 'ECE 22.06 / DOT full-face helmet with clean visor', mandatory: true },
          { item: 'CE Level 2 riding jacket with back & shoulder armor', mandatory: true },
          { item: 'Armored leather/textile riding gloves', mandatory: true },
          { item: 'Ankle-protective motorcycle boots', mandatory: true },
          { item: 'Compact rain liner / over-suit in tank bag', mandatory: true },
        ],
        bikePreTripChecks: [
          { check: 'Cold tyre pressure check', details: 'Front: 32 PSI, Rear: 36 PSI (with luggage)' },
          { check: 'Drive chain lubrication & tension', details: 'Lubricate before departure; 25-30mm slack' },
          { check: 'Brake fluid level & pad life', details: 'Inspect reservoir levels and minimum 2mm pad thickness' },
        ],
        documentsRequired: [
          'Original Driving License',
          'Vehicle Registration Certificate (RC)',
          'Valid Insurance Certificate',
          'Pollution Under Control (PUC)',
        ],
        criticalEmergencyNotes:
          'Carry a basic puncture repair kit, mini 12V inflator, and physical copies of emergency contacts in a waterproof pouch.',
      };

      return {
        messageId,
        text: 'Pre-ride preparation and essential gear checklist tailored for a 247 km Western Ghats transition ride:',
        cards: [card],
        confidenceScore: 0.95,
        dataFreshness: context.dataFreshness,
      };
    }

    // 10. General inquiry fallback
    const generalCard: RecommendationCardData = {
      type: 'recommendation',
      title: 'Rider AI Strategic Advisory',
      recommendation:
        'Consider reducing speed substantially before transitions and ghat sections; the appropriate speed depends on visibility, surface condition, traffic density, and your riding comfort.',
      reason:
        'Western Ghat approaches feature sudden unmarked road surface transitions from fresh asphalt to aggregate gravel.',
      whyThisRecommendation:
        'Based on the available demo route data and safety index evaluation for weekend morning riding windows.',
      confidence: 'high',
    };

    return {
      messageId,
      text: `Regarding your query "${query}": Using the current demo context for Bangalore → Chikmagalur, maintain steady situational awareness, monitor tyre grip on mountain dampness, and take regular hydration breaks every 90 minutes.`,
      cards: [generalCard],
      confidenceScore: 0.88,
      dataFreshness: context.dataFreshness,
    };
  }
}
