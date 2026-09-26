import type {MetadataRoute} from "next";
import {getBaseUrl} from "@/lib/common/Constants";

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  return [
    {
      url: `${baseUrl}/w1`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/w2`,
      lastModified: new Date(),
    },
  ];
}
