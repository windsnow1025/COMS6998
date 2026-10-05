// Batches turn over at midnight on campus
const CampusTimeZone = "America/New_York";

const SecondsPerDay = 24 * 60 * 60;

function getCampusParts(instant: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CampusTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  return Object.fromEntries(parts.map(({type, value}) => [type, value]));
}

// The calendar date on campus at the given instant, as YYYY-MM-DD
export function getCampusDate(instant: Date): string {
  const {year, month, day} = getCampusParts(instant);
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number): string {
  const utc = new Date(`${date}T00:00:00Z`);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

// A campus date for display, such as "Sun, Oct 4"
export function formatCampusDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

// Seconds until the next campus midnight, by the campus clock
export function getSecondsToNextBatch(instant: Date): number {
  const {hour, minute, second} = getCampusParts(instant);
  return SecondsPerDay - (Number(hour) * 3600 + Number(minute) * 60 + Number(second));
}

// A duration as HH:MM:SS
export function formatCountdown(seconds: number): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map(pad).join(":");
}
