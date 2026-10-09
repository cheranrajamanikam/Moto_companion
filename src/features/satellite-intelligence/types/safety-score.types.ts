export type SafetyTier = 'optimal' | 'moderate-risk' | 'high-risk' | 'hazardous';

export type DeductionCategory = 'road' | 'hazard' | 'terrain' | 'weather' | 'complexity';

export interface SafetyDeduction {
  category: DeductionCategory;
  factor: string;
  pointsDeducted: number;
  explanation: string;
}

export interface SafetyBreakdown {
  roadConditionScore: number;  // 0 - 100
  hazardExposureScore: number; // 0 - 100
  terrainScore: number;        // 0 - 100
  weatherScore: number;        // 0 - 100
  complexityScore: number;     // 0 - 100
  deductions: SafetyDeduction[];
}

export interface RouteSafetyScore {
  overallScore: number; // 0 - 100
  safetyTier: SafetyTier;
  breakdown: SafetyBreakdown;
  summaryAdvisory: string;
  confidence: number;
}
