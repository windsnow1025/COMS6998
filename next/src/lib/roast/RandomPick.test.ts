import {drawDistinct} from "./RandomPick";

const items = ["a", "b", "c", "d", "e"];
const Draws = 200;

describe("drawDistinct", () => {
  it("draws the count asked, each a different member of the items", () => {
    for (let i = 0; i < Draws; i++) {
      const drawn = drawDistinct(items, 3);
      expect(drawn).toHaveLength(3);
      expect(new Set(drawn).size).toBe(3);
      drawn.forEach((item) => expect(items).toContain(item));
    }
  });

  it("reaches every item over many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < Draws; i++) {
      drawDistinct(items, 3).forEach((item) => seen.add(item));
    }
    expect([...seen].sort()).toEqual(items);
  });

  it("leaves the items as they were", () => {
    const before = [...items];
    drawDistinct(items, 3);
    expect(items).toEqual(before);
  });
});
