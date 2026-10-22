import {PhotoCaptionResDto, PhotoResDto} from "@/client/nest";

// Whether the viewer has nothing left to vote on the photo
export function isDone(photo: PhotoResDto): boolean {
  return photo.viewer.isOwner || photo.viewer.hasVoted;
}

// The share of the photo's voters who picked the caption, from 0 to 1
export function getPickShare(photo: PhotoResDto, caption: PhotoCaptionResDto): number {
  const voters = photo.voters ?? 0;
  return voters === 0 ? 0 : (caption.picks ?? 0) / voters;
}

// The share of the photo's voters who rejected every caption, from 0 to 1
export function getNoneShare(photo: PhotoResDto): number {
  const voters = photo.voters ?? 0;
  return voters === 0 ? 0 : (photo.nonePicks ?? 0) / voters;
}

// The captions with the most picks; none while no caption has a pick
function getLeaders(photo: PhotoResDto): PhotoCaptionResDto[] {
  const topPicks = Math.max(0, ...photo.captions.map((caption) => caption.picks ?? 0));
  if (topPicks === 0) {
    return [];
  }
  return photo.captions.filter((caption) => caption.picks === topPicks);
}

// The caption that leads the photo's picks alone; none while no caption has a pick or the most picked captions tie.
// The API tells the verdict itself through the viewer's `matched`, which also waits for enough voters.
export function getWinner(photo: PhotoResDto): PhotoCaptionResDto | undefined {
  const leaders = getLeaders(photo);
  return leaders.length === 1 ? leaders[0] : undefined;
}

// The voters a verdict needs, as the API's `MinVotersForVerdict`
const MinVotersForVerdict = 2;

// Whether the photo has a verdict: the voters a verdict needs, and a caption that leads alone
export function hasVerdict(photo: PhotoResDto): boolean {
  return (photo.voters ?? 0) >= MinVotersForVerdict && getLeaders(photo).length === 1;
}

// Whether the most picked captions tie, so that the photo waits for the vote that breaks it
export function isTied(photo: PhotoResDto): boolean {
  return getLeaders(photo).length > 1;
}

export type Outcome = "owner" | "match" | "miss" | "none" | "early";

// How the viewer's vote on a revealed photo stands against the crowd.
// "early": the viewer picked a caption, and the photo has no verdict yet: too few voters, or a tie at the top.
export function getOutcome(photo: PhotoResDto): Outcome {
  if (photo.viewer.isOwner) {
    return "owner";
  }
  if (photo.viewer.captionId === null) {
    return "none";
  }
  if (photo.viewer.matched === undefined) {
    return "early";
  }
  return photo.viewer.matched ? "match" : "miss";
}

const OutcomeSquares: Record<Outcome, string> = {
  owner: "\u{1F4F8}",
  match: "\u{1F7E7}",
  miss: "\u{2B1B}",
  none: "\u{1F6AB}",
  early: "\u{2B1C}",
};

// One square per photo of a finished batch, for sharing a result without its captions
export function buildShareGrid(photos: PhotoResDto[]): string {
  return photos.map((photo) => OutcomeSquares[getOutcome(photo)]).join("");
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}
