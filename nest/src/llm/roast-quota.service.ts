import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { toCampusDate } from '../common/utils/campus-date';
import { UserResDto } from '../users/dto/user.res.dto';
import { CounterClient } from './counter.client';
import {
  MaxDailyLlmCalls,
  MaxDailyRoasts,
  MaxDailyUserLlmCalls,
} from './llm.constants';

// Daily limits on LLM spending, counted per campus date. Admins are exempt from the limits per user.
@Injectable()
export class RoastQuotaService {
  // A counter outlives its campus date in every time zone
  private readonly counterTtlSeconds = 48 * 60 * 60;

  constructor(private readonly counterClient: CounterClient) {}

  async getRoastsLeft(user: UserResDto): Promise<number> {
    if (this.isUnlimited(user)) {
      return MaxDailyRoasts;
    }
    const used = await this.counterClient.get(this.getRoastsKey(user.id));
    return Math.max(MaxDailyRoasts - used, 0);
  }

  // Takes one of the user's roasts for today, and one LLM call for the photo's description.
  async takeRoast(user: UserResDto): Promise<void> {
    if (!this.isUnlimited(user)) {
      await this.take(
        this.getRoastsKey(user.id),
        MaxDailyRoasts,
        `You have used your ${MaxDailyRoasts} roasts for today. Come back tomorrow.`,
      );
    }
    try {
      await this.takeLlmCall(user);
    } catch (error) {
      await this.returnRoast(user);
      throw error;
    }
  }

  // Gives back a roast that failed through no fault of the user.
  async returnRoast(user: UserResDto): Promise<void> {
    if (!this.isUnlimited(user)) {
      await this.counterClient.decrement(this.getRoastsKey(user.id));
    }
  }

  async takeLlmCall(user: UserResDto): Promise<void> {
    const date = toCampusDate(new Date());
    // The user's limit comes first: a request that it rejects must not count against the site
    if (!this.isUnlimited(user)) {
      await this.take(
        `llm-calls:${date}:${user.id}`,
        MaxDailyUserLlmCalls,
        'You have reached your limit for today. Come back tomorrow.',
      );
    }
    await this.take(
      `llm-calls:${date}`,
      MaxDailyLlmCalls,
      'The roastery is closed for today. Come back tomorrow.',
    );
  }

  // Counts one use of the counter, unless the limit is reached.
  private async take(
    key: string,
    limit: number,
    message: string,
  ): Promise<void> {
    const used = await this.counterClient.increment(
      key,
      this.counterTtlSeconds,
    );
    if (used > limit) {
      await this.counterClient.decrement(key);
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private isUnlimited(user: UserResDto): boolean {
    return user.roles?.includes(Role.Admin) ?? false;
  }

  private getRoastsKey(userId: number): string {
    return `roasts:${toCampusDate(new Date())}:${userId}`;
  }
}
