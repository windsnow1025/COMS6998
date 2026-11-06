import { LlmBusyException } from '../llm/llm.client';
import { ChainRunnerService } from './chain-runner.service';
import { fillTemplate, Placeholder } from './chain.prompts';
import { HumorFlavor } from './humor-flavor.entity';
import { StepInput, StepOutput } from './prompt-step.entity';

const model = { id: 'm1', name: 'gpt', provider: { apiType: 'OpenAI' } };

const flavor = {
  id: 'f1',
  slug: 'deadpan',
  steps: [
    {
      id: 's1',
      name: 'describe',
      input: StepInput.Image,
      output: StepOutput.Text,
      systemPrompt: 'S1',
      userPrompt: 'Look.{uploader_note}',
      model,
    },
    {
      id: 's2',
      name: 'caption',
      input: StepInput.Text,
      output: StepOutput.Captions,
      systemPrompt: 'S2{terms}',
      userPrompt: 'From: {previous}',
      model,
    },
  ],
} as unknown as HumorFlavor;

const photo = {
  id: 'i1',
  url: 'http://x/i.jpg',
  description: 'D',
  place: 'Butler',
};
const user = { id: 1, roles: [] } as never;

function createService(generate: jest.Mock, saved: object[]) {
  return new ChainRunnerService(
    { generate } as never,
    { takeLlmCall: () => Promise.resolve() } as never,
    {
      save: (row: object) => {
        saved.push(row);
        return Promise.resolve({ id: `c${saved.length}`, ...row });
      },
    } as never,
    { find: () => Promise.resolve([]) } as never,
    { find: () => Promise.resolve([]) } as never,
  );
}

describe('fillTemplate', () => {
  it('fills every placeholder, each as often as it occurs, and leaves other braces', () => {
    const values = {
      [Placeholder.Description]: 'D',
      [Placeholder.UploaderNote]: '',
      [Placeholder.Previous]: 'P',
      [Placeholder.Examples]: '',
      [Placeholder.Terms]: 'T',
    };
    expect(
      fillTemplate(
        '{description} {previous} {previous}{terms} {other}',
        values,
      ),
    ).toBe('D P PT {other}');
  });
});

describe('ChainRunnerService.run', () => {
  it('feeds each step the previous answer and records every request', async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        output: { text: ' A pigeon. ' },
        text: '{"text":" A pigeon. "}',
        inputTokens: 10,
        outputTokens: 4,
        durationMs: 5,
      })
      .mockResolvedValueOnce({
        output: { captions: [' One. ', '', 'Two.'] },
        text: '{"captions":[" One. ","","Two."]}',
        inputTokens: 20,
        outputTokens: 6,
        durationMs: 7,
      });
    const saved: object[] = [];
    const service = createService(generate, saved);

    const outcome = await service.run(flavor, photo, user, 'Bearer t', null);

    expect(generate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        imageUrl: 'http://x/i.jpg',
        system: 'S1',
        user: 'Look.\n<uploader_note>\nButler\n</uploader_note>',
      }),
    );
    expect(generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        imageUrl: undefined,
        system: 'S2',
        user: 'From: A pigeon.',
      }),
    );
    expect(outcome.captions).toEqual(['One.', 'Two.']);
    expect(outcome.text).toBe('One.\nTwo.');
    expect(outcome.calls).toHaveLength(2);
    expect(saved[1]).toMatchObject({
      step: 'caption',
      model: 'gpt',
      flavor: { id: 'f1' },
      image: { id: 'i1' },
      run: null,
      userPrompt: 'From: A pigeon.',
      inputTokens: 20,
    });
  });

  it("gives the chain's first step the photo's description as the previous answer", async () => {
    const generate = jest.fn().mockResolvedValue({
      output: { captions: ['One.'] },
      text: '{"captions":["One."]}',
      inputTokens: 20,
      outputTokens: 6,
      durationMs: 7,
    });
    const service = createService(generate, []);

    await service.run(
      { ...flavor, steps: [flavor.steps[1]] },
      photo,
      user,
      'Bearer t',
      null,
    );

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ user: 'From: D' }),
    );
  });

  it('reports a step that answered no text as the provider being busy', async () => {
    const generate = jest.fn().mockResolvedValue({
      output: null,
      text: '',
      inputTokens: 0,
      outputTokens: 0,
      durationMs: 1,
    });
    const service = createService(generate, []);
    await expect(
      service.run(flavor, photo, user, 'Bearer t', null),
    ).rejects.toThrow(LlmBusyException);
  });
});
