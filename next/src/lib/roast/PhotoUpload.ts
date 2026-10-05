import {RoastError} from "./RoastError";

const MaxSide = 1600;
const JpegQuality = 0.85;

// Redraws the photo as a JPEG of at most MaxSide pixels a side.
// The redraw makes a phone photo small enough to upload and drops its metadata, the location included.
export async function preparePhoto(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new RoastError("Your browser cannot read this file as an image. Try a JPEG or PNG.", undefined);
    }

    const scale = Math.min(1, MaxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const context = canvas.getContext("2d")!;
    // JPEG has no transparency
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JpegQuality));
    if (!blob) {
      throw new RoastError("Your browser could not prepare this photo. Try another one.", undefined);
    }
    return new File([blob], "photo.jpg", {type: "image/jpeg"});
  } finally {
    URL.revokeObjectURL(url);
  }
}
