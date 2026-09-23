import CaptionClient from "./CaptionClient";
import {handleError} from "@/lib/common/ErrorHandler";
import {CaptionResDto} from "@/client/nest";

export default class CaptionLogic {
  private captionClient: CaptionClient;

  constructor() {
    this.captionClient = new CaptionClient();
  }

  async fetchCaptions(): Promise<CaptionResDto[]> {
    try {
      return await this.captionClient.fetchCaptions();
    } catch (error) {
      handleError(error, "Failed to fetch captions");
    }
  }
}
