import { LlmBusyException } from './llm.client';
import { LlmStep } from './llm-call.entity';
import { DescribeSystemPrompt, ScreeningSystemPrompt } from './roast.prompts';
import { RoastService } from './roast.service';

const settings = {
  [LlmStep.Screen]: { apiType: 'OpenAI', model: 'screener' },
  [LlmStep.Describe]: { apiType: 'Google', model: 'describer' },
};

const answer = (output: object | null) => ({
  output,
  text: output ? JSON.stringify(output) : '',
  inputTokens: 10,
  outputTokens: 4,
  durationMs: 5,
});

// Requests that answer by the step whose system prompt they carry
function generateBy(
  screening: () => Promise<unknown>,
  description: () => Promise<unknown>,
): jest.Mock {
  return jest.fn((request: { system: string }) =>
    request.system === ScreeningSystemPrompt ? screening() : description(),
  );
}

function admit(generate: jest.Mock) {
  const service = new RoastService(
    { generate } as never,
    { findStep: (step: LlmStep) => Promise.resolve(settings[step]) } as never,
  );
  return service.admit('http://x/i.jpg', 'Butler', 'Bearer t');
}

describe('RoastService.admit', () => {
  it('screens and describes a photo in 2 requests, each on the model of its own step', async () => {
    const generate = generateBy(
      () => Promise.resolve(answer({ suitable: true, reason: 'Fine.' })),
      () => Promise.resolve(answer({ description: ' A pigeon on a box. ' })),
    );

    const admission = await admit(generate);

    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: ScreeningSystemPrompt,
        user: '<uploader_note>\nButler\n</uploader_note>\n\nScreen this photo.',
        apiType: 'OpenAI',
        model: 'screener',
        imageUrl: 'http://x/i.jpg',
      }),
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: DescribeSystemPrompt,
        user: '<uploader_note>\nButler\n</uploader_note>\n\nDescribe this photo.',
        apiType: 'Google',
        model: 'describer',
        imageUrl: 'http://x/i.jpg',
      }),
    );
    expect(admission).toEqual({
      suitable: true,
      description: 'A pigeon on a box.',
      records: [
        expect.objectContaining({
          step: 'screen',
          model: 'screener',
          systemPrompt: ScreeningSystemPrompt,
          response: '{"suitable":true,"reason":"Fine."}',
        }),
        expect.objectContaining({
          step: 'describe',
          model: 'describer',
          systemPrompt: DescribeSystemPrompt,
          response: '{"description":" A pigeon on a box. "}',
        }),
      ],
    });
  });

  it('makes the 2 requests at once: each answers only after the other is made', async () => {
    let markScreeningMade = () => {};
    let markDescriptionMade = () => {};
    const screeningMade = new Promise<void>((resolve) => {
      markScreeningMade = resolve;
    });
    const descriptionMade = new Promise<void>((resolve) => {
      markDescriptionMade = resolve;
    });
    const generate = generateBy(
      async () => {
        markScreeningMade();
        await descriptionMade;
        return answer({ suitable: true, reason: '' });
      },
      async () => {
        markDescriptionMade();
        await screeningMade;
        return answer({ description: 'A pigeon.' });
      },
    );

    await expect(admit(generate)).resolves.toMatchObject({
      suitable: true,
      description: 'A pigeon.',
    });
  });

  it('turns a photo down with the reason, and drops its description, even a failed one', async () => {
    const generate = generateBy(
      () =>
        Promise.resolve(
          answer({ suitable: false, reason: ' It shows an ID card. ' }),
        ),
      () => Promise.reject(new LlmBusyException()),
    );

    await expect(admit(generate)).resolves.toEqual({
      suitable: false,
      reason: 'It shows an ID card.',
    });
  });

  it('reads a screening without text, or without a reason, as the photo being declined', async () => {
    const described = () => Promise.resolve(answer({ description: 'D' }));
    const declined = {
      suitable: false,
      reason: 'This photo cannot be roasted. Try another one.',
    };

    await expect(
      admit(generateBy(() => Promise.resolve(answer(null)), described)),
    ).resolves.toEqual(declined);
    await expect(
      admit(
        generateBy(
          () => Promise.resolve(answer({ suitable: false, reason: ' ' })),
          described,
        ),
      ),
    ).resolves.toEqual(declined);
  });

  it('fails for a photo the screening passes whose description failed', async () => {
    const passed = () =>
      Promise.resolve(answer({ suitable: true, reason: '' }));

    await expect(
      admit(generateBy(passed, () => Promise.resolve(answer(null)))),
    ).rejects.toBeInstanceOf(LlmBusyException);
    await expect(
      admit(
        generateBy(passed, () => Promise.resolve(answer({ description: ' ' }))),
      ),
    ).rejects.toThrow('empty');
    await expect(
      admit(generateBy(passed, () => Promise.reject(new Error('FastAPI')))),
    ).rejects.toThrow('FastAPI');
  });

  it('fails when the screening fails, whatever the description answers', async () => {
    await expect(
      admit(
        generateBy(
          () => Promise.reject(new Error('FastAPI')),
          () => Promise.reject(new LlmBusyException()),
        ),
      ),
    ).rejects.toThrow('FastAPI');
  });
});
