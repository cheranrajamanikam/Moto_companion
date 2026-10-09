import type { UserProfile, EmergencyContact } from "@/types/rider";
import { MOCK_CURRENT_USER, MOCK_USERS } from "@/data/mockData";

let currentUserState: UserProfile = { ...MOCK_CURRENT_USER };
const usersMap: Map<string, UserProfile> = new Map();

// Initialize users map
MOCK_USERS.forEach((u) => usersMap.set(u.userId, u));

export const userService = {
  getCurrentUser(): UserProfile {
    return { ...currentUserState };
  },

  updateCurrentUser(updates: Partial<UserProfile>): UserProfile {
    currentUserState = {
      ...currentUserState,
      ...updates,
    };
    usersMap.set(currentUserState.userId, currentUserState);
    return { ...currentUserState };
  },

  getUserProfile(userId: string): UserProfile | null {
    if (userId === currentUserState.userId) return { ...currentUserState };
    const u = usersMap.get(userId);
    return u ? { ...u } : null;
  },

  getAllUsers(): UserProfile[] {
    return Array.from(usersMap.values()).map((u) => ({ ...u }));
  },

  getEmergencyContacts(userId: string): EmergencyContact[] {
    return [
      {
        id: 'ec-001',
        userId,
        name: 'Suresh Sharma (Father)',
        relationship: 'Parent',
        phone: '+91 98765 00001',
      },
      {
        id: 'ec-002',
        userId,
        name: 'Neha Sharma (Sister)',
        relationship: 'Sibling',
        phone: '+91 98765 00002',
      },
    ];
  },
};
