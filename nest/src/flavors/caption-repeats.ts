// Words that carry no joke; a repeat is told by the words that are left
const FunctionWords = new Set(
  'a an and are as at be but by for from has have he her his i if in into is it its me my no not of on or our she so than that the their them then there they this to too was we were what when where who will with you your'.split(
    ' ',
  ),
);

// Words 2 captions must share, at least, to tell the same joke
export const MinSharedWords = 3;
// The share of the shorter caption's words that the other caption has, from which the 2 tell the same joke
export const RepeatShare = 0.6;

function toWords(caption: string): Set<string> {
  return new Set(
    caption
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .map((word) => (word.length > 3 ? word.replace(/s$/, '') : word))
      .filter((word) => word && !FunctionWords.has(word)),
  );
}

function tellSameJoke(one: Set<string>, other: Set<string>): boolean {
  const shared = [...one].filter((word) => other.has(word)).length;
  return (
    shared >= MinSharedWords &&
    shared / Math.min(one.size, other.size) >= RepeatShare
  );
}

// Whether the caption tells the joke of one of the others: each voice writes without the other voices' captions,
// so that 2 voices can take the same idea in nearly the same words.
export function repeatsAny(caption: string, others: string[]): boolean {
  const own = toWords(caption);
  return others.some((other) => tellSameJoke(own, toWords(other)));
}

// The captions, by index, that tell the joke of a caption before them
export function findRepeats(captions: string[]): number[] {
  return captions.flatMap((caption, index) =>
    repeatsAny(caption, captions.slice(0, index)) ? [index] : [],
  );
}
