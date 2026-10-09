import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChatMessage,
  ChatUser,
  PresenceState,
  ReportReason,
  TypingUser,
} from '../types';
import { IChatAdapter } from '../adapters/chat-adapter.interface';
import { getChatAdapter } from '../adapters/chat-adapter.factory';
import { DEFAULT_GLOBAL_ROOM } from '../constants/demo-personas';

export interface UseCommunityChatOptions {
  currentUser: ChatUser;
  roomId?: string;
  adapter?: IChatAdapter;
}

export interface UseCommunityChatReturn {
  messages: ChatMessage[];
  onlineCount: number;
  onlineRiders: PresenceState['riders'];
  typingUsers: TypingUser[];
  isLoading: boolean;
  error: string | null;
  sessionTabId: string;
  sendMessage: (content: string) => Promise<ChatMessage | null>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  reportMessage: (messageId: string, reason: ReportReason, details?: string) => Promise<boolean>;
  setTyping: (isTyping: boolean) => void;
  clearError: () => void;
}

export function useCommunityChat({
  currentUser,
  roomId = DEFAULT_GLOBAL_ROOM.id,
  adapter,
}: UseCommunityChatOptions): UseCommunityChatReturn {
  const chatAdapter = useRef<IChatAdapter>(adapter || getChatAdapter()).current;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineRiders, setOnlineRiders] = useState<PresenceState['riders']>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeUserRef = useRef<ChatUser>(currentUser);
  activeUserRef.current = currentUser;

  const typingTimeoutRef = useRef<any>(null);

  // 1. Fetch initial message history on mount or room change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    chatAdapter
      .fetchHistory(roomId)
      .then((history) => {
        if (!isMounted) return;
        setMessages(history);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load community chat history.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [chatAdapter, roomId]);

  // 2. Subscribe to realtime messages & updates
  useEffect(() => {
    const unsubscribe = chatAdapter.subscribeToMessages(
      roomId,
      (newMsg) => {
        setMessages((prev) => {
          // Avoid duplicate insertion
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      },
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [chatAdapter, roomId]);

  // 3A. Presence room subscription (persists across persona switches, cleans up only on room unmount)
  useEffect(() => {
    const unsubscribePresence = chatAdapter.subscribeToPresence(roomId, (presence) => {
      setOnlineCount(presence.onlineCount);
      setOnlineRiders(presence.riders);
    });

    return () => {
      unsubscribePresence();
      chatAdapter.stopPresence(roomId);
    };
  }, [chatAdapter, roomId]);

  // 3B. Presence tracking for active rider (updates track payload when currentUser changes without destroying connection)
  useEffect(() => {
    chatAdapter.startPresence(roomId, currentUser);
  }, [chatAdapter, roomId, currentUser]);

  // 4. Typing indicator subscription
  useEffect(() => {
    const unsubscribeTyping = chatAdapter.subscribeToTyping(roomId, (activeTyping) => {
      // Filter out typing events from self
      const othersTyping = activeTyping.filter(
        (t) => t.userId !== activeUserRef.current.id || t.sessionTabId !== chatAdapter.getSessionTabId()
      );
      setTypingUsers(othersTyping);
    });

    return () => {
      unsubscribeTyping();
    };
  }, [chatAdapter, roomId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string): Promise<ChatMessage | null> => {
      setError(null);
      try {
        const msg = await chatAdapter.sendMessage({
          roomId,
          sender: activeUserRef.current,
          content,
        });
        if (msg) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) {
              return prev;
            }
            return [...prev, msg];
          });
        }
        return msg;
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to send message.';
        setError(errMsg);
        return null;
      }
    },
    [chatAdapter, roomId]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      setError(null);
      try {
        const success = await chatAdapter.deleteMessage(
          roomId,
          messageId,
          activeUserRef.current.id
        );
        if (success) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, isDeleted: true, deletedAt: Date.now() } : m
            )
          );
        }
        return success;
      } catch (err: any) {
        setError(err?.message || 'Failed to delete message.');
        return false;
      }
    },
    [chatAdapter, roomId]
  );

  // Report message
  const reportMessage = useCallback(
    async (messageId: string, reason: ReportReason, details?: string): Promise<boolean> => {
      setError(null);
      try {
        await chatAdapter.reportMessage({
          messageId,
          reporterId: activeUserRef.current.id,
          reason,
          details,
        });
        return true;
      } catch (err: any) {
        setError(err?.message || 'Failed to report message.');
        return false;
      }
    },
    [chatAdapter]
  );

  // Transmit typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      chatAdapter.sendTyping(roomId, activeUserRef.current, isTyping);

      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          chatAdapter.sendTyping(roomId, activeUserRef.current, false);
        }, 3000);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    },
    [chatAdapter, roomId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    onlineCount,
    onlineRiders,
    typingUsers,
    isLoading,
    error,
    sessionTabId: chatAdapter.getSessionTabId(),
    sendMessage,
    deleteMessage,
    reportMessage,
    setTyping,
    clearError,
  };
}
