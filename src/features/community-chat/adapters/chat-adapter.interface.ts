import {
  ApplyModerationParams,
  ChatMessage,
  ChatReport,
  ChatUser,
  ModerationAction,
  PresenceState,
  TypingUser,
  UserModerationStatus,
} from '../types';

export interface SendMessageParams {
  roomId: string;
  sender: ChatUser;
  content: string;
}

export interface ReportMessageParams {
  messageId: string;
  reporterId: string;
  reason: ChatReport['reason'];
  details?: string;
}

export interface IChatAdapter {
  /**
   * Fetch historical messages for a room (newest messages first or sorted by createdAt ascending)
   */
  fetchHistory(roomId: string, limit?: number): Promise<ChatMessage[]>;

  /**
   * Send a new message to the room.
   * Enforces 1-1000 characters and basic local flood control.
   */
  sendMessage(params: SendMessageParams): Promise<ChatMessage>;

  /**
   * Soft-delete a message. Only the message sender is permitted to delete their own message.
   */
  deleteMessage(roomId: string, messageId: string, senderId: string): Promise<boolean>;

  /**
   * File a community report against a message.
   */
  reportMessage(params: ReportMessageParams): Promise<ChatReport>;

  /**
   * Subscribe to new incoming messages and message updates (such as deletions).
   * Returns an unsubscribe cleanup function.
   */
  subscribeToMessages(
    roomId: string,
    onNewMessage: (msg: ChatMessage) => void,
    onMessageUpdate: (msg: ChatMessage) => void
  ): () => void;

  /**
   * Subscribe to presence state changes (online riders count & roster).
   * Returns an unsubscribe cleanup function.
   */
  subscribeToPresence(
    roomId: string,
    onPresenceChange: (presence: PresenceState) => void
  ): () => void;

  /**
   * Subscribe to typing indicators from other riders in the room.
   * Returns an unsubscribe cleanup function.
   */
  subscribeToTyping(
    roomId: string,
    onTypingChange: (typingUsers: TypingUser[]) => void
  ): () => void;

  /**
   * Start broadcasting presence for the current tab & user.
   */
  startPresence(roomId: string, user: ChatUser): void;

  /**
   * Stop broadcasting presence when the component unmounts or tab closes.
   */
  stopPresence(roomId: string): void;

  /**
   * Transmit a transient typing status event.
   */
  sendTyping(roomId: string, user: ChatUser, isTyping: boolean): void;

  /**
   * Retrieve the unique tab session identifier for this client instance.
   */
  getSessionTabId(): string;

  /**
   * Moderator: Fetch community reports for review.
   */
  fetchReports(status?: ChatReport['status']): Promise<ChatReport[]>;

  /**
   * Moderator: Fetch audit log of moderation decisions.
   */
  fetchModerationActions(targetUserId?: string): Promise<ModerationAction[]>;

  /**
   * Moderator: Execute a review decision (dismiss, warn, mute, suspend, ban).
   */
  applyModerationAction(params: ApplyModerationParams): Promise<ModerationAction>;

  /**
   * Check whether a given rider currently has an active mute, suspension, or ban.
   */
  checkUserModerationStatus(userId: string): Promise<UserModerationStatus>;
}

