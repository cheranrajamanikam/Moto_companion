import type { UserProfile, MatchResult, MatchFilterOptions } from "@/types/rider";
import { getCcMatchRange, isCcCompatible } from "@/lib/ccMatching";
import { userService } from './userService';

// Helper distances between cities / users for realistic demo
const DISTANCE_MATRIX_KM: Record<string, Record<string, number>> = {
  Bengaluru: { Bengaluru: 4.2, Mysuru: 145, Chennai: 340, Hyderabad: 570, Mumbai: 980, Pune: 840 },
  Mysuru: { Bengaluru: 145, Mysuru: 5.0, Chennai: 480, Hyderabad: 710, Mumbai: 1060, Pune: 920 },
  Chennai: { Bengaluru: 340, Mysuru: 480, Chennai: 3.5, Hyderabad: 620, Mumbai: 1330, Pune: 1180 },
  Hyderabad: { Bengaluru: 570, Mysuru: 710, Chennai: 620, Hyderabad: 4.8, Mumbai: 710, Pune: 560 },
  Mumbai: { Bengaluru: 980, Mysuru: 1060, Chennai: 1330, Hyderabad: 710, Mumbai: 6.0, Pune: 150 },
  Pune: { Bengaluru: 840, Mysuru: 920, Chennai: 1180, Hyderabad: 560, Mumbai: 150, Pune: 4.5 },
};

function calculateDistance(city1: string, city2: string, matchedUserId: string): number {
  if (city1 === city2) {
    // Generate deterministic sub-city distance based on ID
    const charCode = matchedUserId.charCodeAt(matchedUserId.length - 1);
    return Math.round((2.5 + (charCode % 12) * 0.7) * 10) / 10;
  }
  const dist = DISTANCE_MATRIX_KM[city1]?.[city2] || 250;
  return dist;
}

