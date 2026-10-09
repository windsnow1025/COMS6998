import {
  BatchesApi,
  BatchResDto,
  BatchSummaryResDto,
  FlavorResDto,
  FlavorsApi,
  ImagesApi,
  ImagesControllerFindTopRangeEnum,
  PhotoResDto,
  StatsApi,
  StatsResDto,
} from "@/client/nest";
import {getNestOpenAPIConfiguration} from "@/lib/common/APIConfig";

export type TopRange = ImagesControllerFindTopRangeEnum;

export default class RoastClient {
  async fetchFlavors(): Promise<FlavorResDto[]> {
    const api = new FlavorsApi(getNestOpenAPIConfiguration());
    const res = await api.flavorsControllerFindAll();
    return res.data;
  }

  async fetchTodayBatch(): Promise<BatchResDto> {
    const api = new BatchesApi(getNestOpenAPIConfiguration());
    const res = await api.batchesControllerFindToday();
    return res.data;
  }

  async fetchBatch(date: string): Promise<BatchResDto> {
    const api = new BatchesApi(getNestOpenAPIConfiguration());
    const res = await api.batchesControllerFindPast(date);
    return res.data;
  }

  async fetchRecentBatches(): Promise<BatchSummaryResDto[]> {
    const api = new BatchesApi(getNestOpenAPIConfiguration());
    const res = await api.batchesControllerFindRecent();
    return res.data;
  }

  async fetchPhoto(id: string): Promise<PhotoResDto> {
    const api = new ImagesApi(getNestOpenAPIConfiguration());
    const res = await api.imagesControllerFindOne(id);
    return res.data;
  }

  async fetchTopPhotos(range: TopRange, limit: number, offset: number): Promise<PhotoResDto[]> {
    const api = new ImagesApi(getNestOpenAPIConfiguration());
    const res = await api.imagesControllerFindTop(range, limit, offset);
    return res.data;
  }

  async fetchMyPhotos(): Promise<PhotoResDto[]> {
    const api = new ImagesApi(getNestOpenAPIConfiguration());
    const res = await api.imagesControllerFindMine();
    return res.data;
  }

  async uploadPhoto(file: File, place: string | undefined): Promise<PhotoResDto> {
    const api = new ImagesApi(getNestOpenAPIConfiguration());
    const res = await api.imagesControllerCreate(file, place);
    return res.data;
  }

  async writeCaptions(id: string): Promise<PhotoResDto> {
    const api = new ImagesApi(getNestOpenAPIConfiguration());
    const res = await api.imagesControllerWriteCaptions(id);
    return res.data;
  }

  async vote(id: string, captionId: string | null): Promise<PhotoResDto> {
    const api = new ImagesApi(getNestOpenAPIConfiguration());
    const res = await api.imagesControllerVote(id, {captionId});
    return res.data;
  }

  async deletePhoto(id: string): Promise<void> {
    const api = new ImagesApi(getNestOpenAPIConfiguration());
    await api.imagesControllerRemove(id);
  }

  async fetchMyStats(): Promise<StatsResDto> {
    const api = new StatsApi(getNestOpenAPIConfiguration());
    const res = await api.statsControllerFindMine();
    return res.data;
  }
}
