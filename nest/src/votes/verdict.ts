import { PhotoTally } from './votes.service';

// Voters a photo needs before its winning caption can be told
export const MinVotersForVerdict = 3;

// Whether the picked caption has the most picks of its photo; null while too few users have voted.
export function judgePick(
  tally: PhotoTally | undefined,
  captionId: string,
): boolean | null {
  if (!tally || tally.voters < MinVotersForVerdict) {
    return null;
  }
  const topPicks = Math.max(...tally.picks.values());
  return tally.picks.get(captionId) === topPicks;
}