export const matchingService = {
  calculateMatch(user: UserProfile, matchedUser: UserProfile, role: 'rider' | 'pillion'): MatchResult {
    const userPrimaryBike = user.bikes.find((b) => b.isPrimary) || user.bikes[0];
    const matchedPrimaryBike = matchedUser.bikes.find((b) => b.isPrimary) || matchedUser.bikes[0];

    const userCC = userPrimaryBike ? userPrimaryBike.engineCC : 350;
    const matchedCC = matchedPrimaryBike ? matchedPrimaryBike.engineCC : 350;

    // 1. CC Compatibility (20%)
    const ccDiff = Math.abs(userCC - matchedCC);
    const ccScore = Math.max(0, 100 - Math.min(100, ccDiff / 3));

    // 2. Distance Score (20%)
    const distanceKm = calculateDistance(user.city, matchedUser.city, matchedUser.userId);
    let distanceScore = 0;
    if (distanceKm <= 10) distanceScore = 100;
    else if (distanceKm <= 50) distanceScore = 80;
    else if (distanceKm <= 150) distanceScore = 60;
    else distanceScore = Math.max(10, 100 - distanceKm / 10);

    // 3. Ride Preferences Overlap (20%)
    const userRideSet = new Set(user.ridePreferences);
    const rideOverlap = matchedUser.ridePreferences.filter((p) => userRideSet.has(p));
    const rideScore = userRideSet.size > 0 ? Math.min(100, (rideOverlap.length / userRideSet.size) * 100) : 70;

    // 4. Partner Preferences Overlap (20%)
    const userPartnerSet = new Set(user.partnerPreferences);
    const partnerOverlap = matchedUser.partnerPreferences.filter((p) => userPartnerSet.has(p));
    const partnerScore = userPartnerSet.size > 0 ? Math.min(100, (partnerOverlap.length / userPartnerSet.size) * 100) : 70;

    // 5. Experience Score (10%)
    const expDiff = Math.abs(user.ridingExperienceYears - matchedUser.ridingExperienceYears);
    const expScore = Math.max(40, 100 - expDiff * 10);

    // 6. Reputation Score (10%)
    const repScore = (matchedUser.reputation.rating / 5) * 100;

    // Total Score
    const totalMatchScore = Math.round(
      ccScore * 0.2 +
        distanceScore * 0.2 +
        rideScore * 0.2 +
        partnerScore * 0.2 +
        expScore * 0.1 +
        repScore * 0.1
    );

    // Dynamic Match Reasons Generation
    const matchReasons: string[] = [];

    if (ccDiff <= 50) {
      matchReasons.push(`Similar engine capacity (${matchedCC} CC vs ${userCC} CC)`);
    } else if (ccDiff <= 150) {
      matchReasons.push(`Compatible engine power class (${matchedCC} CC)`);
    }

    if (rideOverlap.length > 0) {
      const formatted = rideOverlap.map((r) => r.replace('-', ' ')).slice(0, 2).join(' & ');
      matchReasons.push(`Both prefer ${formatted} rides`);
    } else {
      matchReasons.push('Open to flexible riding routes');
    }

    if (partnerOverlap.length > 0) {
      const formatted = partnerOverlap.map((p) => p.replace('-', ' ')).slice(0, 2).join(' & ');
      matchReasons.push(`Both value ${formatted}`);
    }

    if (expDiff <= 2) {
      matchReasons.push(`Similar riding experience (${matchedUser.ridingExperienceYears} years)`);
    }

    if (distanceKm <= 15) {
      matchReasons.push(`Located nearby (${distanceKm} km away in ${matchedUser.city})`);
    } else {
      matchReasons.push(`Accessible location (${distanceKm} km away)`);
    }

    if (matchedUser.kycStatus === 'VERIFIED') {
      matchReasons.push('Verified identity with completed KYC');
    }

    if (matchedUser.reputation.rating >= 4.7) {
      matchReasons.push(`Strong reputation (${matchedUser.reputation.rating} / 5.0 rating)`);
    }

    return {
      matchId: `match-${user.userId}-${matchedUser.userId}-${role}`,
      userId: user.userId,
      matchedUserId: matchedUser.userId,
      matchedUser,
      matchRole: role,
      matchScore: Math.min(99, Math.max(65, totalMatchScore)),
      distanceKm,
      ccCompatibility: Math.round(ccScore),
      preferenceCompatibility: Math.round(partnerScore),
      rideCompatibility: Math.round(rideScore),
      experienceCompatibility: Math.round(expScore),
      reputationScore: Math.round(repScore),
      kycVerified: matchedUser.kycStatus === 'VERIFIED',
      matchReasons,
    };
  },

  getMatches(filters: MatchFilterOptions): MatchResult[] {
    const currentUser = userService.getCurrentUser();
    const allUsers = userService.getAllUsers().filter((u) => u.userId !== currentUser.userId);

    let results = allUsers.map((u) => this.calculateMatch(currentUser, u, filters.role));

    const { min: ccMin, max: ccMax } = getCcMatchRange();
    results = results.filter((m) => {
      const primaryBike = m.matchedUser.bikes.find((b) => b.isPrimary) || m.matchedUser.bikes[0];
      if (!primaryBike) return false;
      return isCcCompatible(primaryBike.engineCC) && primaryBike.engineCC >= ccMin && primaryBike.engineCC <= ccMax;
    });

    // Filter application
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(
        (m) =>
          m.matchedUser.name.toLowerCase().includes(q) ||
          m.matchedUser.city.toLowerCase().includes(q) ||
          m.matchedUser.bikes.some((b) => b.model.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q))
      );
    }

    if (filters.minCC !== undefined) {
      results = results.filter((m) => {
        const primaryBike = m.matchedUser.bikes.find((b) => b.isPrimary) || m.matchedUser.bikes[0];
        return primaryBike ? primaryBike.engineCC >= filters.minCC! : true;
      });
    }

    if (filters.maxCC !== undefined) {
      results = results.filter((m) => {
        const primaryBike = m.matchedUser.bikes.find((b) => b.isPrimary) || m.matchedUser.bikes[0];
        return primaryBike ? primaryBike.engineCC <= filters.maxCC! : true;
      });
    }

    if (filters.maxDistanceKm !== undefined) {
      results = results.filter((m) => m.distanceKm <= filters.maxDistanceKm!);
    }

    if (filters.city && filters.city !== 'ALL') {
      results = results.filter((m) => m.matchedUser.city === filters.city);
    }

    if (filters.minRating !== undefined && filters.minRating > 0) {
      results = results.filter((m) => m.matchedUser.reputation.rating >= filters.minRating!);
    }

    if (filters.kycOnly) {
      results = results.filter((m) => m.kycVerified);
    }

    if (filters.experienceLevel && filters.experienceLevel !== 'ALL') {
      results = results.filter((m) => m.matchedUser.experienceLevel === filters.experienceLevel);
    }

    // Sorting application
    const sortBy = filters.sortBy || 'BEST_MATCH';
    results.sort((a, b) => {
      if (sortBy === 'BEST_MATCH') return b.matchScore - a.matchScore;
      if (sortBy === 'NEAREST') return a.distanceKm - b.distanceKm;
      if (sortBy === 'HIGHEST_RATED') return b.matchedUser.reputation.rating - a.matchedUser.reputation.rating;
      if (sortBy === 'MOST_EXPERIENCED') return b.matchedUser.ridingExperienceYears - a.matchedUser.ridingExperienceYears;
      return 0;
    });

    return results;
  },

  getMatchById(matchId: string): MatchResult | null {
    const currentUser = userService.getCurrentUser();
    const parts = matchId.split('-');
    const matchedUserId = parts[2] ? parts[2] : '';
    const role = (parts[3] as 'rider' | 'pillion') || 'rider';

    const matchedUser = userService.getUserProfile(matchedUserId);
    if (!matchedUser) {
      // Fallback to first available user
      const users = userService.getAllUsers().filter((u) => u.userId !== currentUser.userId);
      return users.length > 0 ? this.calculateMatch(currentUser, users[0], role) : null;
    }
    return this.calculateMatch(currentUser, matchedUser, role);
  },
};
