import RoastClient, {TopRange} from "./RoastClient";
import {toRoastError} from "./RoastError";
import {BatchResDto, BatchSummaryResDto, PhotoResDto, StatsResDto} from "@/client/nest";

export default class RoastLogic {
  private roastClient: RoastClient;

  constructor() {
    this.roastClient = new RoastClient();
  }

  async fetchTodayBatch(): Promise<BatchResDto> {
    try {
      return await this.roastClient.fetchTodayBatch();
    } catch (error) {
      throw toRoastError(error, "Today's batch did not load. Try again.");
    }
  }

  async fetchBatch(date: string): Promise<BatchResDto> {
    try {
      return await this.roastClient.fetchBatch(date);
    } catch (error) {
      throw toRoastError(error, "The batch did not load. Try again.");
    }
  }

  async fetchRecentBatches(): Promise<BatchSummaryResDto[]> {
    try {
      return await this.roastClient.fetchRecentBatches();
    } catch (error) {
      throw toRoastError(error, "The batches did not load. Try again.");
    }
  }

  async fetchPhoto(id: string): Promise<PhotoResDto> {
    try {
      return await this.roastClient.fetchPhoto(id);
    } catch (error) {
      throw toRoastError(error, "The photo did not load. Try again.");
    }
  }

  async fetchTopPhotos(range: TopRange, limit: number, offset: number): Promise<PhotoResDto[]> {
    try {
      return await this.roastClient.fetchTopPhotos(range, limit, offset);
    } catch (error) {
      throw toRoastError(error, "The top roasts did not load. Try again.");
    }
  }

  async fetchMyPhotos(): Promise<PhotoResDto[]> {
    try {
      return await this.roastClient.fetchMyPhotos();
    } catch (error) {
      throw toRoastError(error, "Your photos did not load. Try again.");
    }
  }

  async uploadPhoto(file: File, place: string): Promise<PhotoResDto> {
    try {
      return await this.roastClient.uploadPhoto(file, place.trim() || undefined);
    } catch (error) {
      throw toRoastError(error, "The upload failed. Try again.");
    }
  }

  async writeCaptions(id: string): Promise<PhotoResDto> {
    try {
      return await this.roastClient.writeCaptions(id);
    } catch (error) {
      throw toRoastError(error, "The roast failed. Try again.");
    }
  }

  async vote(id: string, captionId: string | null): Promise<PhotoResDto> {
    try {
      return await this.roastClient.vote(id, captionId);
    } catch (error) {
      throw toRoastError(error, "Your vote did not go through. Try again.");
    }
  }

  async deletePhoto(id: string): Promise<void> {
    try {
      await this.roastClient.deletePhoto(id);
    } catch (error) {
      throw toRoastError(error, "The photo was not deleted. Try again.");
    }
  }

  async fetchMyStats(): Promise<StatsResDto> {
    try {
      return await this.roastClient.fetchMyStats();
    } catch (error) {
      throw toRoastError(error, "Your stats did not load. Try again.");
    }
  }
}
