import axios from "axios";

// An error whose message is written for the user
export class RoastError extends Error {
  // The HTTP status of the response; undefined when no response arrived
  status: number | undefined;

  constructor(message: string, status: number | undefined) {
    super(message);
    this.status = status;
  }
}

// The API words its 4xx messages for the user; any other failure gets the fallback message.
export function toRoastError(error: unknown, fallbackMessage: string): RoastError {
  if (!axios.isAxiosError(error) || !error.response) {
    return new RoastError(fallbackMessage, undefined);
  }

  const status = error.response.status;
  const message: unknown = error.response.data?.message;
  if (status >= 400 && status < 500) {
    if (typeof message === "string") {
      return new RoastError(message, status);
    }
    if (Array.isArray(message)) {
      return new RoastError(message.join(". "), status);
    }
  }
  return new RoastError(fallbackMessage, status);
}
