import type { Bike } from "@/types/rider";
import { userService } from './userService';

export const bikeService = {
  getUserBikes(userId: string): Bike[] {
    const user = userService.getUserProfile(userId);
    return user ? user.bikes : [];
  },

  addBike(userId: string, newBikeData: Omit<Bike, 'bikeId' | 'userId'>): Bike {
    const user = userService.getUserProfile(userId);
    if (!user) throw new Error('User not found');

    const bikeId = `bike-${Date.now()}`;
    const isFirstBike = user.bikes.length === 0;

    const bike: Bike = {
      ...newBikeData,
      bikeId,
      userId,
      isPrimary: newBikeData.isPrimary || isFirstBike,
    };

    let updatedBikes = [...user.bikes];
    if (bike.isPrimary) {
      updatedBikes = updatedBikes.map((b) => ({ ...b, isPrimary: false }));
    }
    updatedBikes.push(bike);

    userService.updateCurrentUser({ bikes: updatedBikes });
    return bike;
  },

  updateBike(userId: string, bikeId: string, updates: Partial<Bike>): Bike {
    const user = userService.getUserProfile(userId);
    if (!user) throw new Error('User not found');

    let updatedBikes = user.bikes.map((b) => {
      if (b.bikeId === bikeId) {
        return { ...b, ...updates };
      }
      return b;
    });

    if (updates.isPrimary) {
      updatedBikes = updatedBikes.map((b) => ({
        ...b,
        isPrimary: b.bikeId === bikeId,
      }));
    }

    userService.updateCurrentUser({ bikes: updatedBikes });
    const target = updatedBikes.find((b) => b.bikeId === bikeId);
    if (!target) throw new Error('Bike not found');
    return target;
  },

  deleteBike(userId: string, bikeId: string): void {
    const user = userService.getUserProfile(userId);
    if (!user) return;

    const remaining = user.bikes.filter((b) => b.bikeId !== bikeId);
    if (remaining.length > 0 && !remaining.some((b) => b.isPrimary)) {
      remaining[0].isPrimary = true;
    }

    userService.updateCurrentUser({ bikes: remaining });
  },

  setPrimaryBike(userId: string, bikeId: string): void {
    this.updateBike(userId, bikeId, { isPrimary: true });
  },
};
