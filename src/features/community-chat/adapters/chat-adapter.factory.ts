import { IChatAdapter } from './chat-adapter.interface';
import { MockTabChatAdapter } from './mock-tab-chat.adapter';
import { SupabaseChatAdapter } from './supabase-chat.adapter';
import { ChatBackendType } from '../types';

let cachedAdapter: IChatAdapter | null = null;

/**
 * Determine the configured chat backend.
 * Standardized strictly on VITE_CHAT_BACKEND.
 * Allowed values: 'mock' | 'supabase'
 * Defaults strictly to 'mock' unless explicitly overridden with VITE_CHAT_BACKEND=supabase.
 * Does NOT switch to Supabase solely because Supabase credentials are present.
 */
export function getChatBackendConfig(): ChatBackendType {
  let envBackend =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.VITE_CHAT_BACKEND) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_CHAT_BACKEND) ||
    '';

  // Fallback for Node test execution if .env was not preloaded
  if (!envBackend && typeof process !== 'undefined') {
    try {
      const fs = (globalThis as any).fs || (typeof require !== 'undefined' ? require('fs') : null);
      if (fs && fs.existsSync && fs.existsSync('.env')) {
        const content = fs.readFileSync('.env', 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
          const [k, ...v] = trimmed.split('=');
          if (k.trim() === 'VITE_CHAT_BACKEND') {
            envBackend = v.join('=').trim().replace(/^['"]|['"]$/g, '');
            break;
          }
        }
      }
    } catch {}
  }

  if (envBackend === 'supabase') {
    return 'supabase';
  }

  return 'mock';
}

/**
 * Returns the singleton IChatAdapter instance based on explicit VITE_CHAT_BACKEND configuration.
 */
export function getChatAdapter(): IChatAdapter {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const backend = getChatBackendConfig();

  if (backend === 'supabase') {
    console.log('[CommunityChat] Active Backend: SUPABASE (VITE_CHAT_BACKEND=supabase)');
    cachedAdapter = new SupabaseChatAdapter();
    return cachedAdapter;
  }

  console.log('[CommunityChat] Active Backend: MOCK (VITE_CHAT_BACKEND=mock)');
  cachedAdapter = new MockTabChatAdapter();
  return cachedAdapter;
}

/**
 * Allows injecting a custom adapter (useful for testing or explicit provider swaps).
 */
export function setChatAdapter(adapter: IChatAdapter | null): void {
  cachedAdapter = adapter;
}

/**
 * Reset singleton (useful for testing or when switching personas in test harness).
 */
export function resetChatAdapter(): void {
  cachedAdapter = null;
}
