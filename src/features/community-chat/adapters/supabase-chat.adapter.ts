import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
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
import { getSupabaseClient } from '../services/supabase-client';

const FLOOD_LIMIT_MS = 1500;
const TYPING_TIMEOUT_MS = 2500;

export class SupabaseChatAdapter implements IChatAdapter {
  private supabase: SupabaseClient;
  private sessionTabId: string;
  private lastSendTimestamp: Map<string, number> = new Map();

  // Active Realtime Channels
  private messageChannels: Map<string, RealtimeChannel> = new Map();
  private presenceChannels: Map<string, RealtimeChannel> = new Map();
  private typingChannels: Map<string, RealtimeChannel> = new Map();

  // Subscriptions & listeners
  private messageListeners: Map<
    string,
    Set<{ onNew: (msg: ChatMessage) => void; onUpdate: (msg: ChatMessage) => void }>
  > = new Map();
  private presenceListeners: Map<string, Set<(presence: PresenceState) => void>> = new Map();
  private typingListeners: Map<string, Set<(typing: TypingUser[]) => void>> = new Map();

  // Active typing state per room: sessionTabId -> TypingUser & timer
  private activeTypingMap: Map<
    string,
    Map<string, { user: TypingUser; timer: any }>
  > = new Map();

  // Tracked users & debounced teardown timers
  private trackedUsers: Map<string, ChatUser> = new Map();
  private presenceTeardownTimers: Map<string, any> = new Map();
  private typingTeardownTimers: Map<string, any> = new Map();
  private messageTeardownTimers: Map<string, any> = new Map();

