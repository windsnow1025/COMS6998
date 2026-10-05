import assert from 'node:assert';

export const CampusTimeZone = 'America/New_York';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: CampusTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// The calendar date on campus at the given instant, as YYYY-MM-DD
export function toCampusDate(instant: Date): string {
  const parts = dateFormat.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function addDays(date: string, days: number): string {
  const utc = new Date(`${date}T00:00:00Z`);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

// The instant at which the given campus date begins.
// Midnight on campus is 04:00 UTC under daylight time and 05:00 UTC under standard time.
export function startOfCampusDate(date: string): Date {
  const start = [4, 5]
    .map((hour) => new Date(`${date}T0${hour}:00:00Z`))
    .find(
      (candidate) =>
        toCampusDate(candidate) === date &&
        toCampusDate(new Date(candidate.getTime() - 1)) !== date,
    );
  assert(start, `No campus midnight found for ${date}`);
  return start;
}
