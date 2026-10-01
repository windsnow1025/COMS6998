import CaptionLogic from "./CaptionLogic";
import CaptionClient from "./CaptionClient";

jest.mock("./CaptionClient");

describe("CaptionLogic.groupByImage", () => {
  it("groups captions under their image in order of first appearance", () => {
    const dog = {id: "0f9d3c2b-7a1e-4c6d-8b2f-5e4a9c1d7b33", url: "https://example.com/7.jpg", description: "a dog"};
    const bear = {id: "5c8e1a47-2b6f-4d3a-9e0c-7f1b3a9d6e22", url: "https://example.com/8.jpg", description: "a bear"};
    const caption = (id: string, content: string, image: typeof dog) => ({
      id,
      content,
      image,
      createdAt: "2026-09-23T00:00:00.000Z",
    });
    const first = caption("6b1a6f2e-3d0c-4b9e-9f1d-2a7c5e8b4d10", "first", dog);
    const second = caption("9a2d4c6e-1f3b-4a5c-8d7e-0b9c8a7f6e11", "second", bear);
    const third = caption("3e5f7a9b-0c2d-4e6f-8a1b-2c3d4e5f6a12", "third", dog);

    expect(CaptionLogic.groupByImage([first, second, third])).toEqual([
      {image: dog, captions: [first, third]},
      {image: bear, captions: [second]},
    ]);
  });
});

describe("CaptionLogic.fetchCaptions", () => {
  it("returns the captions from the client", async () => {
    const captions = [
      {
        id: "6b1a6f2e-3d0c-4b9e-9f1d-2a7c5e8b4d10",
        content: "me opening Gradescope at 2 a.m.",
        image: {id: "0f9d3c2b-7a1e-4c6d-8b2f-5e4a9c1d7b33", url: "https://example.com/7.jpg", description: "a dog"},
        createdAt: "2026-09-23T00:00:00.000Z",
      },
    ];
    jest.mocked(CaptionClient.prototype.fetchCaptions).mockResolvedValue(captions);
    await expect(new CaptionLogic().fetchCaptions()).resolves.toEqual(captions);
  });

  it("rethrows a client failure as an Error with the fallback message", async () => {
    jest.mocked(CaptionClient.prototype.fetchCaptions).mockRejectedValue("network down");
    await expect(new CaptionLogic().fetchCaptions()).rejects.toThrow("Failed to fetch captions");
  });
});
