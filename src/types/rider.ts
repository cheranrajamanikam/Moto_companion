export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Experienced';

export type KYCStatus = 'NOT_UPLOADED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type DocumentType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENCE';

export interface KYCDocument {
  id: string;
  userId: string;
  type: DocumentType;
  documentNumber: string; // Masked demo data (e.g. XXXX-XXXX-1234)
  fileName: string;
  status: KYCStatus;
  uploadedAt: string;
}

export interface Bike {
  bikeId: string;
  userId: string;
  brand: string;
  model: string;
  engineCC: number;
  fuelType: 'Petrol' | 'Electric' | 'Hybrid';
  year: number;
  registrationNumber: string;
  image: string;
  isPrimary: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface Reputation {
  rating: number; // e.g. 4.8
  reliability: number; // e.g. 4.9
  communication: number; // e.g. 4.7
  ridingBehaviour: number; // e.g. 4.8
  totalReviews: number;
}

export interface UserStats {
  totalRides: number;
  distanceRiddenKm: number;
  completedAsRider: number;
  completedAsPillion: number;
}

export interface RideSummary {
  rideId: string;
  route: string;
  date: string;
  distanceKm: number;
  role: 'rider' | 'pillion';
  partnerName: string;
  partnerAvatar: string;
  ratingGiven?: number;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  avatar: string;
  bio: string;
  experienceLevel: ExperienceLevel;
  ridingExperienceYears: number;
  reputation: Reputation;
  badges: Badge[];
  bikes: Bike[];
  kycStatus: KYCStatus;
  kycDocuments: KYCDocument[];
  partnerPreferences: string[]; // e.g. ['interactive', 'cooperative', 'good-communication', 'punctual', 'safety-conscious']
  ridePreferences: string[]; // e.g. ['city-short', 'long-distance', 'weekend', 'casual']
  partnerDescription: string;
  stats: UserStats;
  recentRides: RideSummary[];
  emergencyContactIds: string[];
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface UserMiniProfile {
  userId: string;
  name: string;
  avatar: string;
  city: string;
  reputationScore: number; // 0-5
  badges: Badge[];
  primaryBike?: {
    model: string;
    engineCC: number;
  };
}

export interface MatchResult {
  matchId: string;
  userId: string;
  matchedUserId: string;
  matchedUser: UserProfile;
  matchRole: 'rider' | 'pillion';
  matchScore: number; // Percentage 0-100
  distanceKm: number;
  ccCompatibility: number;
  preferenceCompatibility: number;
  rideCompatibility: number;
  experienceCompatibility: number;
  reputationScore: number;
  kycVerified: boolean;
  matchReasons: string[];
}

export type RideStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Ride {
  rideId: string;
  riderId: string;
  pillionId: string | null;
  rider: UserMiniProfile;
  pillion?: UserMiniProfile | null;
  participants: UserMiniProfile[];
  startLocation: string;
  destination: string;
  route: string;
  date: string;
  time: string;
  distanceKm: number;
  riderBike?: Bike;
  status: RideStatus;
  createdAt: string;
  notes?: string;
}

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface RideRequest {
  requestId: string;
  rideId?: string;
  senderId: string;
  receiverId: string;
  sender: UserMiniProfile;
  receiver: UserMiniProfile;
  role: 'rider' | 'pillion';
  startLocation: string;
  destination: string;
  date: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
}

export type NotificationType =
  | 'MATCH'
  | 'RIDE_REQUEST'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'KYC'
  | 'RIDE'
  | 'CHAT'
  | 'SOS'
  | 'COMMUNITY'
  | 'EVENT'
  | 'SHOP';

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  organizerName: string;
  attendeesCount: number;
  image: string;
}

export interface MatchFilterOptions {
  searchQuery?: string;
  role: 'rider' | 'pillion';
  minCC?: number;
  maxCC?: number;
  maxDistanceKm?: number;
  city?: string;
  minRating?: number;
  kycOnly?: boolean;
  experienceLevel?: ExperienceLevel | 'ALL';
  ridePreferences?: string[];
  partnerPreferences?: string[];
  sortBy?: 'BEST_MATCH' | 'NEAREST' | 'HIGHEST_RATED' | 'MOST_EXPERIENCED';
}
