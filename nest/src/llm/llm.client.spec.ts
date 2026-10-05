import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as z from 'zod/v4';
import { LlmClient } from './llm.client';

interface ReceivedRequest {
  url: string;
  authorization: string | undefined;
  body: Record<string, unknown>;
}

const Schema = z.object({ joke: z.string() });

const BaseRequest = {
  authorization: 'Bearer token',
  apiType: 'Google AI Studio Free Tier',
  model: 'gemini-3.7-flash',
  system: 'You write jokes.',
  user: 'Write one.',
  schema: Schema,
};

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString();
}

describe('LlmClient', () => {
  let server: Server;
  let client: LlmClient;
  let received: ReceivedRequest[];
  // What the stand-in for FastAPI answers to a request
  let answer: { status: number; body: unknown };
  // Answers that the stand-in gives first, one per request, before `answer`
  let firstAnswers: { status: number; body: unknown }[];

  beforeAll(async () => {
    server = createServer((req, res) => {
      void readBody(req).then((body) => {
        received.push({
          url: req.url!,
          authorization: req.headers.authorization,
          body: JSON.parse(body) as Record<string, unknown>,
        });
        const { status, body: answerBody } = firstAnswers.shift() ?? answer;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(answerBody));
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );

    const { port } = server.address() as AddressInfo;
    const configService = {
      get: () => ({ fastapi: { host: '127.0.0.1', port } }),
    } as unknown as ConfigService;
    client = new LlmClient(configService);
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    received = [];
    firstAnswers = [];
  });

  it("sends the prompts, the image, and the schema to the chat endpoint with the user's authorization", async () => {
    answer = {
      status: HttpStatus.OK,
      body: { text: '{"joke":"ha"}', input_tokens: 12, output_tokens: 3 },
    };

    const response = await client.generate({
      ...BaseRequest,
      imageUrl: 'https://example.com/photo.jpg',
    });

    expect(response).toMatchObject({
      output: { joke: 'ha' },
      text: '{"joke":"ha"}',
      inputTokens: 12,
      outputTokens: 3,
    });
    expect(received).toHaveLength(1);
    expect(received[0].url).toBe('/chat');
    expect(received[0].authorization).toBe('Bearer token');
    expect(received[0].body).toMatchObject({
      messages: [
        {
          role: 'system',
          contents: [{ type: 'text', data: 'You write jokes.' }],
        },
        {
          role: 'user',
          contents: [
            { type: 'file', data: 'https://example.com/photo.jpg' },
            { type: 'text', data: 'Write one.' },
          ],
        },
      ],
      api_type: 'Google AI Studio Free Tier',
      model: 'gemini-3.7-flash',
      stream: false,
      structured_output_schema: {
        type: 'object',
        properties: { joke: { type: 'string' } },
        required: ['joke'],
      },
    });
  });

  it('sends a request without an image as text only', async () => {
    answer = {
      status: HttpStatus.OK,
      body: { text: '{"joke":"ha"}', input_tokens: 1, output_tokens: 1 },
    };

    await client.generate(BaseRequest);

    expect(received[0].body.messages).toMatchObject([
      { role: 'system' },
      { role: 'user', contents: [{ type: 'text', data: 'Write one.' }] },
    ]);
  });

  it('reports no output when the model returns no text', async () => {
    answer = {
      status: HttpStatus.OK,
      body: { text: '', input_tokens: 7, output_tokens: 0 },
    };

    const response = await client.generate(BaseRequest);

    expect(response.output).toBeNull();
    expect(response.inputTokens).toBe(7);
  });

  it('fails when the text does not match the schema', async () => {
    answer = {
      status: HttpStatus.OK,
      body: { text: '{"joke":1}', input_tokens: 1, output_tokens: 1 },
    };

    await expect(client.generate(BaseRequest)).rejects.toThrow();
  });

  it('answers 429 when the provider limits the rate', async () => {
    answer = {
      status: HttpStatus.TOO_MANY_REQUESTS,
      body: { detail: '429 RESOURCE_EXHAUSTED' },
    };

    await expect(client.generate(BaseRequest)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('posts the request again when the provider is under high demand', async () => {
    firstAnswers = [
      { status: HttpStatus.SERVICE_UNAVAILABLE, body: { detail: '503' } },
    ];
    answer = {
      status: HttpStatus.OK,
      body: { text: '{"joke":"ha"}', input_tokens: 1, output_tokens: 1 },
    };

    const response = await client.generate(BaseRequest);

    expect(response.output).toEqual({ joke: 'ha' });
    expect(received).toHaveLength(2);
  }, 15000);

  it('answers 429 when the provider stays under high demand', async () => {
    answer = {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      body: { detail: '503 UNAVAILABLE' },
    };

    await expect(client.generate(BaseRequest)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(received).toHaveLength(5);
  }, 15000);

  it('fails with the detail of any other error of the chat endpoint', async () => {
    answer = {
      status: HttpStatus.BAD_REQUEST,
      body: { detail: 'API key not valid' },
    };

    await expect(client.generate(BaseRequest)).rejects.toThrow(
      /FastAPI answered 400: .*API key not valid/,
    );
  });
});
