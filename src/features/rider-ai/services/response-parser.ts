import { AIResponse, AIStructuredCard, DataFreshness } from '../types';

export interface RawAIOutputPayload {
  text: string;
  cards?: AIStructuredCard[];
  confidenceScore?: number;
}

/**
 * Parses and validates LLM response payloads into safe, typed AIResponse structures.
 */
export function parseRiderAIResponse(
  rawResponse: string | RawAIOutputPayload,
  fallbackFreshness: DataFreshness | 'estimated' = 'demo'
): AIResponse {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (typeof rawResponse === 'object' && rawResponse !== null) {
    return {
      messageId,
      text: rawResponse.text || '',
      cards: sanitizeCards(rawResponse.cards),
      confidenceScore: rawResponse.confidenceScore ?? 0.95,
      dataFreshness: fallbackFreshness,
    };
  }

  // If raw string, attempt to extract JSON block or parse directly
  try {
    const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) || rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return {
        messageId,
        text:
          parsed.text ||
          parsed.message ||
          parsed.response ||
          parsed.summary ||
          rawResponse.replace(/```json[\s\S]*?```/, '').trim() ||
          'Route advisory updated.',
        cards: sanitizeCards(parsed.cards),
        confidenceScore: parsed.confidenceScore ?? 0.9,
        dataFreshness: fallbackFreshness,
      };
    }
  } catch {
    // Graceful fallback to pure conversational text
  }

  return {
    messageId,
    text: rawResponse.trim(),
    cards: [],
    confidenceScore: 0.85,
    dataFreshness: fallbackFreshness,
  };
}

const VALID_CARD_TYPES = new Set<string>([
  'route-safety',
  'hazard',
  'weather',
  'fuel',
  'food',
  'repair',
  'bike-suitability',
  'alternative-route',
  'ride-preparation',
  'recommendation',
]);

/**
 * Ensures card structures conform to required discriminators, normalizes properties,
 * and discards invalid or unparseable cards.
 */
function sanitizeCards(cards?: unknown[]): AIStructuredCard[] {
  if (!Array.isArray(cards)) return [];
  const validCards: AIStructuredCard[] = [];

  for (const c of cards) {
    if (typeof c !== 'object' || c === null) continue;
    const cardObj = c as Record<string, any>;
    if (typeof cardObj.type !== 'string' || !VALID_CARD_TYPES.has(cardObj.type)) continue;

    switch (cardObj.type) {
      case 'route-safety':
        validCards.push({
          ...cardObj,
          type: 'route-safety',
          safetyScore: typeof cardObj.safetyScore === 'number' ? cardObj.safetyScore : 82,
          riskLevel: cardObj.riskLevel || 'moderate',
          riskIndicators: Array.isArray(cardObj.riskIndicators) ? cardObj.riskIndicators : [],
          explanation: typeof cardObj.explanation === 'string' ? cardObj.explanation : '',
          recommendedAction: typeof cardObj.recommendedAction === 'string' ? cardObj.recommendedAction : undefined,
        });
        break;

      case 'hazard':
        validCards.push({
          ...cardObj,
          type: 'hazard',
          hazardType: cardObj.hazardType || 'Road Hazard',
          severity: cardObj.severity || 'medium',
          description: typeof cardObj.description === 'string' ? cardObj.description : '',
          precaution:
            typeof cardObj.precaution === 'string' && cardObj.precaution
              ? cardObj.precaution
              : 'Exercise elevated caution on this corridor section.',
        });
        break;

      case 'bike-suitability':
        validCards.push({
          ...cardObj,
          type: 'bike-suitability',
          bikeModel: cardObj.bikeModel || 'Motorcycle',
          suitabilityScore: typeof cardObj.suitabilityScore === 'number' ? cardObj.suitabilityScore : 90,
          rating: cardObj.rating || 'capable',
          matchedFactors: Array.isArray(cardObj.matchedFactors) ? cardObj.matchedFactors : [],
          potentialChallenges: Array.isArray(cardObj.potentialChallenges) ? cardObj.potentialChallenges : [],
          recommendation: typeof cardObj.recommendation === 'string' ? cardObj.recommendation : '',
        });
        break;

      case 'alternative-route':
        validCards.push({
          ...cardObj,
          type: 'alternative-route',
          alternativeName: cardObj.alternativeName || 'Alternative Route Corridor',
          alternativeDistanceKm: typeof cardObj.alternativeDistanceKm === 'number' ? cardObj.alternativeDistanceKm : 255,
          originalDistanceKm: typeof cardObj.originalDistanceKm === 'number' ? cardObj.originalDistanceKm : 247,
          safetyScore: typeof cardObj.safetyScore === 'number' ? cardObj.safetyScore : 90,
          safetyDelta: typeof cardObj.safetyDelta === 'number' ? cardObj.safetyDelta : 5,
          timeDeltaMinutes: typeof cardObj.timeDeltaMinutes === 'number' ? cardObj.timeDeltaMinutes : 15,
          reason: typeof cardObj.reason === 'string' ? cardObj.reason : '',
        });
        break;

      case 'ride-preparation':
        validCards.push({
          ...cardObj,
          type: 'ride-preparation',
          gearChecklist: Array.isArray(cardObj.gearChecklist) ? cardObj.gearChecklist : [],
          bikePreTripChecks: Array.isArray(cardObj.bikePreTripChecks) ? cardObj.bikePreTripChecks : [],
          documentsRequired: Array.isArray(cardObj.documentsRequired) ? cardObj.documentsRequired : [],
        });
        break;

      case 'fuel':
        validCards.push({
          ...cardObj,
          type: 'fuel',
          stops: Array.isArray(cardObj.stops) ? cardObj.stops : [],
        });
        break;

      case 'food':
        validCards.push({
          ...cardObj,
          type: 'food',
          stops: Array.isArray(cardObj.stops) ? cardObj.stops : [],
        });
        break;

      case 'repair':
        validCards.push({
          ...cardObj,
          type: 'repair',
          shops: Array.isArray(cardObj.shops) ? cardObj.shops : [],
        });
        break;

      case 'weather':
        validCards.push({
          ...cardObj,
          type: 'weather',
          condition: cardObj.condition || 'Partly Cloudy',
          temperatureC: typeof cardObj.temperatureC === 'number' ? cardObj.temperatureC : 24,
          rainProbability: typeof cardObj.rainProbability === 'number' ? cardObj.rainProbability : 30,
          ridingRecommendation:
            typeof cardObj.ridingRecommendation === 'string' && cardObj.ridingRecommendation
              ? cardObj.ridingRecommendation
              : 'Maintain steady pace and monitor local weather conditions.',
        });
        break;

      case 'recommendation':
        validCards.push({
          ...cardObj,
          type: 'recommendation',
          title: cardObj.title || 'Route Advisory',
          recommendation: typeof cardObj.recommendation === 'string' ? cardObj.recommendation : 'Proceed with situational awareness.',
          reason: typeof cardObj.reason === 'string' ? cardObj.reason : 'Optimized for rider corridor safety.',
          whyThisRecommendation:
            typeof cardObj.whyThisRecommendation === 'string' && cardObj.whyThisRecommendation
              ? cardObj.whyThisRecommendation
              : (cardObj.reason || 'Calculated from route hazard analysis.'),
        });
        break;

      default:
        break;
    }
  }

  return validCards;
}
