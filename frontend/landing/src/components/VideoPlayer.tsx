'use client';

import { useMemo } from 'react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';

export interface VideoPlayerProps {
    src: string;
    title?: string;
    aspectRatio?: string;
    className?: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    primaryColor?: string;
    thumbnails?: string;
    onTimeUpdate?: (currentTime: number) => void;
    onEnded?: () => void;
}

function normalizeVideoSrc(url: string): string {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) return `youtube/${ytMatch[1]}`;
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return `vimeo/${vmMatch[1]}`;
    return url;
}

const VideoPlayer = ({
    src,
    title = '',
    aspectRatio = '16/9',
    className,
    autoPlay = false,
    muted = false,
    loop = false,
    primaryColor,
    thumbnails,
    onTimeUpdate,
    onEnded,
}: VideoPlayerProps) => {
    const accentColor =
        primaryColor ||
        (typeof window !== 'undefined' ? localStorage.getItem('branding_primary_color') : null) ||
        '#f97316'; // landing brand orange

    const normalizedSrc = useMemo(() => normalizeVideoSrc(src), [src]);

    return (
        <div
            className={className}
            style={{
                width: '100%',
                aspectRatio,
                overflow: 'hidden',
                '--plyr-color-main': accentColor,
            } as React.CSSProperties}
        >
            <MediaPlayer
                title={title}
                src={normalizedSrc}
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                playsInline
                onTimeUpdate={onTimeUpdate ? (e: any) => onTimeUpdate(e.currentTime) : undefined}
                onEnded={onEnded}
                style={{ width: '100%', height: '100%' }}
            >
                <MediaProvider />
                <PlyrLayout icons={plyrLayoutIcons} thumbnails={thumbnails} />
            </MediaPlayer>
        </div>
    );
};

export default VideoPlayer;
