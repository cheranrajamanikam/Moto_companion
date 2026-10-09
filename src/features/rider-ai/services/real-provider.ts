import { AIProvider } from './ai-provider';
import { AIMessage, AIResponse, RiderAIContext } from '../types';

/**
 * RealAIProvider connects the frontend chat interface to the server-side /api/rider-ai endpoint.
 *
 * Security Guarantee:
 * - NEVER holds API keys, model secrets, or vendor credentials on the client.
 * - Delegates model execution, system prompting, and provider selection entirely to the server.
 */
export class RealAIProvider implements AIProvider {
  private endpointUrl: string;

  constructor(endpointUrl: string = '/api/rider-ai') {
    this.endpointUrl = endpointUrl;
  }

  async sendMessage(
    query: string,
    context: RiderAIContext,
    conversationHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      throw new Error('Query cannot be empty');
    }

    let response: Response;
    try {
      response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmedQuery,
          context,
          history: conversationHistory,
        }),
      });
    } catch (networkError: any) {
      const err = new Error(
        `Unable to reach Rider AI server at ${this.endpointUrl}. Please verify network connectivity.`
      );
      (err as any).isNetworkError = true;
      (err as any).statusCode = 0;
      throw err;
    }

    if (!response.ok) {
      let serverErrorMsg = `Server error (${response.status})`;
      let isRateLimited = response.status === 429;
      let isConfigError = response.status === 400 || response.status === 401 || response.status === 403;
      let retryAfterSeconds: number | undefined;

      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.error === 'string') {
          serverErrorMsg = errorJson.error;
        }
        if (errorJson && errorJson.isRateLimited) {
          isRateLimited = true;
        }
        if (errorJson && typeof errorJson.retryAfterSeconds === 'number') {
          retryAfterSeconds = errorJson.retryAfterSeconds;
        }
        if (errorJson && errorJson.isConfigError) {
          isConfigError = true;
        }
      } catch {
        const textError = await response.text().catch(() => '');
        if (textError) {
          serverErrorMsg = textError.slice(0, 180);
        }
      }

      const err = new Error(serverErrorMsg);
      (err as any).statusCode = response.status;
      (err as any).isRateLimited = isRateLimited;
      (err as any).isConfigError = isConfigError;
      (err as any).retryAfterSeconds = retryAfterSeconds;
      throw err;
    }

    try {
      const data = (await response.json()) as AIResponse;
      if (!data || typeof data.text !== 'string') {
        throw new Error('Received invalid AIResponse payload from server.');
      }
      return data;
    } catch (parseError: any) {
      throw new Error(
        `Failed to parse response from Rider AI co-pilot: ${parseError?.message || 'Invalid format'}`
      );
    }
  }

  async checkStatus(): Promise<{
    status: 'demo' | 'ready' | 'rate-limited' | 'unavailable' | 'connection-error';
    retryAfterSeconds?: number;
  }> {
    try {
      const res = await fetch(this.endpointUrl, { method: 'GET' });
      if (!res.ok) {
        return { status: 'unavailable' };
      }
      return await res.json();
    } catch {
      return { status: 'connection-error' };
    }
  }
}
