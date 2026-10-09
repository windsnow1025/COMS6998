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
    {
      url: `${baseUrl}/w3`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/w3/profile`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/w4`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/w4/top`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/w5`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/w5/top`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about/privacy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about/terms`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about/policy`,
      lastModified: new Date(),
    },
  ];
}
