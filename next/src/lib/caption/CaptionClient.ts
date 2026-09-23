import {CaptionResDto, CaptionsApi} from "@/client/nest";
import {getNestOpenAPIConfiguration} from "@/lib/common/APIConfig";

export default class CaptionClient {
  async fetchCaptions(): Promise<CaptionResDto[]> {
    const api = new CaptionsApi(getNestOpenAPIConfiguration());
    const res = await api.captionsControllerFindAll();
    return res.data;
  }
}
