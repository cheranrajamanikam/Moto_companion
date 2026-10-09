import type { Ride, UserProfile } from "@/types/rider";
import { MOCK_RIDES } from "@/data/mockData";
import { userService } from './userService';

let ridesStore: Ride[] = [...MOCK_RIDES];

export const rideService = {
  getRideHistory(userId: string): Ride[] {
    return ridesStore.filter(
      (r) =>
        r.riderId === userId ||
        r.pillionId === userId ||
        r.participants.some((p) => p.userId === userId)
    );
  },

  getRide(rideId: string): Ride | null {
    const ride = ridesStore.find((r) => r.rideId === rideId);
    if (ride) return { ...ride };
    return ridesStore.length > 0 ? { ...ridesStore[0] } : null;
  },

  createRide(rideData: Omit<Ride, 'rideId' | 'createdAt'>): Ride {
    const newRide: Ride = {
      ...rideData,
      rideId: `ride-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    ridesStore.unshift(newRide);
    return newRide;
  },

  updateRideStatus(rideId: string, status: Ride['status']): Ride | null {
    const rideIndex = ridesStore.findIndex((r) => r.rideId === rideId);
    if (rideIndex === -1) return null;
    ridesStore[rideIndex].status = status;
    return { ...ridesStore[rideIndex] };
  },

  // Interface contract specifically for Member 3 AI Riding Companion integration
  getRideContext(rideId: string): {
    rideId: string;
    rider: UserProfile | null;
    pillion: UserProfile | null;
    participants: UserProfile[];
    route: string;
    startLocation: string;
    destination: string;
    date: string;
    time: string;
    distanceKm: number;
    bike: string;
    ridePreferences: string[];
  } | null {
    const ride = this.getRide(rideId);
    if (!ride) return null;

    const riderProfile = userService.getUserProfile(ride.riderId);
    const pillionProfile = ride.pillionId ? userService.getUserProfile(ride.pillionId) : null;
    const participantProfiles = ride.participants
      .map((p) => userService.getUserProfile(p.userId))
      .filter((u): u is UserProfile => u !== null);

    const primaryBike = riderProfile?.bikes.find((b) => b.isPrimary) || riderProfile?.bikes[0];
    const bikeStr = primaryBike ? `${primaryBike.brand} ${primaryBike.model} (${primaryBike.engineCC} CC)` : 'Unknown Motorbike';

    return {
      rideId: ride.rideId,
      rider: riderProfile,
      pillion: pillionProfile,
      participants: participantProfiles,
      route: ride.route,
      startLocation: ride.startLocation,
      destination: ride.destination,
      date: ride.date,
      time: ride.time,
      distanceKm: ride.distanceKm,
      bike: bikeStr,
      ridePreferences: riderProfile ? riderProfile.ridePreferences : [],
    };
  },
};
