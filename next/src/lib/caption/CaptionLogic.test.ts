import CaptionLogic from "./CaptionLogic";
import CaptionClient from "./CaptionClient";

jest.mock("./CaptionClient");

describe("CaptionLogic.fetchCaptions", () => {
  it("returns the captions from the client", async () => {
    const captions = [
      {
        id: 1,
        content: "me opening Gradescope at 2 a.m.",
        image: {id: 7, url: "https://example.com/7.jpg", description: "a dog"},
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
