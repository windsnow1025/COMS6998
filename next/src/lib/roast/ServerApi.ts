import {getBaseUrl} from "@/lib/common/Constants";

// The Nest API's base URL as the Next server reaches it.
// The browser's base URL is a path on the site's own origin in production, which a server-side request has to complete.
export function getServerNestBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_NEST_API_BASE_URL!;
  return baseUrl.startsWith("/") ? `${getBaseUrl()}${baseUrl}` : baseUrl;
}
