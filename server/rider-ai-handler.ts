import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { RiderAIContext, AIMessage } from '../src/features/rider-ai/types/index';
import { MockAIProvider } from '../src/features/rider-ai/services/mock-provider';
import { buildRiderAIPayload } from '../src/features/rider-ai/services/request-builder';
import { parseRiderAIResponse } from '../src/features/rider-ai/services/response-parser';

export interface RiderAIRequestBody {
  query: string;
  context: RiderAIContext;
  history?: AIMessage[];
}

/**
 * Retrieves environment variable, prioritizing process.env while dynamically checking .env file
 */
export function getEnvVar(key: string): string {
  if (process.env[key] !== undefined) {
    return process.env[key]!.trim();
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k.trim() === key) {
          return v.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    }
  } catch {}
  return '';
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const json = JSON.stringify(data);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(json));
  res.end(json);
}

async function readJsonBody(req: IncomingMessage): Promise<RiderAIRequestBody> {
  if ((req as any).body && typeof (req as any).body === 'object') {
    return (req as any).body as RiderAIRequestBody;
  }

  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        // 2MB payload guard
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON payload in request body'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

// In-memory rate-limit cooldown and server failure tracking
let serverRateLimitExpiresAt = 0;
let serverConfigFailure = false;
let serverConnectionFailure = false;

export function setRateLimitCooldown(seconds: number): void {
  serverRateLimitExpiresAt = Date.now() + Math.ceil(seconds * 1000);
}

export function getRateLimitStatus(): { isRateLimited: boolean; retryAfterSeconds: number } {
  const remainingMs = serverRateLimitExpiresAt - Date.now();
  if (remainingMs > 0) {
    return {
      isRateLimited: true,
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
    };
  }
  return { isRateLimited: false, retryAfterSeconds: 0 };
}

/**
 * Handles incoming /api/rider-ai requests.
 * Supports both Mock and Real providers based strictly on server-side AI_PROVIDER.
 */
export async function handleRiderAIRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void
): Promise<void> {
  const providerConfig = (getEnvVar('AI_PROVIDER') || 'real').toLowerCase().trim();

  // Support GET request for safe public status (zero secrets, zero keys, zero sensitive env vars)
  if (req.method === 'GET') {
    if (providerConfig === 'mock') {
      sendJson(res, 200, {
        status: 'demo',
      });
      return;
    }

    const geminiKey = getEnvVar('GEMINI_API_KEY');
    const openaiKey = getEnvVar('OPENAI_API_KEY');
    if (!geminiKey && !openaiKey) {
      sendJson(res, 200, {
        status: 'unavailable',
      });
      return;
    }

    const rateLimit = getRateLimitStatus();
    if (rateLimit.isRateLimited) {
      sendJson(res, 200, {
        status: 'rate-limited',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return;
    }

    if (serverConfigFailure) {
      sendJson(res, 200, {
        status: 'unavailable',
      });
      return;
    }

    if (serverConnectionFailure) {
      sendJson(res, 200, {
        status: 'connection-error',
      });
      return;
    }

    sendJson(res, 200, {
      status: 'ready',
    });
    return;
  }

  // Only accept POST requests for AI message generation
  if (req.method !== 'POST') {
    if (next) {
      return next();
    }
    sendJson(res, 405, { error: 'Method Not Allowed. Use POST.' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const { query, context, history = [] } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      sendJson(res, 400, { error: 'Missing or empty "query" parameter.' });
      return;
    }

    if (!context || typeof context !== 'object') {
      sendJson(res, 400, { error: 'Missing or invalid "context" parameter.' });
      return;
    }

    // Prevent accidental request spam if rate-limited cooldown is active
    if (providerConfig !== 'mock') {
      const rateLimit = getRateLimitStatus();
      if (rateLimit.isRateLimited) {
        const waitSec = rateLimit.retryAfterSeconds;
        const friendlyTime =
          waitSec <= 15 ? 'about 15 seconds' : waitSec <= 35 ? 'about 30 seconds' : 'about 1 minute';
        console.log(`[Rider AI Server] Rate limit cooldown active (${waitSec}s remaining). Rejecting request early.`);
        sendJson(res, 429, {
          error: `AI is temporarily rate-limited. Please try again in ${friendlyTime}.`,
          isRateLimited: true,
          retryAfterSeconds: waitSec,
        });
        return;
      }
    }

    // 1. MOCK PROVIDER
    if (providerConfig === 'mock') {
      const mockProvider = new MockAIProvider(600);
      const mockResponse = await mockProvider.sendMessage(query, context, history);
      sendJson(res, 200, mockResponse);
      return;
    }

    // 2. REAL PROVIDER
    const geminiKey = getEnvVar('GEMINI_API_KEY');
    const openaiKey = getEnvVar('OPENAI_API_KEY');

    // Strict requirement: If AI_PROVIDER=real and no key is set, DO NOT fall back silently to mock.
    if (!geminiKey && !openaiKey) {
      serverConfigFailure = true;
      sendJson(res, 400, {
        error:
          "AI service is currently unavailable. Please verify API key configuration in server environment.",
        isConfigError: true,
      });
      return;
    }

    // Build standard prompt and context payload
    const payload = buildRiderAIPayload(query, context, history);

    // Call Google Gemini if key is present
    if (geminiKey) {
      const geminiModel = getEnvVar('GEMINI_MODEL') || 'gemini-3.6-flash';
      console.log(`[Rider AI Server] Invoking Gemini Interactions API (model: ${geminiModel})`);
      const geminiResponse = await callGemini(geminiKey, geminiModel, payload, context);
      serverConfigFailure = false;
      serverConnectionFailure = false;
      sendJson(res, 200, geminiResponse);
      return;
    }

    // Otherwise call OpenAI if key is present
    if (openaiKey) {
      const openaiModel = getEnvVar('OPENAI_MODEL') || 'gpt-4o-mini';
      const openaiBaseUrl = getEnvVar('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
      console.log(`[Rider AI Server] Invoking OpenAI (model: ${openaiModel})`);
      const openaiResponse = await callOpenAI(openaiKey, openaiModel, openaiBaseUrl, payload, context);
      serverConfigFailure = false;
      serverConnectionFailure = false;
      sendJson(res, 200, openaiResponse);
      return;
    }
  } catch (error: any) {
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
    const isRateLimited = statusCode === 429 || Boolean(error?.isRateLimited);
    const isConfigError =
      Boolean(error?.isConfigError) || statusCode === 400 || statusCode === 401 || statusCode === 403;

    if (isConfigError) {
      serverConfigFailure = true;
    } else if (statusCode >= 500) {
      serverConnectionFailure = true;
    }

    // Redact configured secrets from server diagnostic log
    let diagnosticLog = error?.message || 'Unknown error';
    const geminiKey = getEnvVar('GEMINI_API_KEY');
    const openaiKey = getEnvVar('OPENAI_API_KEY');
    if (geminiKey) {
      diagnosticLog = diagnosticLog.split(geminiKey).join('[REDACTED]');
    }
    if (openaiKey) {
      diagnosticLog = diagnosticLog.split(openaiKey).join('[REDACTED]');
    }

    console.error(`[Rider AI Server] Request failed (HTTP ${statusCode}): ${diagnosticLog}`);

    // Create user-friendly error messages - NEVER expose raw Gemini error JSON/paths/messages
    let userFacingMessage: string;
    if (isRateLimited) {
      const waitSec = error?.retryAfterSeconds || 60;
      const friendlyTime =
        waitSec <= 15
          ? 'about 15 seconds'
          : waitSec <= 35
          ? 'about 30 seconds'
          : waitSec <= 75
          ? 'about 1 minute'
          : `about ${Math.ceil(waitSec / 60)} minutes`;
      userFacingMessage = `AI is temporarily rate-limited. Please try again in ${friendlyTime}.`;
    } else if (isConfigError) {
      userFacingMessage =
        'AI service is currently unavailable. Please verify API key configuration in server environment.';
    } else {
      userFacingMessage =
        'Unable to connect to AI service. Please check your network connection and try again.';
    }

    sendJson(res, statusCode, {
      error: userFacingMessage,
      isRateLimited,
      retryAfterSeconds: error?.retryAfterSeconds,
      isConfigError,
    });
  }
}

/**
 * Invokes Google Gemini Interactions API with native JSON schema structured output
 */
async function callGemini(
  apiKey: string,
  model: string,
  payload: ReturnType<typeof buildRiderAIPayload>,
  context: RiderAIContext
) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';

  const systemInstructionsText = `
${payload.systemPrompt}

CURRENT TELEMETRY & CORRIDOR CONTEXT:
${payload.contextSummary}

STRICT CONTEXT GROUNDING & HONESTY RULES:
- Never contradict supplied structured context. If the context says the bike has ABS, do not claim that it does not.
- Specifically, the Royal Enfield Himalayan is equipped with Dual-Channel ABS and a 452cc engine. Never state that it lacks ABS.
- Strictly respect supplied corridor metrics: route (Bangalore -> Chikmagalur), distance (247 km), safety score (82/100), weather, and hazard counts.
- Do NOT invent unspecified bike specifications.
- Do NOT describe demo route information as live telemetry. Always frame responses with wording such as:
  "Based on the available demo route data..."
  "Using the supplied rider and bike context..."

OUTPUT CARD GUIDANCE:
Always supply relevant structured cards when discussing route safety, hazards, weather conditions, fuel planning, food stops, bike suitability, alternative routes, or trip preparation.
Ensure each card object strictly has a valid "type" matching one of:
'route-safety' | 'hazard' | 'weather' | 'fuel' | 'food' | 'repair' | 'bike-suitability' | 'alternative-route' | 'ride-preparation' | 'recommendation'
`.trim();

  // Convert conversation history into Gemini Interactions API step_list structure cleanly
  const inputSteps: Array<{ type: 'user_input' | 'model_output'; content: Array<{ type: 'text'; text: string }> }> = [];

  // Filter out any leading assistant messages that do not follow a user message
  const relevantHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let hasEncounteredUser = false;
  for (const item of payload.conversationHistory) {
    if (item.role === 'user') {
      hasEncounteredUser = true;
      relevantHistory.push(item);
    } else if (hasEncounteredUser && item.role === 'assistant') {
      relevantHistory.push(item);
    }
  }

  // Ensure turns alternate cleanly: collapse consecutive messages of the same role
  for (const item of relevantHistory) {
    const stepType = item.role === 'assistant' ? 'model_output' : 'user_input';
    const prev = inputSteps[inputSteps.length - 1];
    if (prev && prev.type === stepType) {
      prev.content[0].text += `\n\n${item.content}`;
    } else {
      inputSteps.push({
        type: stepType,
        content: [{ type: 'text', text: item.content }],
      });
    }
  }

  // Add the current user turn
  const lastStep = inputSteps[inputSteps.length - 1];
  if (lastStep && lastStep.type === 'user_input') {
    lastStep.content[0].text += `\n\n${payload.userQuery}`;
  } else {
    inputSteps.push({
      type: 'user_input',
      content: [{ type: 'text', text: payload.userQuery }],
    });
  }

  // Strict structured JSON schema specification for the Interactions API
  const responseFormat = {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Concise, rider-first co-pilot advice and explanation',
      },
      cards: {
        type: 'array',
        description:
          'Structured cards array for route safety, hazards, weather, fuel, bike suitability, recommendations, etc.',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description:
                "Card type identifier: 'route-safety' | 'hazard' | 'weather' | 'fuel' | 'food' | 'repair' | 'bike-suitability' | 'alternative-route' | 'ride-preparation' | 'recommendation'",
            },
            bikeModel: { type: 'string' },
            suitabilityScore: { type: 'number' },
            rating: { type: 'string' },
            matchedFactors: { type: 'array', items: { type: 'string' } },
            potentialChallenges: { type: 'array', items: { type: 'string' } },
            recommendation: { type: 'string' },
            safetyScore: { type: 'number' },
            riskLevel: { type: 'string' },
            riskIndicators: { type: 'array', items: { type: 'string' } },
            explanation: { type: 'string' },
            recommendedAction: { type: 'string' },
            hazardType: { type: 'string' },
            severity: { type: 'string' },
            description: { type: 'string' },
            precaution: { type: 'string' },
            locationName: { type: 'string' },
            condition: { type: 'string' },
            temperatureC: { type: 'number' },
            rainProbability: { type: 'number' },
            ridingRecommendation: { type: 'string' },
            cautionWindow: { type: 'string' },
            stops: { type: 'array', items: { type: 'object' } },
            rangeRemainingKm: { type: 'number' },
            criticalNotice: { type: 'string' },
            alternativeName: { type: 'string' },
            originalDistanceKm: { type: 'number' },
            alternativeDistanceKm: { type: 'number' },
            safetyDelta: { type: 'number' },
            timeDeltaMinutes: { type: 'number' },
            reason: { type: 'string' },
            gearChecklist: { type: 'array', items: { type: 'object' } },
            bikePreTripChecks: { type: 'array', items: { type: 'object' } },
            documentsRequired: { type: 'array', items: { type: 'string' } },
            title: { type: 'string' },
            whyThisRecommendation: { type: 'string' },
            confidence: { type: 'string' },
          },
          required: ['type'],
        },
      },
      confidenceScore: {
        type: 'number',
        description: 'Confidence score between 0.0 and 1.0',
      },
    },
    required: ['text', 'cards'],
  };

  const requestBody = {
    model,
    system_instruction: systemInstructionsText,
    input: inputSteps,
    response_format: responseFormat,
  };

  let response: Response | undefined;
  let lastError: Error | undefined;

  // Handle single request with at most 1 fast retry for transient server hiccups (503/network)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        lastError = undefined;
        break;
      }

      const errorBody = await response.text();

      // Immediately handle 429 Rate Limits without repeated hammering
      if (response.status === 429) {
        let retrySeconds = 60;
        const retryHeader = response.headers.get('retry-after');
        if (retryHeader) {
          const parsed = parseFloat(retryHeader);
          if (!isNaN(parsed) && parsed > 0) retrySeconds = Math.ceil(parsed);
        } else {
          const retryMatch = errorBody.match(/(?:Please retry in|retry(?:After|Delay)?["':\s]+)([0-9.]+)\s*s?/i);
          if (retryMatch) {
            const parsed = parseFloat(retryMatch[1]);
            if (!isNaN(parsed) && parsed > 0) retrySeconds = Math.ceil(parsed);
          }
        }

        setRateLimitCooldown(retrySeconds);

        const friendlyTime =
          retrySeconds <= 15
            ? 'about 15 seconds'
            : retrySeconds <= 35
            ? 'about 30 seconds'
            : retrySeconds <= 75
            ? 'about 1 minute'
            : `about ${Math.ceil(retrySeconds / 60)} minutes`;

        console.warn(`[Rider AI Server] Gemini rate limit encountered (HTTP 429). Cooldown: ${retrySeconds}s`);

        const rateLimitErr = new Error(`AI is temporarily rate-limited. Please try again in ${friendlyTime}.`);
        (rateLimitErr as any).statusCode = 429;
        (rateLimitErr as any).isRateLimited = true;
        (rateLimitErr as any).retryAfterSeconds = retrySeconds;
        throw rateLimitErr;
      }

      // Handle transient server errors (500/503) with 1 fast retry
      const isTransient = response.status === 500 || response.status === 503;
      let detailMessage = `Gemini Provider API returned status ${response.status} (${response.statusText})`;
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          const code = errorJson.error.code || response.status;
          const status = errorJson.error.status ? ` [${errorJson.error.status}]` : '';
          const reason = errorJson.error.details?.[0]?.reason ? ` (${errorJson.error.details[0].reason})` : '';
          const message = errorJson.error.message || '';
          detailMessage = `Gemini API Error (HTTP ${code}${status}${reason}): ${message}`;
        }
      } catch {
        detailMessage = `Gemini Provider API returned status ${response.status}: ${errorBody.slice(0, 200)}`;
      }

      if (apiKey) {
        detailMessage = detailMessage.split(apiKey).join('[REDACTED]');
      }

      const err = new Error(detailMessage);
      (err as any).statusCode = response.status;
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        (err as any).isConfigError = true;
      }
      lastError = err;

      if (isTransient && attempt < 1) {
        console.log(`[Rider AI Server] Transient high-demand response. Retrying once in 2.5s...`);
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }

      throw err;
    } catch (fetchErr: any) {
      lastError = fetchErr;
      if (fetchErr?.statusCode === 429 || fetchErr?.isRateLimited) {
        throw fetchErr;
      }
      if (fetchErr?.statusCode && fetchErr.statusCode < 500) {
        throw fetchErr;
      }
      if (attempt < 1) {
        console.log(`[Rider AI Server] Network or transient error. Retrying in 2.5s...`);
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
      throw fetchErr;
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error('Failed to receive response from Gemini Interactions API.');
  }

  const data = (await response.json()) as any;
  const modelOutputStep = data?.steps?.find((s: any) => s.type === 'model_output');
  const candidateText =
    modelOutputStep?.content?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    '';

  if (!candidateText) {
    const err = new Error('Gemini Interactions API returned an empty model output step.');
    (err as any).statusCode = 502;
    throw err;
  }

  return parseRiderAIResponse(candidateText, context.dataFreshness);
}

