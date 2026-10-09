import { addDays } from '../common/utils/campus-date';

// The consecutive campus dates with a finished batch, ending today, or yesterday while today's batch is unfinished.
// A missed date, one whose batch had photos the user could vote on and did not, breaks the run; a date in neither
// set, one with no batch or with nothing the user could vote on, neither extends nor breaks it.
export function countStreak(
  today: string,
  finishedDates: Set<string>,
  missedDates: Set<string>,
): number {
  const oldest = [...finishedDates].sort()[0];
  if (oldest === undefined) {
    return 0;
  }
  let date = finishedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (date >= oldest && !missedDates.has(date)) {
    if (finishedDates.has(date)) {
      streak += 1;
    }
    date = addDays(date, -1);
  }
  return streak;
}
