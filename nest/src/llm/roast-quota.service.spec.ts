import { HttpException, HttpStatus } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { UserResDto } from '../users/dto/user.res.dto';
import { CounterClient } from './counter.client';
import {
  MaxDailyLlmCalls,
  MaxDailyRoasts,
  MaxDailyUserLlmCalls,
  UploadLlmCalls,
} from './llm.constants';
import { RoastQuotaService } from './roast-quota.service';

// Counters in memory with the atomic increment of Redis
class FakeCounterClient {
  private readonly counts = new Map<string, number>();

  increment(key: string, amount: number): Promise<number> {
    const count = (this.counts.get(key) ?? 0) + amount;
    this.counts.set(key, count);
    return Promise.resolve(count);
  }

  decrement(key: string, amount: number): Promise<void> {
    this.counts.set(key, (this.counts.get(key) ?? 0) - amount);
    return Promise.resolve();
  }

  get(key: string): Promise<number> {
    return Promise.resolve(this.counts.get(key) ?? 0);
  }
}

describe('RoastQuotaService', () => {
  const user = { id: 1, roles: [Role.User] } as UserResDto;
  const admin = { id: 2, roles: [Role.Admin] } as UserResDto;
  let service: RoastQuotaService;

  const countFulfilled = (results: PromiseSettledResult<void>[]) =>
    results.filter(({ status }) => status === 'fulfilled').length;

  beforeEach(() => {
    service = new RoastQuotaService(
      new FakeCounterClient() as unknown as CounterClient,
    );
  });

  it('rejects the roast after the daily limit and keeps the count at the limit', async () => {
    for (let roast = 0; roast < MaxDailyRoasts; roast++) {
      await service.takeRoast(user);
    }

    await expect(service.takeRoast(user)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    await expect(service.takeRoast(user)).rejects.toBeInstanceOf(HttpException);
    expect(await service.getRoastsLeft(user)).toBe(0);
  });

  it('gives concurrent requests no more than the daily limit', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: MaxDailyRoasts + 5 }, () => service.takeRoast(user)),
    );

    expect(countFulfilled(results)).toBe(MaxDailyRoasts);
    expect(await service.getRoastsLeft(user)).toBe(0);
  });

  it('gives a returned roast back', async () => {
    await service.takeRoast(user);
    await service.returnRoast(user);

    expect(await service.getRoastsLeft(user)).toBe(MaxDailyRoasts);
  });

  it('limits the LLM calls of one user without counting the rejected ones against the site', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: MaxDailyUserLlmCalls + 5 }, () =>
        service.takeLlmCall(user),
      ),
    );
    expect(countFulfilled(results)).toBe(MaxDailyUserLlmCalls);

    const siteResults = await Promise.allSettled(
      Array.from({ length: MaxDailyLlmCalls }, () =>
        service.takeLlmCall(admin),
      ),
    );
    expect(countFulfilled(siteResults)).toBe(
      MaxDailyLlmCalls - MaxDailyUserLlmCalls,
    );
  });

  it('takes the LLM calls of the upload with a roast, all of them or none', async () => {
    await Promise.all(
      Array.from({ length: MaxDailyUserLlmCalls - 1 }, () =>
        service.takeLlmCall(user),
      ),
    );

    await expect(service.takeRoast(user)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(await service.getRoastsLeft(user)).toBe(MaxDailyRoasts);
    await expect(service.takeLlmCall(user)).resolves.toBeUndefined();
    await expect(service.takeLlmCall(user)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('exempts an admin from the limits per user and not from the limit of the site', async () => {
    const roasts = MaxDailyLlmCalls / UploadLlmCalls;
    const results = await Promise.allSettled(
      Array.from({ length: roasts + 5 }, () => service.takeRoast(admin)),
    );

    expect(countFulfilled(results)).toBe(roasts);
    expect(await service.getRoastsLeft(admin)).toBe(MaxDailyRoasts);
  });

  it('returns the roast of a user whom the limit of the site rejects', async () => {
    await Promise.all(
      Array.from({ length: MaxDailyLlmCalls }, () =>
        service.takeLlmCall(admin),
      ),
    );

    await expect(service.takeRoast(user)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(await service.getRoastsLeft(user)).toBe(MaxDailyRoasts);
  });
});
