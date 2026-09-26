import CaptionLogic from "./CaptionLogic";
import CaptionClient from "./CaptionClient";

jest.mock("./CaptionClient");

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
