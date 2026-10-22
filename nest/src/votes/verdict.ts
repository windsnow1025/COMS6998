import { PhotoTally } from './votes.service';

// Voters a photo needs before its winning caption can be told
export const MinVotersForVerdict = 2;

// The photo's verdict: the caption that leads its picks alone, once enough users have voted. Null while
// too few have voted, while no caption has a pick, or while the most picked captions tie; a tie is never
// broken, and the photo waits for the vote that breaks it.
export function findVerdict(tally: PhotoTally | undefined): string | null {
  if (!tally || tally.voters < MinVotersForVerdict) {
    return null;
  }
  const topPicks = Math.max(0, ...tally.picks.values());
  if (topPicks === 0) {
    return null;
  }
  const leaders = [...tally.picks]
    .filter(([, picks]) => picks === topPicks)
    .map(([captionId]) => captionId);
  return leaders.length === 1 ? leaders[0] : null;
}

export function hasVerdict(tally: PhotoTally | undefined): boolean {
  return findVerdict(tally) !== null;
}

// Whether the picked caption is the photo's verdict; null while the photo has none.
export function judgePick(
  tally: PhotoTally | undefined,
  captionId: string,
): boolean | null {
  const verdict = findVerdict(tally);
  return verdict === null ? null : verdict === captionId;
}
