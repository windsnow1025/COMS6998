import CaptionClient from "./CaptionClient";
import {handleError} from "@/lib/common/ErrorHandler";
import {CaptionResDto, ImageResDto} from "@/client/nest";

export interface ImageCaptions {
  image: ImageResDto;
  captions: CaptionResDto[];
}

export default class CaptionLogic {
  private captionClient: CaptionClient;

  constructor() {
    this.captionClient = new CaptionClient();
  }

  static groupByImage(captions: CaptionResDto[]): ImageCaptions[] {
    const groups = new Map<string, ImageCaptions>();
    for (const caption of captions) {
      const group = groups.get(caption.image.id);
      if (group) {
        group.captions.push(caption);
      } else {
        groups.set(caption.image.id, {image: caption.image, captions: [caption]});
      }
    }
    return [...groups.values()];
  }

  async fetchCaptions(): Promise<CaptionResDto[]> {
    try {
      return await this.captionClient.fetchCaptions();
    } catch (error) {
      handleError(error, "Failed to fetch captions");
    }
  }
}
