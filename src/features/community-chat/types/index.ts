/**
 * Public participant contract for Community Chat.
 *
 * PRIVACY GUARANTEE:
 * - Contains only public identity attributes necessary for chat.
 * - Integration key with Member 2's Rider Profile system: `id` (userId).
 * - DO NOT add sensitive PII (Aadhaar, PAN, driving license, phone number, private email).
 *   Those fields are strictly owned by Member 2's Rider Profile system.
 */
export interface ChatUser {
  id: string;
  name: string;
  bike?: string;
  avatarUrl?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  /**
   * DEV / DEMO MODE ONLY: Injected persona role.
   * This is a local development convenience, NOT production authorization.
   * Member 1 will bind real authorization to verified Supabase Auth JWT claims.
   */
  role?: 'rider' | 'moderator' | 'admin';
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderBike?: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: number; // UTC timestamp ms
  isDeleted: boolean;
  deletedAt?: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  corridorName?: string;
  createdAt: number;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'false-hazard'
  | 'other';

export interface ChatReport {
  id: string;
  messageId: string;
  reporterId: string;
  reason: ReportReason;
  details?: string;
  createdAt: number;
  status: 'pending' | 'reviewed' | 'dismissed';
  moderationActionId?: string;
}

export type ModerationActionType =
  | 'dismiss'
  | 'warn'
  | 'mute'
  | 'suspend'
  | 'ban';

export interface ModerationAction {
  id: string;
  reportId?: string;
  targetUserId: string;
  moderatorId: string;
  actionType: ModerationActionType;
  reason: string;
  notes?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface UserModerationStatus {
  isMuted: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  activeAction?: ModerationAction;
}

export interface ApplyModerationParams {
  moderatorId: string;
  targetUserId: string;
  actionType: ModerationActionType;
  reason: string;
  notes?: string;
  durationSeconds?: number;
  reportId?: string;
}

export interface PresenceRider {
  sessionTabId: string;
  user: ChatUser;
  onlineAt: number;
  lastHeartbeat: number;
}

export interface PresenceState {
  onlineCount: number;
  riders: PresenceRider[];
}

export interface TypingUser {
  userId: string;
  userName: string;
  sessionTabId: string;
  timestamp: number;
}

export interface TypingState {
  typingUsers: TypingUser[];
}

export type ChatBackendType = 'mock' | 'supabase';

