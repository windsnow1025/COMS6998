export interface ImageType {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: string;
}

// Reads the image format from the file's leading bytes; null for any other content.
export function detectImageType(data: Buffer): ImageType | null {
  if (data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return { mediaType: 'image/jpeg', extension: 'jpg' };
  }
  if (
    data
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mediaType: 'image/png', extension: 'png' };
  }
  if (
    data.subarray(0, 4).toString('latin1') === 'RIFF' &&
    data.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return { mediaType: 'image/webp', extension: 'webp' };
  }
  return null;
}
