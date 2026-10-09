import { AIProvider } from './ai-provider';
import { RealAIProvider } from './real-provider';
import { MockAIProvider } from './mock-provider';

export interface ProviderFactoryOptions {
  forceMock?: boolean;
  endpointUrl?: string;
}

/**
 * Returns the configured AIProvider instance.
 * By default, connects to the server-side /api/rider-ai endpoint (RealAIProvider),
 * where provider selection (mock vs real model) is governed by server-side AI_PROVIDER in .env.
 */
export function getRiderAIProvider(options?: ProviderFactoryOptions): AIProvider {
  if (options?.forceMock) {
    return new MockAIProvider();
  }

  return new RealAIProvider(options?.endpointUrl || '/api/rider-ai');
}
