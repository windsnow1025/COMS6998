import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

// Counters in Redis. Its increment is atomic, so concurrent requests never get the same count,
// which the cache manager's get and set cannot guarantee.
// https://redis.io/docs/latest/commands/incrby/
@Injectable()
export class CounterClient {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // The count after the increment. The first increment of a counter starts its time to live.
  async increment(
    key: string,
    amount: number,
    ttlSeconds: number,
  ): Promise<number> {
    const count = await this.client.incrBy(key, amount);
    if (count === amount) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async decrement(key: string, amount: number): Promise<void> {
    await this.client.decrBy(key, amount);
  }

  async get(key: string): Promise<number> {
    return Number((await this.client.get(key)) ?? 0);
  }

  private get client() {
    return (this.cacheManager.stores[0].store as KeyvRedis<unknown>).client;
  }
}
