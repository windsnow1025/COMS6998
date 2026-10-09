import {getBaseUrl} from "@/lib/common/Constants";
import {getServerNestBaseUrl} from "./ServerApi";
import {getWinners} from "./PhotoResults";
import {createRoastPaths} from "./RoastPaths";
import {PhotoResDto} from "@/client/nest";

// What a link preview shows of the photo, as an anonymous viewer sees it
export interface PhotoPreview {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
}

const NotFoundStatuses = [400, 404];

// The preview of the photo's page under the week's base path; null when no photo has the id
export async function fetchPhotoPreview(base: string, id: string): Promise<PhotoPreview | null> {
  const response = await fetch(`${getServerNestBaseUrl()}/images/${encodeURIComponent(id)}`);
  if (NotFoundStatuses.includes(response.status)) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`The photo request answered ${response.status}`);
  }

  const photo: PhotoResDto = await response.json();
  const winner = photo.revealed ? getWinners(photo).at(0) : undefined;
  return {
    id,
    title: winner ? `“${winner.content}”` : "Which roast wins this photo?",
    description: photo.description,
    imageUrl: photo.url,
    pageUrl: `${getBaseUrl()}${createRoastPaths(base).photo(id)}`,
  };
}
