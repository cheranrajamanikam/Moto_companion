import { useState, useCallback, useRef, useEffect } from 'react';
import { AIMessage, RiderAIContext, AIStatusState, AIStatusInfo } from '../types';
import { AIProvider } from '../services/ai-provider';
import { getRiderAIProvider } from '../services/provider-factory';
import { RealAIProvider } from '../services/real-provider';

export interface UseRiderAIOptions {
  context: RiderAIContext;
  provider?: AIProvider;
  initialMessages?: AIMessage[];
}

export interface UseRiderAIReturn {
  messages: AIMessage[];
  isThinking: boolean;
  error: string | null;
  statusInfo: AIStatusInfo;
  isRateLimited: boolean;
  rateLimitSecondsRemaining: number;
  sendMessage: (query: string) => Promise<void>;
  resetConversation: () => void;
}

const STATUS_CONFIGS: Record<AIStatusState, Omit<AIStatusInfo, 'retryAfterSeconds'>> = {
  ready: {
    state: 'ready',
    label: 'Online · Ready',
    dotColor: '#10b981',
    textColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  demo: {
    state: 'demo',
    label: 'Demo Mode',
    dotColor: '#38bdf8',
    textColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  thinking: {
    state: 'thinking',
    label: 'Thinking…',
    dotColor: '#fbbf24',
    textColor: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  'rate-limited': {
    state: 'rate-limited',
    label: 'Rate Limited',
    dotColor: '#f97316',
    textColor: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  unavailable: {
    state: 'unavailable',
    label: 'AI Unavailable',
    dotColor: '#ef4444',
    textColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  'connection-error': {
    state: 'connection-error',
    label: 'Connection Error',
    dotColor: '#f43f5e',
    textColor: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
};

export const INITIAL_WELCOME_MESSAGES: AIMessage[] = [
  {
    id: 'welcome-001',
    role: 'assistant',
    content:
      "Hey! I'm your riding companion. I can help you understand your route, identify hazards, check conditions, and prepare for the ride.",
    timestamp: Date.now() - 1000 * 60 * 3,
  },
  {
    id: 'welcome-002',
    role: 'assistant',
    content:
      'I scanned your planned corridor from Bangalore to Chikmagalur (247 km). NH75 is clean up to Hassan, but note the unmarked speed breakers on the Kunigal bypass and wet gravel on Mudigere Ghat hairpin #4.',
    timestamp: Date.now() - 1000 * 60 * 2,
    structuredCards: [
      {
        type: 'route-safety',
        safetyScore: 82,
        riskLevel: 'moderate',
        riskIndicators: [
          'High-speed commercial truck corridor until Hassan junction',
          'Sudden elevation gain (+1180m) entering Mudigere pass',
          '12 technical hairpin curves with intermittent aggregate gravel',
        ],
        explanation:
          'Moderate risk corridor. Highway cruising transitions into technical mountain curves. Pre-trip readiness is recommended.',
        recommendedAction: 'Depart before 06:15 AM to beat commercial toll bottleneck.',
      },
    ],
  },
];

export function useRiderAI({
  context,
  provider,
  initialMessages = INITIAL_WELCOME_MESSAGES,
}: UseRiderAIOptions): UseRiderAIReturn {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<AIStatusState>('ready');
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);

  // Maintain provider reference, defaulting to the configured getRiderAIProvider()
  const providerRef = useRef<AIProvider>(provider || getRiderAIProvider());

  // Check server public status on mount
  useEffect(() => {
    let isMounted = true;
    if (providerRef.current instanceof RealAIProvider) {
      providerRef.current
        .checkStatus()
        .then((info) => {
          if (!isMounted) return;
          setStatusState(info.status);
          if (info.status === 'rate-limited' && info.retryAfterSeconds) {
            setRateLimitSeconds(info.retryAfterSeconds);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setStatusState('connection-error');
        });
    } else {
      setStatusState('demo');
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer for rate-limit cooldown
  useEffect(() => {
    if (rateLimitSeconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev <= 1) {
          if (providerRef.current instanceof RealAIProvider) {
            providerRef.current
              .checkStatus()
              .then((info) => setStatusState(info.status))
              .catch(() => setStatusState('connection-error'));
          } else {
            setStatusState('demo');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const sendMessage = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || isThinking || rateLimitSeconds > 0) return;

      const userMessage: AIMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsThinking(true);
      setError(null);

      try {
        const response = await providerRef.current.sendMessage(trimmed, context, messages);

        const safeText =
          typeof response?.text === 'string'
            ? response.text
            : response?.text
            ? String(response.text)
            : 'Route advisory received.';
        const safeId = response?.messageId || `asst-${Date.now()}`;
        const safeCards = Array.isArray(response?.cards) ? response.cards : [];

        const assistantMessage: AIMessage = {
          id: safeId,
          role: 'assistant',
          content: safeText,
          timestamp: Date.now(),
          structuredCards: safeCards,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStatusState(statusState === 'demo' ? 'demo' : 'ready');
      } catch (err: any) {
        if (err?.isRateLimited || err?.statusCode === 429) {
          setStatusState('rate-limited');
          const waitSec = err?.retryAfterSeconds || 60;
          setRateLimitSeconds(waitSec);
        } else if (
          err?.isConfigError ||
          err?.statusCode === 400 ||
          err?.statusCode === 401 ||
          err?.statusCode === 403
        ) {
          setStatusState('unavailable');
        } else {
          setStatusState('connection-error');
        }

        const errorMessageText =
          err?.message || 'Unable to retrieve route advisory at this moment. Please check connection.';
        setError(errorMessageText);

        const fallbackMessage: AIMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Route Advisory: ${errorMessageText}`,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, fallbackMessage]);
      } finally {
        setIsThinking(false);
      }
    },
    [context, isThinking, messages, rateLimitSeconds, statusState]
  );

  const resetConversation = useCallback(() => {
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        role: 'assistant',
        content:
          "Conversation reset. I'm ready to assist with your Bangalore → Chikmagalur route analysis, hazard alerts, fuel planning, or motorcycle suitability.",
        timestamp: Date.now(),
      },
    ]);
    setError(null);
    setIsThinking(false);

    if (
      statusState === 'rate-limited' ||
      statusState === 'unavailable' ||
      statusState === 'connection-error'
    ) {
      if (providerRef.current instanceof RealAIProvider) {
        providerRef.current
          .checkStatus()
          .then((info) => setStatusState(info.status))
          .catch(() => setStatusState('connection-error'));
      }
    } else {
      setStatusState(statusState === 'demo' ? 'demo' : 'ready');
    }
  }, [statusState]);

  const currentStatusState: AIStatusState = isThinking ? 'thinking' : statusState;
  const statusInfo: AIStatusInfo = {
    ...STATUS_CONFIGS[currentStatusState],
    retryAfterSeconds: rateLimitSeconds > 0 ? rateLimitSeconds : undefined,
  };

  return {
    messages,
    isThinking,
    error,
    statusInfo,
    isRateLimited: rateLimitSeconds > 0,
    rateLimitSecondsRemaining: rateLimitSeconds,
    sendMessage,
    resetConversation,
  };
}

