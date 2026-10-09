import {
  ApplyModerationParams,
  ChatMessage,
  ChatReport,
  ChatUser,
  ModerationAction,
  PresenceRider,
  PresenceState,
  TypingUser,
  UserModerationStatus,
} from '../types';
import {
  IChatAdapter,
  ReportMessageParams,
  SendMessageParams,
} from './chat-adapter.interface';
import { DEMO_PERSONAS } from '../constants/demo-personas';

const STORAGE_MESSAGES_KEY_PREFIX = 'motocompanion_chat_messages_';
const STORAGE_REPORTS_KEY = 'motocompanion_chat_reports';
const STORAGE_MODERATION_ACTIONS_KEY = 'motocompanion_chat_moderation_actions';
const BROADCAST_CHANNEL_NAME = 'motocompanion_community_chat_bus';
const FLOOD_LIMIT_MS = 1500; // 1 message / 1.5 seconds
const HEARTBEAT_INTERVAL_MS = 3000;
const PRESENCE_TTL_MS = 8000;
const TYPING_TIMEOUT_MS = 2500;

type BusEvent =
  | { type: 'new_message'; message: ChatMessage }
  | { type: 'message_updated'; message: ChatMessage }
  | { type: 'presence_heartbeat'; rider: PresenceRider; roomId: string }
  | { type: 'presence_leave'; sessionTabId: string; roomId: string }
  | { type: 'typing'; user: ChatUser; sessionTabId: string; roomId: string; isTyping: boolean };

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'seed-msg-001',
    roomId: 'global-riders',
    senderId: DEMO_PERSONAS[1].id, // Priya
    senderName: DEMO_PERSONAS[1].name,
    senderBike: DEMO_PERSONAS[1].bike,
    content: 'Morning riders! Just reached Kunigal bypass on NH75. Road is smooth, but watch for speed breakers right after the toll gate.',
    createdAt: Date.now() - 1000 * 60 * 25,
    isDeleted: false,
  },
  {
    id: 'seed-msg-002',
    roomId: 'global-riders',
    senderId: DEMO_PERSONAS[2].id, // Vikram
    senderName: DEMO_PERSONAS[2].name,
    senderBike: DEMO_PERSONAS[2].bike,
    content: 'Thanks Priya! Rolling out from Nelamangala on the 650 now. Meeting up near Swathi Delicacy for breakfast in about 35 mins if anyone is around.',
    createdAt: Date.now() - 1000 * 60 * 18,
    isDeleted: false,
  },
  {
    id: 'seed-msg-003',
    roomId: 'global-riders',
    senderId: DEMO_PERSONAS[0].id, // Arjun
    senderName: DEMO_PERSONAS[0].name,
    senderBike: DEMO_PERSONAS[0].bike,
    content: 'Heading towards Mudigere pass shortly on the Himalayan. Keep a lookout for wet gravel on hairpin #4 if anyone is doing the ghat section.',
    createdAt: Date.now() - 1000 * 60 * 8,
    isDeleted: false,
  },
];

export class MockTabChatAdapter implements IChatAdapter {
  private sessionTabId: string;
  private channel: BroadcastChannel | null = null;
  private messageListeners: Map<string, Set<(msg: ChatMessage) => void>> = new Map();
  private messageUpdateListeners: Map<string, Set<(msg: ChatMessage) => void>> = new Map();
  private presenceListeners: Map<string, Set<(p: PresenceState) => void>> = new Map();
  private typingListeners: Map<string, Set<(t: TypingUser[]) => void>> = new Map();

  // Active in-memory presence registry for this tab
  private activePresenceRiders: Map<string, PresenceRider> = new Map();
  private activeTypingUsers: Map<string, TypingUser> = new Map();
  private currentPresenceUser: ChatUser | null = null;
  private currentRoomId: string | null = null;
  private heartbeatTimer: any = null;
  private sweepTimer: any = null;
  private typingPruneTimer: any = null;
  private lastSentTime: number = 0;

