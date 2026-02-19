/**
 * Normalizes a video URL for Vidstack player consumption.
 * Converts YouTube and Vimeo URLs to Vidstack-compatible source formats.
 * Local/direct URLs are returned as-is.
 */
export function normalizeVideoSrc(url: string): string {
    if (!url) return '';

    // YouTube: various URL formats → youtube/VIDEO_ID
    const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/
    );
    if (ytMatch) return `youtube/${ytMatch[1]}`;

    // Vimeo: https://vimeo.com/ID → vimeo/ID
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return `vimeo/${vmMatch[1]}`;

    // Local / direct URL — return as-is
    return url;
}
