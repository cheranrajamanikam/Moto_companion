import { HazardSeverity } from './hazard';
import { DataFreshness } from './ai-context';

export type CardType =
  | 'route-safety'
  | 'hazard'
  | 'weather'
  | 'fuel'
  | 'food'
  | 'repair'
  | 'bike-suitability'
  | 'alternative-route'
  | 'ride-preparation'
  | 'recommendation';

export interface RouteSafetyCardData {
  type: 'route-safety';
  safetyScore: number; // 0 - 100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskIndicators: string[];
  explanation: string;
  recommendedAction?: string;
}

export interface HazardCardData {
  type: 'hazard';
  hazardId?: string;
  hazardType: string;
  severity: HazardSeverity;
  distanceAheadKm?: number;
  locationName?: string;
  description: string;
  precaution: string;
  coordinates?: { lat: number; lng: number };
}

export interface WeatherCardData {
  type: 'weather';
  condition: string;
  temperatureC: number;
  rainProbability: number;
  windSpeedKmh?: number;
  visibilityKm?: number;
  ridingRecommendation: string;
  cautionWindow?: string;
}

export interface FuelCardData {
  type: 'fuel';
  stops: Array<{
    name: string;
    brand: string;
    distanceKm: number;
    hasHighOctane?: boolean;
    is24Hours?: boolean;
    recommendedRefuel: boolean;
  }>;
  rangeRemainingKm?: number;
  criticalNotice?: string;
}

export interface FoodCardData {
  type: 'food';
  stops: Array<{
    name: string;
    cuisine: string;
    distanceKm: number;
    rating: number;
    hasMotorcycleParking: boolean;
    restroomCleanliness: 'verified' | 'basic' | 'unknown';
  }>;
}

export interface RepairCardData {
  type: 'repair';
  shops: Array<{
    name: string;
    specialization: string; // e.g. "Royal Enfield specialist", "Puncture repair & tyres"
    distanceKm: number;
    phone?: string;
    openNow: boolean;
    hasTowService?: boolean;
  }>;
}

export interface BikeSuitabilityCardData {
  type: 'bike-suitability';
  bikeModel: string;
  suitabilityScore: number; // 0 - 100
  rating: 'ideal' | 'capable' | 'caution' | 'not-recommended';
  matchedFactors: string[];
  potentialChallenges: string[];
  recommendation: string;
}

export interface AlternativeRouteCardData {
  type: 'alternative-route';
  alternativeName: string;
  originalDistanceKm: number;
  alternativeDistanceKm: number;
  safetyScore: number;
  safetyDelta: number; // e.g. +12
  timeDeltaMinutes: number; // e.g. +15
  reason: string;
  highlightPass?: string;
}

export interface RidePreparationCardData {
  type: 'ride-preparation';
  gearChecklist: Array<{ item: string; mandatory: boolean; checked?: boolean }>;
  bikePreTripChecks: Array<{ check: string; details: string }>;
  documentsRequired: string[];
  criticalEmergencyNotes?: string;
}

export interface RecommendationCardData {
  type: 'recommendation';
  title: string;
  recommendation: string;
  reason: string;
  whyThisRecommendation: string;
  confidence?: 'high' | 'medium' | 'estimated';
}

export type AIStructuredCard =
  | RouteSafetyCardData
  | HazardCardData
  | WeatherCardData
  | FuelCardData
  | FoodCardData
  | RepairCardData
  | BikeSuitabilityCardData
  | AlternativeRouteCardData
  | RidePreparationCardData
  | RecommendationCardData;

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  structuredCards?: AIStructuredCard[];
  quickActionTriggered?: string;
}

export interface AIResponse {
  messageId: string;
  text: string;
  cards?: AIStructuredCard[];
  confidenceScore?: number;
  dataFreshness: DataFreshness | 'estimated';
}

export type AIStatusState =
  | 'demo'
  | 'ready'
  | 'thinking'
  | 'rate-limited'
  | 'unavailable'
  | 'connection-error';

export interface AIStatusInfo {
  state: AIStatusState;
  label: string;
  dotColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  retryAfterSeconds?: number;
}
