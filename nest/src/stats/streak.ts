import { addDays } from '../common/utils/campus-date';

// The consecutive campus dates with a finished batch, ending today, or yesterday while today's batch is unfinished.
export function countStreak(today: string, finishedDates: Set<string>): number {
  let date = finishedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (finishedDates.has(date)) {
    streak += 1;
    date = addDays(date, -1);
  }
  return streak;
}
