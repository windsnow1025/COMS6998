import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

// Counters in Redis. Its increment is atomic, so concurrent requests never get the same count,
// which the cache manager's get and set cannot guarantee.
// https://redis.io/docs/latest/commands/incr/
@Injectable()
export class CounterClient {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // The count after the increment. The first increment of a counter starts its time to live.
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async decrement(key: string): Promise<void> {
    await this.client.decr(key);
  }

  async get(key: string): Promise<number> {
    return Number((await this.client.get(key)) ?? 0);
  }

  private get client() {
    return (this.cacheManager.stores[0].store as KeyvRedis<unknown>).client;
  }
}
