import {getOutcome, isTied} from '@/lib/roast/PhotoResults';
import {PhotoResDto} from '@/client/nest';

// Where the viewer's vote on a photo stands, in one line
export function describeStanding(photo: PhotoResDto): string {
  const voters = photo.voters ?? 0;
  const votes = `${voters} ${voters === 1 ? 'vote' : 'votes'}`;
  return {
    owner: `Your photo · ${votes} so far`,
    early: isTied(photo) ? `${votes} so far · tied at the top` : `${votes} so far · verdict pending`,
    match: 'Verdict: you picked the crowd favorite',
    miss: 'Verdict: the crowd went another way',
    none: `You picked none · ${votes}`,
  }[getOutcome(photo)];
}
