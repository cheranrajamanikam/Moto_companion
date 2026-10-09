export type RiderExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type RiderPacePreference = 'relaxed' | 'moderate' | 'spirited';

export type RiderSafetyPriority = 'maximum' | 'balanced' | 'adventure';

export interface RiderPreferences {
  avoidNightRiding?: boolean;
  avoidHeavyRain?: boolean;
  maxContinuousRidingMinutes?: number;
  preferScenicRoutes?: boolean;
}

/**
 * Contextual information about the motorcycle rider.
 * In production, this will be populated from Member 1's user/profile system.
 */
export interface RiderContext {
  id?: string;
  name?: string;
  experienceLevel?: RiderExperienceLevel;
  totalRidesLogged?: number;
  pacePreference?: RiderPacePreference;
  safetyPriority?: RiderSafetyPriority;
  preferences?: RiderPreferences;
}