  // Static shared storage for mock reports and moderation actions
  private static inMemoryReports: ChatReport[] = [];
  private static inMemoryModerationActions: ModerationAction[] = [];
  private static inMemoryMessages: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.sessionTabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.initBroadcastChannel();
    this.initWindowListeners();
  }

  public getSessionTabId(): string {
    return this.sessionTabId;
  }

  private initBroadcastChannel(): void {
    const BC =
      (typeof window !== 'undefined' && (window as any).BroadcastChannel) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).BroadcastChannel);
    if (BC) {
      this.channel = new BC(BROADCAST_CHANNEL_NAME);
      if (this.channel) {
        this.channel.onmessage = (event: MessageEvent<BusEvent>) => {
          this.handleBusEvent(event.data);
        };
      }
    }
  }

  private initWindowListeners(): void {
    if (typeof window === 'undefined') return;

    // Cleanly announce departure on tab unload
    window.addEventListener('beforeunload', () => {
      if (this.currentRoomId) {
        this.postBusEvent({
          type: 'presence_leave',
          sessionTabId: this.sessionTabId,
          roomId: this.currentRoomId,
        });
      }
    });

    // Fallback storage listener in case BroadcastChannel is not supported
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(STORAGE_MESSAGES_KEY_PREFIX)) {
        const roomId = e.key.replace(STORAGE_MESSAGES_KEY_PREFIX, '');
        const updated = this.readMessagesFromStorage(roomId);
        const lastMsg = updated[updated.length - 1];
        if (lastMsg) {
          this.notifyMessageListeners(roomId, lastMsg);
        }
      }
    });
  }

  private postBusEvent(event: BusEvent): void {
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }

  private handleBusEvent(event: BusEvent): void {
    if (!event || !event.type) return;

    switch (event.type) {
      case 'new_message': {
        this.notifyMessageListeners(event.message.roomId, event.message);
        break;
      }

      case 'message_updated': {
        this.notifyMessageUpdateListeners(event.message.roomId, event.message);
        break;
      }

      case 'presence_heartbeat': {
        if (event.rider.sessionTabId !== this.sessionTabId) {
          this.activePresenceRiders.set(event.rider.sessionTabId, {
            ...event.rider,
            lastHeartbeat: Date.now(),
          });
          this.notifyPresenceListeners(event.roomId);
        }
        break;
      }

      case 'presence_leave': {
        if (this.activePresenceRiders.has(event.sessionTabId)) {
          this.activePresenceRiders.delete(event.sessionTabId);
          this.notifyPresenceListeners(event.roomId);
        }
        break;
      }

      case 'typing': {
        if (event.sessionTabId !== this.sessionTabId) {
          const key = `${event.user.id}_${event.sessionTabId}`;
          if (event.isTyping) {
            this.activeTypingUsers.set(key, {
              userId: event.user.id,
              userName: event.user.name,
              sessionTabId: event.sessionTabId,
              timestamp: Date.now(),
            });
          } else {
            this.activeTypingUsers.delete(key);
          }
          this.notifyTypingListeners(event.roomId);
        }
        break;
      }
    }
  }

  // =========================================================================
  // STORAGE HELPERS
  // =========================================================================

  private getStorageKey(roomId: string): string {
    return `${STORAGE_MESSAGES_KEY_PREFIX}${roomId}`;
  }

  private readMessagesFromStorage(roomId: string): ChatMessage[] {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.getStorageKey(roomId));
        if (!raw) {
          localStorage.setItem(this.getStorageKey(roomId), JSON.stringify(INITIAL_MESSAGES));
          return INITIAL_MESSAGES;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return INITIAL_MESSAGES;
      }
    }
    if (!MockTabChatAdapter.inMemoryMessages.has(roomId)) {
      MockTabChatAdapter.inMemoryMessages.set(roomId, [...INITIAL_MESSAGES]);
    }
    return MockTabChatAdapter.inMemoryMessages.get(roomId) || [];
  }

  private writeMessagesToStorage(roomId: string, messages: ChatMessage[]): void {
    MockTabChatAdapter.inMemoryMessages.set(roomId, messages);
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(roomId), JSON.stringify(messages));
      } catch (e) {
        console.error('[MockTabChatAdapter] Failed to save messages to localStorage', e);
      }
    }
  }

  private readReportsFromStorage(): ChatReport[] {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.error('[MockTabChatAdapter] Failed to read reports from storage', e);
      }
    }
    return MockTabChatAdapter.inMemoryReports;
  }

  private writeReportsToStorage(reports: ChatReport[]): void {
    MockTabChatAdapter.inMemoryReports = reports;
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
      } catch (e) {
        console.error('[MockTabChatAdapter] Failed to write reports to storage', e);
      }
    }
  }

  private readModerationActionsFromStorage(): ModerationAction[] {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_MODERATION_ACTIONS_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.error('[MockTabChatAdapter] Failed to read mod actions from storage', e);
      }
    }
    return MockTabChatAdapter.inMemoryModerationActions;
  }

  private writeModerationActionsToStorage(actions: ModerationAction[]): void {
    MockTabChatAdapter.inMemoryModerationActions = actions;
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_MODERATION_ACTIONS_KEY, JSON.stringify(actions));
      } catch (e) {
        console.error('[MockTabChatAdapter] Failed to write mod actions to storage', e);
      }
    }
  }

  // =========================================================================
  // IChatAdapter Implementation
  // =========================================================================

  public async fetchHistory(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const messages = this.readMessagesFromStorage(roomId);
    return messages.slice(-limit);
  }

  public async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    const trimmed = params.content.trim();

    // Validation 1: Min & Max length
    if (!trimmed || trimmed.length === 0) {
      throw new Error('Message cannot be empty.');
    }
    if (trimmed.length > 1000) {
      throw new Error('Message exceeds the 1,000 character limit.');
    }

    // Validation 2: Moderation enforcement check (active ban, suspend, mute)
    // Priority: Banned/muted/suspended users receive moderation reason regardless of cooldown
    const modStatus = await this.checkUserModerationStatus(params.sender.id);
    if (modStatus.isBanned) {
      throw new Error(`Rider transmission blocked: This account is permanently banned from Community Chat. Reason: ${modStatus.activeAction?.reason || 'Violation of community safety guidelines'}`);
    }
    if (modStatus.isSuspended) {
      const expDate = modStatus.activeAction?.expiresAt ? new Date(modStatus.activeAction.expiresAt).toLocaleTimeString() : 'specified time';
      throw new Error(`Rider transmission blocked: This account is suspended from Community Chat until ${expDate}. Reason: ${modStatus.activeAction?.reason || 'Violation of community safety guidelines'}`);
    }
    if (modStatus.isMuted) {
      const expDate = modStatus.activeAction?.expiresAt ? new Date(modStatus.activeAction.expiresAt).toLocaleTimeString() : 'specified time';
      throw new Error(`Rider transmission blocked: This account is temporarily muted until ${expDate}. Reason: ${modStatus.activeAction?.reason || 'Violation of community safety guidelines'}`);
    }

    // Validation 3: Flood control
    const now = Date.now();
    if (now - this.lastSentTime < FLOOD_LIMIT_MS) {
      const waitTime = Math.ceil((FLOOD_LIMIT_MS - (now - this.lastSentTime)) / 1000);
      throw new Error(`Rider cooldown: please wait ${waitTime}s before sending another message.`);
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      roomId: params.roomId,
      senderId: params.sender.id,
      senderName: params.sender.name,
      senderBike: params.sender.bike,
      senderAvatarUrl: params.sender.avatarUrl,
      content: trimmed,
      createdAt: now,
      isDeleted: false,
    };

    // Save locally
    const existing = this.readMessagesFromStorage(params.roomId);
    const updated = [...existing, newMessage];
    this.writeMessagesToStorage(params.roomId, updated);

    this.lastSentTime = now;

    // Broadcast to other tabs
    this.postBusEvent({
      type: 'new_message',
      message: newMessage,
    });

    // Notify current tab listeners
    this.notifyMessageListeners(params.roomId, newMessage);

    // Stop typing indication on send
    this.sendTyping(params.roomId, params.sender, false);

    return newMessage;
  }

  public async deleteMessage(roomId: string, messageId: string, senderId: string): Promise<boolean> {
    const messages = this.readMessagesFromStorage(roomId);
    const targetIdx = messages.findIndex((m) => m.id === messageId);

    if (targetIdx === -1) {
      throw new Error('Message not found.');
    }

    const targetMessage = messages[targetIdx];
    if (targetMessage.senderId !== senderId) {
      throw new Error('Permission denied: You can only delete your own messages.');
    }

    if (targetMessage.isDeleted) {
      return true; // Already deleted
    }

    const updatedMessage: ChatMessage = {
      ...targetMessage,
      isDeleted: true,
      deletedAt: Date.now(),
    };

    messages[targetIdx] = updatedMessage;
    this.writeMessagesToStorage(roomId, messages);

    // Broadcast update to other tabs
    this.postBusEvent({
      type: 'message_updated',
      message: updatedMessage,
    });

    // Notify current tab
    this.notifyMessageUpdateListeners(roomId, updatedMessage);

    return true;
  }

  public async reportMessage(params: ReportMessageParams): Promise<ChatReport> {
    const report: ChatReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      messageId: params.messageId,
      reporterId: params.reporterId,
      reason: params.reason,
      details: params.details || '',
      createdAt: Date.now(),
      status: 'pending',
    };

    const reports = this.readReportsFromStorage();
    reports.push(report);
    this.writeReportsToStorage(reports);

    return report;
  }

  public async fetchReports(status?: ChatReport['status']): Promise<ChatReport[]> {
    const reports = this.readReportsFromStorage();
    if (status) {
      return reports.filter((r) => r.status === status);
    }
    return [...reports].sort((a, b) => b.createdAt - a.createdAt);
  }

  public async fetchModerationActions(targetUserId?: string): Promise<ModerationAction[]> {
    const actions = this.readModerationActionsFromStorage();
    if (targetUserId) {
      return actions.filter((a) => a.targetUserId === targetUserId);
    }
    return [...actions].sort((a, b) => b.createdAt - a.createdAt);
  }

  public async applyModerationAction(params: ApplyModerationParams): Promise<ModerationAction> {
    const expiresAt =
      params.durationSeconds && params.durationSeconds > 0
        ? Date.now() + params.durationSeconds * 1000
        : undefined;

    const action: ModerationAction = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      reportId: params.reportId,
      targetUserId: params.targetUserId,
      moderatorId: params.moderatorId,
      actionType: params.actionType,
      reason: params.reason,
      notes: params.notes,
      createdAt: Date.now(),
      expiresAt,
    };

    const actions = this.readModerationActionsFromStorage();
    actions.unshift(action);
    this.writeModerationActionsToStorage(actions);

    // If linked to a report, update report status
    if (params.reportId) {
      const reports = this.readReportsFromStorage();
      const report = reports.find((r) => r.id === params.reportId);
      if (report) {
        report.status = params.actionType === 'dismiss' ? 'dismissed' : 'reviewed';
        report.moderationActionId = action.id;
        this.writeReportsToStorage(reports);
      }
    }

    return action;
  }

  public async checkUserModerationStatus(userId: string): Promise<UserModerationStatus> {
    const actions = this.readModerationActionsFromStorage();
    const now = Date.now();

    // Find active actions for this user (not expired)
    const activeActions = actions.filter(
      (a) => a.targetUserId === userId && (!a.expiresAt || a.expiresAt > now)
    );

    const isBanned = activeActions.some((a) => a.actionType === 'ban');
    const isSuspended = activeActions.some((a) => a.actionType === 'suspend');
    const isMuted = activeActions.some((a) => a.actionType === 'mute');

    // Pick the most restrictive active action
    const activeAction =
      activeActions.find((a) => a.actionType === 'ban') ||
      activeActions.find((a) => a.actionType === 'suspend') ||
      activeActions.find((a) => a.actionType === 'mute');

    return {
      isBanned,
      isSuspended,
      isMuted,
      activeAction,
    };
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  public subscribeToMessages(
    roomId: string,
    onNewMessage: (msg: ChatMessage) => void,
    onMessageUpdate: (msg: ChatMessage) => void
  ): () => void {
    if (!this.messageListeners.has(roomId)) {
      this.messageListeners.set(roomId, new Set());
    }
    if (!this.messageUpdateListeners.has(roomId)) {
      this.messageUpdateListeners.set(roomId, new Set());
    }

    this.messageListeners.get(roomId)!.add(onNewMessage);
    this.messageUpdateListeners.get(roomId)!.add(onMessageUpdate);

    return () => {
      this.messageListeners.get(roomId)?.delete(onNewMessage);
      this.messageUpdateListeners.get(roomId)?.delete(onMessageUpdate);
    };
  }

  public subscribeToPresence(
    roomId: string,
    onPresenceChange: (presence: PresenceState) => void
  ): () => void {
    if (!this.presenceListeners.has(roomId)) {
      this.presenceListeners.set(roomId, new Set());
    }

    this.presenceListeners.get(roomId)!.add(onPresenceChange);

    // Initial presence push
    onPresenceChange(this.computePresenceState());

    return () => {
      this.presenceListeners.get(roomId)?.delete(onPresenceChange);
    };
  }

  public subscribeToTyping(
    roomId: string,
    onTypingChange: (typingUsers: TypingUser[]) => void
  ): () => void {
    if (!this.typingListeners.has(roomId)) {
      this.typingListeners.set(roomId, new Set());
    }

    this.typingListeners.get(roomId)!.add(onTypingChange);

    return () => {
      this.typingListeners.get(roomId)?.delete(onTypingChange);
    };
  }

  // =========================================================================
  // PRESENCE & TYPING HEARTBEATS
  // =========================================================================

  public startPresence(roomId: string, user: ChatUser): void {
    this.currentRoomId = roomId;
    this.currentPresenceUser = user;

    // Register self in local presence registry
    const selfRider: PresenceRider = {
      sessionTabId: this.sessionTabId,
      user,
      onlineAt: Date.now(),
      lastHeartbeat: Date.now(),
    };
    this.activePresenceRiders.set(this.sessionTabId, selfRider);

    // Broadcast self heartbeat immediately
    this.broadcastHeartbeat();

    // Start periodic heartbeat
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.broadcastHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // Start stale presence sweeper
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.sweepTimer = setInterval(() => {
      this.sweepStalePresence(roomId);
    }, 2000);

    // Start typing prune timer
    if (this.typingPruneTimer) clearInterval(this.typingPruneTimer);
    this.typingPruneTimer = setInterval(() => {
      this.sweepStaleTyping(roomId);
    }, 1000);

    this.notifyPresenceListeners(roomId);
  }

  public stopPresence(roomId: string): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    if (this.typingPruneTimer) clearInterval(this.typingPruneTimer);

    this.activePresenceRiders.delete(this.sessionTabId);

    this.postBusEvent({
      type: 'presence_leave',
      sessionTabId: this.sessionTabId,
      roomId,
    });

    this.currentPresenceUser = null;
    this.currentRoomId = null;
    this.notifyPresenceListeners(roomId);
  }

  public sendTyping(roomId: string, user: ChatUser, isTyping: boolean): void {
    this.postBusEvent({
      type: 'typing',
      user,
      sessionTabId: this.sessionTabId,
      roomId,
      isTyping,
    });
  }

  private broadcastHeartbeat(): void {
    if (!this.currentRoomId || !this.currentPresenceUser) return;

    const selfRider: PresenceRider = {
      sessionTabId: this.sessionTabId,
      user: this.currentPresenceUser,
      onlineAt: this.activePresenceRiders.get(this.sessionTabId)?.onlineAt || Date.now(),
      lastHeartbeat: Date.now(),
    };
    this.activePresenceRiders.set(this.sessionTabId, selfRider);

    this.postBusEvent({
      type: 'presence_heartbeat',
      rider: selfRider,
      roomId: this.currentRoomId,
    });
  }

  private sweepStalePresence(roomId: string): void {
    const now = Date.now();
    let changed = false;

    for (const [tabId, rider] of this.activePresenceRiders.entries()) {
      if (tabId !== this.sessionTabId && now - rider.lastHeartbeat > PRESENCE_TTL_MS) {
        this.activePresenceRiders.delete(tabId);
        changed = true;
      }
    }

    if (changed) {
      this.notifyPresenceListeners(roomId);
    }
  }

  private sweepStaleTyping(roomId: string): void {
    const now = Date.now();
    let changed = false;

    for (const [key, user] of this.activeTypingUsers.entries()) {
      if (now - user.timestamp > TYPING_TIMEOUT_MS) {
        this.activeTypingUsers.delete(key);
        changed = true;
      }
    }

    if (changed) {
      this.notifyTypingListeners(roomId);
    }
  }

  private computePresenceState(): PresenceState {
    const riders = Array.from(this.activePresenceRiders.values());
    return {
      onlineCount: riders.length,
      riders,
    };
  }

  private notifyMessageListeners(roomId: string, message: ChatMessage): void {
    const listeners = this.messageListeners.get(roomId);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(message);
        } catch (err) {
          console.error('[MockTabChatAdapter] Error in message listener', err);
        }
      });
    }
  }

  private notifyMessageUpdateListeners(roomId: string, message: ChatMessage): void {
    const listeners = this.messageUpdateListeners.get(roomId);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(message);
        } catch (err) {
          console.error('[MockTabChatAdapter] Error in message update listener', err);
        }
      });
    }
  }

  private notifyPresenceListeners(roomId: string): void {
    const listeners = this.presenceListeners.get(roomId);
    if (listeners) {
      const state = this.computePresenceState();
      listeners.forEach((cb) => {
        try {
          cb(state);
        } catch (err) {
          console.error('[MockTabChatAdapter] Error in presence listener', err);
        }
      });
    }
  }

  private notifyTypingListeners(roomId: string): void {
    const listeners = this.typingListeners.get(roomId);
    if (listeners) {
      const active = Array.from(this.activeTypingUsers.values());
      listeners.forEach((cb) => {
        try {
          cb(active);
        } catch (err) {
          console.error('[MockTabChatAdapter] Error in typing listener', err);
        }
      });
    }
  }
}