/**
 * Invokes OpenAI API with JSON Object response format
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  baseUrl: string,
  payload: ReturnType<typeof buildRiderAIPayload>,
  context: RiderAIContext
) {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const systemMessageContent = `
${payload.systemPrompt}

CURRENT TELEMETRY & CORRIDOR CONTEXT:
${payload.contextSummary}

Respond with a JSON object conforming to:
{
  "text": "Co-pilot response...",
  "cards": [ /* structured cards if relevant */ ],
  "confidenceScore": 0.95
}
`.trim();

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemMessageContent },
  ];

  for (const item of payload.conversationHistory) {
    messages.push({
      role: item.role,
      content: item.content,
    });
  }

  messages.push({
    role: 'user',
    content: payload.userQuery,
  });

  const requestBody = {
    model,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.25,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (fetchErr: any) {
    const err = new Error(`Failed to connect to OpenAI API endpoint: ${fetchErr?.message || 'Network error'}`);
    (err as any).statusCode = 502;
    throw err;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let detailMessage = `OpenAI Provider API returned status ${response.status} (${response.statusText})`;
    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson.error) {
        const code = errorJson.error.code ? ` [${errorJson.error.code}]` : '';
        const message = errorJson.error.message || '';
        detailMessage = `OpenAI API Error (HTTP ${response.status}${code}): ${message}`;
      }
    } catch {
      detailMessage = `OpenAI Provider API returned status ${response.status}: ${errorBody.slice(0, 200)}`;
    }

    if (apiKey) {
      detailMessage = detailMessage.split(apiKey).join('[REDACTED]');
    }

    const err = new Error(detailMessage);
    (err as any).statusCode = response.status;
    throw err;
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content || '';

  if (!content) {
    const err = new Error('OpenAI API returned an empty message content.');
    (err as any).statusCode = 502;
    throw err;
  }

  return parseRiderAIResponse(content, context.dataFreshness);
}
