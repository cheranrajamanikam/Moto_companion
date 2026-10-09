import { AIMessage, RiderAIContext } from '../types';
import { RIDER_AI_SYSTEM_PROMPT } from './system-prompt';

export interface RiderAIPromptPayload {
  systemPrompt: string;
  contextSummary: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userQuery: string;
}

/**
 * Builds a prompt payload serialized with current rider, bike, route, hazard, and weather contexts.
 */
export function buildRiderAIPayload(
  query: string,
  context: RiderAIContext,
  history: AIMessage[] = []
): RiderAIPromptPayload {
  const contextLines: string[] = [];

  // Data Freshness & Demo status
  const freshness = (context?.dataFreshness || 'realtime').toUpperCase();
  contextLines.push(`[DATA FRESHNESS]: ${freshness}${context?.isDemoData ? ' (DEMO DATA)' : ''}`);

  // Rider Context
  if (context.rider) {
    contextLines.push(
      `[RIDER]: Name: ${context.rider.name || 'Anonymous'}, Experience: ${context.rider.experienceLevel || 'intermediate'}, Logged Rides: ${context.rider.totalRidesLogged ?? 'N/A'}`
    );
  } else {
    contextLines.push(`[RIDER]: No rider profile connected (UNAVAILABLE).`);
  }

  // Bike Context
  if (context.bike) {
    const isDualChannel =
      context.bike.abs === 'dual-channel' ||
      context.bike.hasABS === true ||
      (context.bike.model?.toLowerCase().includes('himalayan') && context.bike.hasABS !== false);

    const absDescription = isDualChannel
      ? 'Dual-Channel ABS (Active & Equipped)'
      : context.bike.abs
      ? `${context.bike.abs} ABS (Equipped)`
      : context.bike.hasABS === false
      ? 'No ABS'
      : 'Dual-Channel ABS (Equipped)';

    const bikeParts: string[] = [];
    bikeParts.push(`${context.bike.brand || 'Royal Enfield'} ${context.bike.model || 'Himalayan'}`.trim());
    bikeParts.push(`Engine: ${context.bike.engineCc ? `${context.bike.engineCc}cc` : '452cc'}`);
    bikeParts.push(`Category: ${context.bike.category || 'adventure'}`);
    bikeParts.push(`Braking System: ${absDescription}`);
    if (context.bike.estimatedRangeKm) {
      bikeParts.push(`Est Range: ${context.bike.estimatedRangeKm}km`);
    }
    if (context.bike.fuelCapacityL) {
      bikeParts.push(`Fuel Capacity: ${context.bike.fuelCapacityL}L`);
    }
    if (context.bike.notes) {
      bikeParts.push(`Specs: ${context.bike.notes}`);
    }

    contextLines.push(`[BIKE SPECIFICATIONS]: ${bikeParts.join(' | ')}`);
  } else {
    contextLines.push(`[BIKE SPECIFICATIONS]: No bike profile connected (UNAVAILABLE).`);
  }

  // Route Context
  if (context.route) {
    contextLines.push(
      `[ROUTE]: ${context.route.origin} -> ${context.route.destination} | Distance: ${context.route.distanceKm} km | Est Duration: ${context.route.durationMinutes} mins | Elevation Gain: +${context.route.elevationGainM}m | Difficulty: ${context.route.difficulty} | Safety Score: ${context.route.safetyScore}/100 | Sharp Turns: ${context.route.sharpTurns}`
    );
    if (context.route.roadConditionDescription) {
      contextLines.push(`[ROAD CONDITION]: ${context.route.roadConditionDescription}`);
    }
  } else {
    contextLines.push(`[ROUTE]: No route selected (UNAVAILABLE).`);
  }

  // Hazards
  if (context.hazards && context.hazards.length > 0) {
    const hazardSummaries = context.hazards
      .map(
        (h, i) =>
          `  ${i + 1}. [${(h?.severity || 'medium').toUpperCase()}] ${h?.type || 'Hazard'} at ${h?.locationName || 'Route marker'} (km ${h?.distanceKm ?? '?'}) - ${h?.description || 'Road condition'} Recommendation: ${h?.recommendation || 'Exercise caution'}`
      )
      .join('\n');
    contextLines.push(`[HAZARDS DETECTED (${context.hazards.length})]:\n${hazardSummaries}`);
  } else {
    contextLines.push(`[HAZARDS]: No active hazards detected or hazard feed UNAVAILABLE.`);
  }

  // Weather
  if (context.weather && context.weather.isAvailable) {
    contextLines.push(
      `[WEATHER]: ${context.weather.condition}, Temp: ${context.weather.temperatureC}°C, Rain Probability: ${context.weather.rainProbability}%, Wind: ${context.weather.windSpeedKmh ?? 'N/A'} km/h`
    );
    if (context.weather.radarAlert) {
      contextLines.push(`[RADAR ALERT]: ${context.weather.radarAlert}`);
    }
  } else {
    contextLines.push(`[WEATHER]: Live weather service currently UNAVAILABLE for this coordinate.`);
  }

  // Location / GPS
  if (context.location) {
    contextLines.push(
      `[LOCATION]: Road: ${context.location.currentRoad || 'Unknown'}, Hardware GPS: ${context.location.isLiveGPS ? 'ACTIVE' : 'OFFLINE (ESTIMATED/DEMO)'}`
    );
  } else {
    contextLines.push(`[LOCATION]: Live GPS coordinates UNAVAILABLE.`);
  }

  const formattedHistory = history
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .slice(-8)
    .map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

  return {
    systemPrompt: RIDER_AI_SYSTEM_PROMPT,
    contextSummary: contextLines.join('\n'),
    conversationHistory: formattedHistory,
    userQuery: query,
  };
}
