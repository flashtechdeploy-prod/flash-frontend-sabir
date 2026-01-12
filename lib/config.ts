// Hardcoded backend URLs for local and production
const isDevelopment = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE_URL = isDevelopment 
  ? "http://127.0.0.1:8000"
  : "https://flash-backend-sabir.vercel.app";

if (typeof window !== "undefined") {
  console.log("[Config] Frontend API Base URL:", API_BASE_URL);
}

/**
 * Get the full URL for a file/attachment.
 * Handles both B2 cloud URLs (https://...) and local URLs (/uploads/...).
 */
export function getFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If it's already a full URL (B2 or external), return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}
