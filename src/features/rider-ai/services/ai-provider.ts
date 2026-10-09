import { AIMessage, AIResponse, RiderAIContext } from '../types';

/**
 * Common abstraction for AI Companion providers.
 * Decouples the UI layer from specific LLM models or endpoints.
 */
export interface AIProvider {
  /**
   * Sends a user query along with the motorcycle and route context to the AI engine.
   */
  sendMessage(
    query: string,
    context: RiderAIContext,
    conversationHistory: AIMessage[]
  ): Promise<AIResponse>;
}
