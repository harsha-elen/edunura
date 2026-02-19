/**
 * Video URL detection and formatting utilities
 * Supports: YouTube, Vimeo, HLS streams, and local video files
 */

export type VideoType = 'youtube' | 'vimeo' | 'hls' | 'video' | 'unknown';

/**
 * Detect video type from URL
 */
export function detectVideoType(url: string): VideoType {
    if (!url) return 'unknown';

    // YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-embed')) {
        return 'youtube';
    }

    // Vimeo URLs
    if (url.includes('vimeo.com')) {
        return 'vimeo';
    }

    // HLS streams (.m3u8 files)
    if (url.includes('.m3u8')) {
        return 'hls';
    }

    // Regular video files
    if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
        return 'video';
    }

    // If it looks like an embed URL, try to determine type
    if (url.includes('embed')) {
        if (url.includes('youtube')) return 'youtube';
        if (url.includes('vimeo')) return 'vimeo';
    }

    return 'unknown';
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;

    // Try youtube.com format: https://www.youtube.com/watch?v=VIDEO_ID
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtube-nocookie\.com\/embed\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (match?.[1]) return match[1];

    // Try youtu.be format: https://youtu.be/VIDEO_ID
    match = url.match(/youtu\.be\/([^?&\n#]+)/);
    if (match?.[1]) return match[1];

    // Try youtube-embed format
    match = url.match(/youtube-embed\.([^/]+)\/([^?&\n#]+)/);
    if (match?.[2]) return match[2];

    // Already an ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    return null;
}

/**
 * Extract Vimeo video ID from URL
 */
export function getVimeoVideoId(url: string): string | null {
    if (!url) return null;

    // Try vimeo.com format: https://vimeo.com/VIDEO_ID
    let match = url.match(/vimeo\.com\/(\d+)/);
    if (match?.[1]) return match[1];

    // Try vimeo.com/channels format
    match = url.match(/vimeo\.com\/channels\/[^/]+\/(\d+)/);
    if (match?.[1]) return match[1];

    // Try vimeo.com/groups format
    match = url.match(/vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/);
    if (match?.[1]) return match[1];

    // Already an ID (numeric)
    if (/^\d+$/.test(url)) return url;

    return null;
}

/**
 * Get embeddable YouTube URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get embeddable Vimeo URL
 */
export function getVimeoEmbedUrl(url: string): string | null {
    const videoId = getVimeoVideoId(url);
    if (!videoId) return null;
    return `https://player.vimeo.com/video/${videoId}`;
}

/**
 * Get embeddable URL for any video source
 */
export function getEmbeddableVideoUrl(url: string): string | null {
    const type = detectVideoType(url);

    switch (type) {
        case 'youtube':
            return getYouTubeEmbedUrl(url);
        case 'vimeo':
            return getVimeoEmbedUrl(url);
        default:
            return url;
    }
}
