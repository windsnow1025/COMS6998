// `count` distinct members of `items`, drawn at random, by a partial Fisher-Yates shuffle; `count` is at most the
// number of items
export function drawDistinct<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
