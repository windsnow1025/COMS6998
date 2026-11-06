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

function createService(
  generate: jest.Mock,
  saved: object[],
  remove: jest.Mock = jest.fn(),
) {
  return new ChainRunnerService(
    { generate } as never,
    { takeLlmCall: () => Promise.resolve() } as never,
    {
      save: (row: object) => {
        saved.push(row);
        return Promise.resolve({ id: `c${saved.length}`, ...row });
      },
      remove,
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
  it("tells the chain's last step the captions other voices wrote, and no earlier step", async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        output: { text: 'A pigeon.' },
        text: '',
        inputTokens: 1,
        outputTokens: 1,
        durationMs: 1,
      })
      .mockResolvedValueOnce({
        output: { captions: ['Three.'] },
        text: '',
        inputTokens: 1,
        outputTokens: 1,
        durationMs: 1,
      });
    const service = createService(generate, []);

    await service.run(flavor, photo, user, 'Bearer t', null, ['One.', 'Two.']);

    expect(generate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        user: 'Look.\n<uploader_note>\nButler\n</uploader_note>',
      }),
    );
    expect(generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user: 'From: A pigeon.\n\nOther voices already wrote these captions for this photo:\n- One.\n- Two.\nWrite on a different idea: none of their jokes, and none of their key words.',
      }),
    );
  });

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

describe('ChainRunnerService.runApart', () => {
  const caption = { ...flavor, steps: [flavor.steps[1]] };
  const answer = (text: string) => ({
    output: { captions: [text] },
    text: '',
    inputTokens: 1,
    outputTokens: 1,
    durationMs: 1,
  });
  const Custody =
    'The housing lottery got us separate beds but joint custody of the nightstand.';
  const CustodyAgain = 'The beds have joint custody of the nightstand.';

  it('writes again, told what is taken, and removes the requests of the run that gave way', async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce(answer(CustodyAgain))
      .mockResolvedValueOnce(
        answer('Two beds, one nightstand, no boundaries.'),
      );
    const remove = jest.fn().mockResolvedValue(undefined);
    const service = createService(generate, [], remove);

    const outcome = await service.runApart(
      caption,
      photo,
      user,
      'Bearer t',
      null,
      [Custody],
    );

    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ user: 'From: D' }),
    );
    expect(generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user: expect.stringContaining(`- ${Custody}`) as string,
      }),
    );
    expect(remove).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'c1' }),
    ]);
    expect(outcome.captions).toEqual([
      'Two beds, one nightstand, no boundaries.',
    ]);
    expect(outcome.calls).toEqual([expect.objectContaining({ id: 'c2' })]);
  });

  it('runs once when the caption tells none of the taken jokes', async () => {
    const generate = jest
      .fn()
      .mockResolvedValue(answer('The broker called it a common area.'));
    const remove = jest.fn();
    const service = createService(generate, [], remove);

    await service.runApart(caption, photo, user, 'Bearer t', null, [Custody]);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
  });

  it('lets the caption stand when the voice cannot write another', async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce(answer(CustodyAgain))
      .mockRejectedValue(new Error('busy'));
    const remove = jest.fn();
    const service = createService(generate, [], remove);

    const outcome = await service.runApart(
      caption,
      photo,
      user,
      'Bearer t',
      null,
      [Custody],
    );

    expect(outcome.captions).toEqual([CustodyAgain]);
    expect(remove).not.toHaveBeenCalled();
  });

  it('stops after the last rewrite and keeps what it wrote then', async () => {
    const generate = jest.fn().mockResolvedValue(answer(CustodyAgain));
    const service = createService(generate, []);

    await service.runApart(caption, photo, user, 'Bearer t', null, [Custody]);

    expect(generate).toHaveBeenCalledTimes(3);
  });
});
