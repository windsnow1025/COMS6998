import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as z from 'zod/v4';
import { AppConfig } from '../config/config.interface';
import { Temperature } from './llm.constants';

export interface LlmRequest<Schema extends z.ZodType> {
  // The Authorization header of the user's request, which FastAPI verifies
  authorization: string;
  apiType: string;
  model: string;
  system: string;
  user: string;
  // The public URL of an image for the model to look at
  imageUrl?: string;
  schema: Schema;
}

export interface LlmResponse<Output> {
  // null when the model returned no text, as it does for content that its provider blocks
  output: Output | null;
  text: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

interface ChatContent {
  type: 'text' | 'file';
  // Text, or the URL of a file
  data: string;
}

interface ChatMessage {
  role: 'system' | 'user';
  contents: ChatContent[];
}

interface ChatRequest {
  messages: ChatMessage[];
  api_type: string;
  model: string;
  temperature: number;
  stream: boolean;
  thought: boolean;
  web_search: boolean;
  code_execution: boolean;
  structured_output_schema: object;
}

interface ChatResponse {
  text: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

// The cluster's Nginx answers 504 for a request that Nest has not answered within 60 seconds.
// The attempts of a request to the LLM therefore share one time limit that ends before that.
const RequestTimeoutMs = 50 * 1000;
// A provider under high demand answers 503 at once, and a later attempt often passes
const MaxAttempts = 5;
const RetryDelayMs = 1500;

const TooManyRequests: number = HttpStatus.TOO_MANY_REQUESTS;
const ServiceUnavailable: number = HttpStatus.SERVICE_UNAVAILABLE;

// The provider cannot answer now, and a later request may pass
export class LlmBusyException extends HttpException {
  constructor() {
    super('The roastery is busy. Try again in a minute.', TooManyRequests);
  }
}

// The chat endpoint of this project's FastAPI service, which calls the LLM providers
@Injectable()
export class LlmClient {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfig>('app')!;
    this.baseUrl = `http://${config.fastapi.host}:${config.fastapi.port}`;
  }

  async generate<Schema extends z.ZodType>(
    request: LlmRequest<Schema>,
  ): Promise<LlmResponse<z.infer<Schema>>> {
    const startedAt = Date.now();

    const contents: ChatContent[] = [];
    if (request.imageUrl) {
      contents.push({ type: 'file', data: request.imageUrl });
    }
    contents.push({ type: 'text', data: request.user });

    const chatRequest: ChatRequest = {
      messages: [
        { role: 'system', contents: [{ type: 'text', data: request.system }] },
        { role: 'user', contents },
      ],
      api_type: request.apiType,
      model: request.model,
      temperature: Temperature,
      stream: false,
      thought: false,
      web_search: false,
      code_execution: false,
      structured_output_schema: z.toJSONSchema(request.schema),
    };

    const response = await this.post(chatRequest, request.authorization);

    // FastAPI passes on the status of the provider: 429 at its rate limit, 503 under high demand
    if (
      response.status === TooManyRequests ||
      response.status === ServiceUnavailable
    ) {
      throw new LlmBusyException();
    }
    if (!response.ok) {
      throw new Error(
        `FastAPI answered ${response.status}: ${await response.text()}`,
      );
    }

    const chatResponse = (await response.json()) as ChatResponse;
    const text = chatResponse.text ?? '';
    return {
      output: text.trim() ? request.schema.parse(JSON.parse(text)) : null,
      text,
      inputTokens: chatResponse.input_tokens ?? 0,
      outputTokens: chatResponse.output_tokens ?? 0,
      durationMs: Date.now() - startedAt,
    };
  }

  // Posts the request, and posts it again after a pause while the provider answers 503.
  private async post(
    chatRequest: ChatRequest,
    authorization: string,
  ): Promise<Response> {
    const signal = AbortSignal.timeout(RequestTimeoutMs);
    for (let attempt = 1; ; attempt++) {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        body: JSON.stringify(chatRequest),
        signal,
      });
      if (response.status !== ServiceUnavailable || attempt === MaxAttempts) {
        return response;
      }
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, RetryDelayMs));
    }
  }
}