  constructor(customClient?: SupabaseClient) {
    this.supabase = customClient || getSupabaseClient();
    this.sessionTabId = this.initSessionTabId();

    // Clean untrack on browser tab/window close
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('beforeunload', () => {
        this.presenceChannels.forEach((ch) => {
          try {
            ch.untrack();
          } catch {}
        });
      });
    }
  }

  /**
   * Initializes or retrieves a unique per-tab session ID from sessionStorage.
   * Distinct tabs/browsers count as distinct active connections.
   */
  private initSessionTabId(): string {
    if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
      return `node-${Math.random().toString(36).substring(2, 9)}`;
    }

    const key = 'motocompanion_session_tab_id';
    let tabId = window.sessionStorage.getItem(key);
    if (!tabId) {
      tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      window.sessionStorage.setItem(key, tabId);
    }
    return tabId;
  }

  public getSessionTabId(): string {
    return this.sessionTabId;
  }

  private safelyRemoveChannel(channel: RealtimeChannel): void {
    if (typeof this.supabase.removeChannel === 'function') {
      this.supabase.removeChannel(channel);
    } else if (typeof (channel as any).unsubscribe === 'function') {
      (channel as any).unsubscribe();
    }
  }

  /**
   * Maps a raw database row to our typed ChatMessage model.
   */
  private mapRowToChatMessage(row: any): ChatMessage {
    return {
      id: String(row.id),
      roomId: String(row.room_id),
      senderId: String(row.sender_id),
      senderName: String(row.sender_name),
      senderBike: row.sender_bike || undefined,
      senderAvatarUrl: row.sender_avatar_url || undefined,
      content: String(row.content),
      createdAt:
        typeof row.created_at === 'number'
          ? row.created_at
          : new Date(row.created_at).getTime(),
      isDeleted: Boolean(row.is_deleted),
      deletedAt: row.deleted_at
        ? typeof row.deleted_at === 'number'
          ? row.deleted_at
          : new Date(row.deleted_at).getTime()
        : undefined,
    };
  }

  /**
   * 1. Fetch message history for a given room.
   */
  async fetchHistory(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[CommunityChat:Supabase] fetchHistory failed:', error);
      throw new Error(`Failed to load chat history: ${error.message}`);
    }

    return (data || []).map((row) => this.mapRowToChatMessage(row));
  }

  /**
   * 2. Send a new message.
   * Enforces 1-1000 chars, empty prevention, and 1.5s client-side flood control.
   */
  async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    const trimmed = params.content.trim();
    if (!trimmed) {
      throw new Error('Message content cannot be empty.');
    }

    if (params.content.length > 1000) {
      throw new Error('Message exceeds 1000 characters limit.');
    }

    // Enforcement: Check active ban, suspension, or mute
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

    // Client-side flood protection (1.5s window)
    const now = Date.now();
    const lastSend = this.lastSendTimestamp.get(params.sender.id) || 0;
    if (now - lastSend < FLOOD_LIMIT_MS) {
      throw new Error('Rider transmission throttled. Please wait 1.5s between messages.');
    }
    this.lastSendTimestamp.set(params.sender.id, now);

    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        room_id: params.roomId,
        sender_id: params.sender.id,
        sender_name: params.sender.name,
        sender_bike: params.sender.bike || null,
        sender_avatar_url: params.sender.avatarUrl || null,
        content: trimmed,
      })
      .select()
      .single();

    if (error) {
      console.error('[CommunityChat:Supabase] sendMessage failed:', error);
      if (error.message && error.message.includes('Rider transmission blocked')) {
        throw new Error(error.message);
      }
      throw new Error(`Failed to transmit message: ${error.message}`);
    }

    console.log('[CommunityChat:Supabase] Message inserted successfully:', data.id);
    return this.mapRowToChatMessage(data);
  }

  /**
   * 3. Soft-delete a message.
   * Calls the database stored procedure `soft_delete_chat_message` to enforce
   * ownership verification directly in PostgreSQL.
   */
  async deleteMessage(_roomId: string, messageId: string, senderId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('soft_delete_chat_message', {
      p_message_id: messageId,
      p_sender_id: senderId,
    });

    if (error) {
      console.error('[CommunityChat:Supabase] deleteMessage RPC failed:', error);
      throw new Error(`Failed to delete message: ${error.message}`);
    }

    if (data === false) {
      throw new Error('Deletion rejected: Message does not exist or was sent by another rider.');
    }

    console.log('[CommunityChat:Supabase] Message soft-deleted via RPC:', messageId);
    return true;
  }

  /**
   * 4. File a community report against a message.
   */
  async reportMessage(params: ReportMessageParams): Promise<ChatReport> {
    const reportId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
    const now = Date.now();

    const { error } = await this.supabase
      .from('chat_reports')
      .insert({
        id: reportId,
        message_id: params.messageId,
        reporter_id: params.reporterId,
        reason: params.reason,
        details: params.details || null,
        status: 'pending',
      });

    if (error) {
      console.error('[CommunityChat:Supabase] reportMessage failed:', error);
      throw new Error(`Failed to submit report: ${error.message}`);
    }

    return {
      id: reportId,
      messageId: params.messageId,
      reporterId: params.reporterId,
      reason: params.reason,
      details: params.details || undefined,
      status: 'pending',
      createdAt: now,
    };
  }

  /**
   * 5. Realtime message subscription (Postgres Changes).
   * Scoped with sessionTabId to prevent topic conflicts and post-subscribe callback errors.
   */
  subscribeToMessages(
    roomId: string,
    onNewMessage: (msg: ChatMessage) => void,
    onMessageUpdate: (msg: ChatMessage) => void
  ): () => void {
    if (this.messageTeardownTimers.has(roomId)) {
      clearTimeout(this.messageTeardownTimers.get(roomId));
      this.messageTeardownTimers.delete(roomId);
    }

    if (!this.messageListeners.has(roomId)) {
      this.messageListeners.set(roomId, new Set());
    }
    const listener = { onNew: onNewMessage, onUpdate: onMessageUpdate };
    this.messageListeners.get(roomId)!.add(listener);

    // Initialize Supabase Realtime channel for Postgres Changes if not active
    let channel = this.messageChannels.get(roomId);
    if (channel && (channel.state === 'closed' || channel.state === 'leaving' || channel.state === 'errored')) {
      this.messageChannels.delete(roomId);
      channel = undefined;
    }

    if (!channel) {
      const channelTopic = `room:${roomId}:messages:${this.sessionTabId}`;
      console.log(`[CommunityChat:Supabase] Subscribing to messages topic: ${channelTopic}`);

      channel = this.supabase
        .channel(channelTopic)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            if (payload.new) {
              console.log('[CommunityChat:Supabase] Realtime INSERT received:', payload.new.id, payload.new.sender_name);
              const msg = this.mapRowToChatMessage(payload.new);
              const listeners = this.messageListeners.get(roomId);
              listeners?.forEach((l) => l.onNew(msg));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            if (payload.new) {
              console.log('[CommunityChat:Supabase] Realtime UPDATE received:', payload.new.id, 'is_deleted:', payload.new.is_deleted);
              const msg = this.mapRowToChatMessage(payload.new);
              const listeners = this.messageListeners.get(roomId);
              listeners?.forEach((l) => l.onUpdate(msg));
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`[CommunityChat:Supabase] Messages channel status (${roomId}):`, status, err || '');
          if (status === 'CHANNEL_ERROR') {
            console.error(`[CommunityChat:Supabase] Messages channel error in room: ${roomId}`, err);
          }
        });

      this.messageChannels.set(roomId, channel);
    }

    return () => {
      const listeners = this.messageListeners.get(roomId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.messageListeners.delete(roomId);
          this.scheduleMessageTeardown(roomId);
        }
      }
    };
  }

  private scheduleMessageTeardown(roomId: string): void {
    if (this.messageTeardownTimers.has(roomId)) {
      clearTimeout(this.messageTeardownTimers.get(roomId));
    }
    const timer = setTimeout(() => {
      this.messageTeardownTimers.delete(roomId);
      const listeners = this.messageListeners.get(roomId);
      if (!listeners || listeners.size === 0) {
        const channel = this.messageChannels.get(roomId);
        if (channel) {
          console.log(`[CommunityChat:Supabase] Removing messages channel for room: ${roomId}`);
          this.safelyRemoveChannel(channel);
          this.messageChannels.delete(roomId);
        }
      }
    }, 2500);
    this.messageTeardownTimers.set(roomId, timer);
  }

  /**
   * Helper to initialize or retrieve the RealtimeChannel for room presence.
   * Ensures channel handlers are attached BEFORE calling .subscribe().
   * Unique sessionTabId is used as presence key so tabs/browsers have dedicated presence slots.
   */
  private getOrCreatePresenceChannel(roomId: string): RealtimeChannel {
    const topic = `room:${roomId}:presence`;
    let channel = this.presenceChannels.get(roomId);

    // If channel was marked leaving or closed, drop the reference to recreate fresh
    if (channel && (channel.state === 'closed' || channel.state === 'leaving' || channel.state === 'errored')) {
      console.log(`[CommunityChat:Supabase] Discarding inactive presence channel (${channel.state})`);
      this.presenceChannels.delete(roomId);
      channel = undefined;
    }

    if (!channel) {
      console.log(`[CommunityChat:Supabase] Initializing presence channel: ${topic}`);
      channel = this.supabase.channel(topic, {
        config: {
          presence: {
            key: this.sessionTabId,
          },
        },
      });

      const handlePresenceUpdate = (event: 'sync' | 'join' | 'leave', payload?: any) => {
        if (event === 'join') {
          console.log('[CommunityChat:Supabase] Presence join', payload);
        } else if (event === 'leave') {
          console.log('[CommunityChat:Supabase] Presence leave', payload);
        }

        const state = channel!.presenceState();
        console.log('[CommunityChat:Supabase] Presence state', state);

        const riders: PresenceRider[] = [];
        const seenTabs = new Set<string>();

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (Array.isArray(presences)) {
            presences.forEach((p) => {
              const tabId = p.sessionTabId || key;
              if (!seenTabs.has(tabId) && p.user) {
                seenTabs.add(tabId);
                riders.push({
                  sessionTabId: tabId,
                  user: p.user,
                  onlineAt: p.onlineAt || Date.now(),
                  lastHeartbeat: p.lastHeartbeat || Date.now(),
                });
              }
            });
          }
        });

        const onlineCount = Math.max(1, riders.length);
        console.log('[CommunityChat:Supabase] Online count', onlineCount);

        const presencePayload: PresenceState = {
          onlineCount,
          riders,
        };

        const listeners = this.presenceListeners.get(roomId);
        listeners?.forEach((cb) => cb(presencePayload));
      };

      channel
        .on('presence', { event: 'sync' }, () => handlePresenceUpdate('sync'))
        .on('presence', { event: 'join' }, (p) => handlePresenceUpdate('join', p))
        .on('presence', { event: 'leave' }, (p) => handlePresenceUpdate('leave', p))
        .subscribe(async (status, err) => {
          console.log(`[CommunityChat:Supabase] Presence channel status (${roomId}):`, status, err || '');
          if (status === 'SUBSCRIBED') {
            console.log('[CommunityChat:Supabase] Presence subscribed', roomId);
            const user = this.trackedUsers.get(roomId);
            if (user) {
              try {
                await channel!.track({
                  sessionTabId: this.sessionTabId,
                  user,
                  onlineAt: Date.now(),
                  lastHeartbeat: Date.now(),
                });
                console.log(`[CommunityChat:Supabase] Tracked presence: ${user.name} (${this.sessionTabId})`);
              } catch (trackErr) {
                console.error('[CommunityChat:Supabase] Failed to track presence:', trackErr);
              }
            }
          }
        });

      this.presenceChannels.set(roomId, channel);
    }

    return channel;
  }

  /**
   * 6. Realtime Presence tracking for the active rider identity.
   * If channel is already subscribed, tracks the new payload immediately.
   * If channel is subscribing, stores user so 'SUBSCRIBED' handler tracks it.
   */
  startPresence(roomId: string, user: ChatUser): void {
    this.trackedUsers.set(roomId, user);

    // Cancel any pending teardown timer
    if (this.presenceTeardownTimers.has(roomId)) {
      clearTimeout(this.presenceTeardownTimers.get(roomId));
      this.presenceTeardownTimers.delete(roomId);
    }

    const channel = this.getOrCreatePresenceChannel(roomId);

    if (channel.state === 'joined') {
      channel
        .track({
          sessionTabId: this.sessionTabId,
          user,
          onlineAt: Date.now(),
          lastHeartbeat: Date.now(),
        })
        .then(() => {
          console.log(`[CommunityChat:Supabase] Tracked presence: ${user.name} (${this.sessionTabId})`);
        })
        .catch((err) => {
          console.error('[CommunityChat:Supabase] Failed to track presence:', err);
        });
    }
  }

  stopPresence(roomId: string): void {
    const listeners = this.presenceListeners.get(roomId);
    if (listeners && listeners.size > 0) {
      // Do not untrack if active listeners are still mounted
      return;
    }
    this.schedulePresenceTeardown(roomId);
  }

  subscribeToPresence(
    roomId: string,
    onPresenceChange: (presence: PresenceState) => void
  ): () => void {
    // Cancel any pending teardown timer
    if (this.presenceTeardownTimers.has(roomId)) {
      clearTimeout(this.presenceTeardownTimers.get(roomId));
      this.presenceTeardownTimers.delete(roomId);
    }

    if (!this.presenceListeners.has(roomId)) {
      this.presenceListeners.set(roomId, new Set());
    }
    this.presenceListeners.get(roomId)!.add(onPresenceChange);

    // Ensure channel is initialized and subscribed BEFORE track()
    const channel = this.getOrCreatePresenceChannel(roomId);

    // If channel already has presence state, dispatch immediately to new listener
    if (channel.state === 'joined') {
      const state = channel.presenceState();
      const riders: PresenceRider[] = [];
      const seenTabs = new Set<string>();

      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        if (Array.isArray(presences)) {
          presences.forEach((p) => {
            const tabId = p.sessionTabId || key;
            if (!seenTabs.has(tabId) && p.user) {
              seenTabs.add(tabId);
              riders.push({
                sessionTabId: tabId,
                user: p.user,
                onlineAt: p.onlineAt || Date.now(),
                lastHeartbeat: p.lastHeartbeat || Date.now(),
              });
            }
          });
        }
      });

      if (riders.length > 0) {
        onPresenceChange({
          onlineCount: Math.max(1, riders.length),
          riders,
        });
      }
    }

    return () => {
      const listeners = this.presenceListeners.get(roomId);
      if (listeners) {
        listeners.delete(onPresenceChange);
        if (listeners.size === 0) {
          this.presenceListeners.delete(roomId);
          this.schedulePresenceTeardown(roomId);
        }
      }
    };
  }

  private schedulePresenceTeardown(roomId: string): void {
    if (this.presenceTeardownTimers.has(roomId)) {
      clearTimeout(this.presenceTeardownTimers.get(roomId));
    }

    const timer = setTimeout(() => {
      this.presenceTeardownTimers.delete(roomId);
      const listeners = this.presenceListeners.get(roomId);
      if (!listeners || listeners.size === 0) {
        const channel = this.presenceChannels.get(roomId);
        if (channel) {
          console.log(`[CommunityChat:Supabase] Removing presence channel for room: ${roomId}`);
          try {
            channel.untrack();
          } catch {}
          this.safelyRemoveChannel(channel);
          this.presenceChannels.delete(roomId);
          this.trackedUsers.delete(roomId);
        }
      }
    }, 2500);

    this.presenceTeardownTimers.set(roomId, timer);
  }

  /**
   * 7. Realtime Broadcast for typing indicator.
   * Strictly transient; typing events are never written to the database.
   */
  subscribeToTyping(
    roomId: string,
    onTypingChange: (typingUsers: TypingUser[]) => void
  ): () => void {
    if (this.typingTeardownTimers.has(roomId)) {
      clearTimeout(this.typingTeardownTimers.get(roomId));
      this.typingTeardownTimers.delete(roomId);
    }

    if (!this.typingListeners.has(roomId)) {
      this.typingListeners.set(roomId, new Set());
    }
    this.typingListeners.get(roomId)!.add(onTypingChange);

    if (!this.activeTypingMap.has(roomId)) {
      this.activeTypingMap.set(roomId, new Map());
    }

    const topic = `room:${roomId}:typing`;
    let typingChannel = this.typingChannels.get(roomId);

    if (typingChannel && (typingChannel.state === 'closed' || typingChannel.state === 'leaving' || typingChannel.state === 'errored')) {
      this.typingChannels.delete(roomId);
      typingChannel = undefined;
    }

    if (!typingChannel) {
      console.log(`[CommunityChat:Supabase] Initializing typing channel: ${topic}`);
      typingChannel = this.supabase.channel(topic);

      typingChannel
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (!payload || !payload.sessionTabId) return;
          if (payload.sessionTabId === this.sessionTabId) return;

          console.log('[CommunityChat:Supabase] Remote typing broadcast received:', payload.userName, payload.isTyping);
          const roomTyping = this.activeTypingMap.get(roomId)!;

          if (payload.isTyping) {
            const existing = roomTyping.get(payload.sessionTabId);
            if (existing?.timer) clearTimeout(existing.timer);

            const timer = setTimeout(() => {
              roomTyping.delete(payload.sessionTabId);
              this.notifyTypingListeners(roomId);
            }, TYPING_TIMEOUT_MS);

            roomTyping.set(payload.sessionTabId, {
              user: {
                userId: payload.userId,
                userName: payload.userName,
                sessionTabId: payload.sessionTabId,
                timestamp: payload.timestamp || Date.now(),
              },
              timer,
            });
          } else {
            const existing = roomTyping.get(payload.sessionTabId);
            if (existing?.timer) clearTimeout(existing.timer);
            roomTyping.delete(payload.sessionTabId);
          }

          this.notifyTypingListeners(roomId);
        })
        .subscribe((status, err) => {
          console.log(`[CommunityChat:Supabase] Typing channel status (${roomId}):`, status, err || '');
        });

      this.typingChannels.set(roomId, typingChannel);
    }

    return () => {
      const listeners = this.typingListeners.get(roomId);
      if (listeners) {
        listeners.delete(onTypingChange);
        if (listeners.size === 0) {
          this.typingListeners.delete(roomId);
          this.scheduleTypingTeardown(roomId);
        }
      }
    };
  }

  private scheduleTypingTeardown(roomId: string): void {
    if (this.typingTeardownTimers.has(roomId)) {
      clearTimeout(this.typingTeardownTimers.get(roomId));
    }
    const timer = setTimeout(() => {
      this.typingTeardownTimers.delete(roomId);
      const listeners = this.typingListeners.get(roomId);
      if (!listeners || listeners.size === 0) {
        const channel = this.typingChannels.get(roomId);
        if (channel) {
          console.log(`[CommunityChat:Supabase] Removing typing channel for room: ${roomId}`);
          this.safelyRemoveChannel(channel);
          this.typingChannels.delete(roomId);
        }
        const roomTyping = this.activeTypingMap.get(roomId);
        if (roomTyping) {
          roomTyping.forEach((t) => clearTimeout(t.timer));
          this.activeTypingMap.delete(roomId);
        }
      }
    }, 2500);
    this.typingTeardownTimers.set(roomId, timer);
  }

  sendTyping(roomId: string, user: ChatUser, isTyping: boolean): void {
    const topic = `room:${roomId}:typing`;
    let channel = this.typingChannels.get(roomId);

    if (!channel || channel.state === 'closed' || channel.state === 'leaving') {
      channel = this.supabase.channel(topic).subscribe();
      this.typingChannels.set(roomId, channel);
    }

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        userName: user.name,
        sessionTabId: this.sessionTabId,
        isTyping,
        timestamp: Date.now(),
      },
    });
  }

  private notifyTypingListeners(roomId: string): void {
    const roomTyping = this.activeTypingMap.get(roomId);
    const activeUsers: TypingUser[] = [];
    if (roomTyping) {
      roomTyping.forEach((item) => activeUsers.push(item.user));
    }

    const listeners = this.typingListeners.get(roomId);
    listeners?.forEach((cb) => cb(activeUsers));
  }

  /**
   * 8. Fetch community reports for moderator review.
   */
  async fetchReports(status?: ChatReport['status']): Promise<ChatReport[]> {
    // 1. Try secure RPC function (SECURITY DEFINER for moderator review)
    try {
      const { data: rpcData, error: rpcError } = await this.supabase.rpc('get_chat_reports', {
        p_status: status || null,
        p_limit: 100,
      });

      if (!rpcError && Array.isArray(rpcData)) {
        return rpcData.map((row: any) => ({
          id: String(row.id),
          messageId: String(row.message_id),
          reporterId: String(row.reporter_id),
          reason: row.reason,
          details: row.details || undefined,
          status: row.status,
          createdAt: new Date(row.created_at).getTime(),
          moderationActionId: row.moderation_action_id ? String(row.moderation_action_id) : undefined,
        }));
      }
    } catch {
      // Fall through to direct table query
    }

    // 2. Fallback to direct table query if RPC is not yet registered
    let query = this.supabase
      .from('chat_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[CommunityChat:Supabase] fetchReports failed:', error);
      throw new Error(`Failed to load reports: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: String(row.id),
      messageId: String(row.message_id),
      reporterId: String(row.reporter_id),
      reason: row.reason,
      details: row.details || undefined,
      status: row.status,
      createdAt: new Date(row.created_at).getTime(),
      moderationActionId: row.moderation_action_id ? String(row.moderation_action_id) : undefined,
    }));
  }

  /**
   * 9. Fetch moderation actions audit log.
   */
  async fetchModerationActions(targetUserId?: string): Promise<ModerationAction[]> {
    let query = this.supabase
      .from('chat_moderation_actions')
      .select('*')
      .order('created_at', { ascending: false });

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[CommunityChat:Supabase] fetchModerationActions failed:', error);
      // Return empty array gracefully if table is not yet created
      return [];
    }

    return (data || []).map((row) => ({
      id: String(row.id),
      reportId: row.report_id ? String(row.report_id) : undefined,
      targetUserId: String(row.target_user_id),
      moderatorId: String(row.moderator_id),
      actionType: row.action_type,
      reason: String(row.reason),
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
    }));
  }

  /**
   * 10. Execute a moderation action.
   * Invokes stored procedure `apply_moderation_action` or falls back to direct insert.
   */
  async applyModerationAction(params: ApplyModerationParams): Promise<ModerationAction> {
    // Attempt RPC first
    const { data: rpcData, error: rpcError } = await this.supabase.rpc('apply_moderation_action', {
      p_moderator_id: params.moderatorId,
      p_target_user_id: params.targetUserId,
      p_action_type: params.actionType,
      p_reason: params.reason,
      p_notes: params.notes || null,
      p_duration_seconds: params.durationSeconds || null,
      p_report_id: params.reportId || null,
    });

    if (!rpcError && rpcData) {
      return {
        id: String(rpcData.id),
        reportId: rpcData.reportId ? String(rpcData.reportId) : undefined,
        targetUserId: String(rpcData.targetUserId),
        moderatorId: String(rpcData.moderatorId),
        actionType: rpcData.actionType,
        reason: String(rpcData.reason),
        notes: rpcData.notes || undefined,
        createdAt: typeof rpcData.createdAt === 'number' ? rpcData.createdAt : Date.now(),
        expiresAt: rpcData.expiresAt ? (typeof rpcData.expiresAt === 'number' ? rpcData.expiresAt : new Date(rpcData.expiresAt).getTime()) : undefined,
      };
    }

    // Direct fallback if RPC is not available in pre-auth mode
    const expiresAt =
      params.durationSeconds && params.durationSeconds > 0
        ? new Date(Date.now() + params.durationSeconds * 1000).toISOString()
        : null;

    const { data, error } = await this.supabase
      .from('chat_moderation_actions')
      .insert({
        report_id: params.reportId || null,
        target_user_id: params.targetUserId,
        moderator_id: params.moderatorId,
        action_type: params.actionType,
        reason: params.reason,
        notes: params.notes || null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('[CommunityChat:Supabase] applyModerationAction failed:', error);
      throw new Error(`Failed to apply moderation decision: ${error.message}`);
    }

    if (params.reportId) {
      await this.supabase
        .from('chat_reports')
        .update({
          status: params.actionType === 'dismiss' ? 'dismissed' : 'reviewed',
          moderation_action_id: data.id,
        })
        .eq('id', params.reportId);
    }

    return {
      id: String(data.id),
      reportId: data.report_id ? String(data.report_id) : undefined,
      targetUserId: String(data.target_user_id),
      moderatorId: String(data.moderator_id),
      actionType: data.action_type,
      reason: String(data.reason),
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at).getTime(),
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
    };
  }

  /**
   * 11. Check whether a given rider currently has an active mute, suspension, or ban.
   */
  async checkUserModerationStatus(userId: string): Promise<UserModerationStatus> {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('chat_moderation_actions')
        .select('*')
        .eq('target_user_id', userId)
        .in('action_type', ['ban', 'suspend', 'mute'])
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return { isBanned: false, isSuspended: false, isMuted: false };
      }

      const isBanned = data.some((r) => r.action_type === 'ban');
      const isSuspended = data.some((r) => r.action_type === 'suspend');
      const isMuted = data.some((r) => r.action_type === 'mute');

      const primary =
        data.find((r) => r.action_type === 'ban') ||
        data.find((r) => r.action_type === 'suspend') ||
        data.find((r) => r.action_type === 'mute');

      return {
        isBanned,
        isSuspended,
        isMuted,
        activeAction: primary
          ? {
              id: String(primary.id),
              reportId: primary.report_id ? String(primary.report_id) : undefined,
              targetUserId: String(primary.target_user_id),
              moderatorId: String(primary.moderator_id),
              actionType: primary.action_type,
              reason: String(primary.reason),
              notes: primary.notes || undefined,
              createdAt: new Date(primary.created_at).getTime(),
              expiresAt: primary.expires_at ? new Date(primary.expires_at).getTime() : undefined,
            }
          : undefined,
      };
    } catch {
      return { isBanned: false, isSuspended: false, isMuted: false };
    }
  }
}
