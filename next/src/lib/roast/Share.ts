export interface ShareContent {
  title: string;
  text: string;
  url: string;
}

export type ShareResult = "shared" | "copied" | "cancelled";

// Opens the device's share sheet where the browser has one, and copies the text and link otherwise.
export async function share(content: ShareContent): Promise<ShareResult> {
  if (!navigator.share) {
    await navigator.clipboard.writeText(`${content.text}\n${content.url}`);
    return "copied";
  }

  try {
    await navigator.share(content);
    return "shared";
  } catch (error) {
    // The user closed the share sheet
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    throw error;
  }
}
