import {buildShareGrid, getNoneShare, getOutcome, getPickShare, getWinner, hasVerdict, isDone, isTied} from "./PhotoResults";
import {PhotoResDto} from "@/client/nest";

const photo = (overrides: Partial<PhotoResDto>): PhotoResDto => ({
  id: "0f9d3c2b-7a1e-4c6d-8b2f-5e4a9c1d7b33",
  url: "https://example.com/7.jpg",
  description: "a dog",
  place: null,
  uploader: null,
  batchDate: "2026-10-04",
  createdAt: "2026-10-03T00:00:00.000Z",
  captions: [
    {id: "a", content: "first", picks: 3},
    {id: "b", content: "second", picks: 3},
    {id: "c", content: "third", picks: 1},
  ],
  revealed: true,
  voters: 8,
  nonePicks: 1,
  viewer: {isOwner: false, hasVoted: true, captionId: "a", matched: true},
  ...overrides,
});

describe("photo results", () => {
  it("shares picks and rejections among the voters", () => {
    const revealed = photo({});
    expect(getPickShare(revealed, revealed.captions[0])).toBe(3 / 8);
    expect(getNoneShare(revealed)).toBe(1 / 8);
    expect(getPickShare(photo({voters: 0}), revealed.captions[0])).toBe(0);
  });

  it("names the caption that leads alone the winner, and none at a tie or without a pick", () => {
    const tied = photo({});
    expect(getWinner(tied)).toBeUndefined();
    expect(isTied(tied)).toBe(true);
    const led = photo({captions: [{id: "a", content: "first", picks: 3}, {id: "b", content: "second", picks: 2}]});
    expect(getWinner(led)?.id).toBe("a");
    expect(isTied(led)).toBe(false);
    const unpicked = photo({captions: [{id: "a", content: "first", picks: 0}]});
    expect(getWinner(unpicked)).toBeUndefined();
    expect(isTied(unpicked)).toBe(false);
  });

  it("has a verdict only with the voters it needs and a lone leader", () => {
    const lead = [{id: "a", content: "first", picks: 2}, {id: "b", content: "second", picks: 0}];
    const tie = [{id: "a", content: "first", picks: 1}, {id: "b", content: "second", picks: 1}];
    expect(hasVerdict(photo({voters: 1, captions: [{id: "a", content: "first", picks: 1}, {id: "b", content: "second", picks: 0}]}))).toBe(false);
    expect(hasVerdict(photo({voters: 2, captions: tie}))).toBe(false);
    expect(hasVerdict(photo({voters: 2, captions: lead}))).toBe(true);
  });

  it("reads the viewer's outcome", () => {
    const viewer = {isOwner: false, hasVoted: true, captionId: "a"};
    expect(getOutcome(photo({}))).toBe("match");
    expect(getOutcome(photo({viewer: {...viewer, matched: false}}))).toBe("miss");
    expect(getOutcome(photo({viewer}))).toBe("early");
    expect(getOutcome(photo({viewer: {...viewer, captionId: null}}))).toBe("none");
    expect(getOutcome(photo({viewer: {isOwner: true, hasVoted: false, captionId: null}}))).toBe("owner");
  });

  it("counts an uploaded photo and a voted photo as done", () => {
    expect(isDone(photo({}))).toBe(true);
    expect(isDone(photo({viewer: {isOwner: true, hasVoted: false, captionId: null}}))).toBe(true);
    expect(isDone(photo({viewer: {isOwner: false, hasVoted: false, captionId: null}}))).toBe(false);
  });

  it("draws one square per photo", () => {
    const viewer = {isOwner: false, hasVoted: true, captionId: "a"};
    const photos = [photo({}), photo({viewer: {...viewer, matched: false}}), photo({viewer})];
    expect(buildShareGrid(photos)).toBe("\u{1F7E7}\u{2B1B}\u{2B1C}");
  });
});
