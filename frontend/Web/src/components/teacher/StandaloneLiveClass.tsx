'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { Videocam as VideocamIcon } from '@mui/icons-material';
import { getLiveClassSignature, getJitsiConfig, sendHostHeartbeat, endLiveClassSession } from '@/services/courseService';
import { getMeetingPlatform } from '@/services/settings';

interface ZoomConfig {
    signature: string;
    sdkKey: string;
    userName: string;
    userEmail: string;
    password: string;
    meetingNumber: string;
    joinUrl: string;
    role: number;
    isHost: boolean;
}

interface JitsiMeetingConfig {
    domain: string;
    roomName: string;
    jwt: string;
    jitsiEmbedUrl?: string;  // Pre-built URL with JWT + config hash params
    displayName: string;
    email: string;
    isModerator: boolean;
    joinUrl: string;
}

type MeetingPlatform = 'zoom' | 'jitsi';

const StandaloneLiveClass: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const meetingId = params?.meetingId as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [platform, setPlatform] = useState<MeetingPlatform>('zoom');
    const [zoomConfig, setZoomConfig] = useState<ZoomConfig | null>(null);
    const [jitsiConfig, setJitsiConfig] = useState<JitsiMeetingConfig | null>(null);
    const [jitsiStarted, setJitsiStarted] = useState(false);

    useEffect(() => {
        const initMeeting = async () => {
            if (!meetingId) {
                setError('Invalid meeting ID');
                setLoading(false);
                return;
            }

            try {
                const activePlatform = await getMeetingPlatform();
                setPlatform(activePlatform);

                if (activePlatform === 'jitsi') {
                    const jitsiResponse = await getJitsiConfig(meetingId);
                    const jitsiData = jitsiResponse.data;

                    if (!jitsiData?.domain || !jitsiData?.roomName) {
                        throw new Error('Failed to get Jitsi meeting details');
                    }

                    setJitsiConfig({
                        domain: jitsiData.domain,
                        roomName: jitsiData.roomName,
                        jwt: jitsiData.jwt || '',
                        jitsiEmbedUrl: jitsiData.jitsiEmbedUrl,  // Pre-built URL with config hash
                        displayName: jitsiData.displayName || 'User',
                        email: jitsiData.email || '',
                        isModerator: jitsiData.isModerator || false,
                        joinUrl: jitsiData.joinUrl || `${jitsiData.domain.startsWith('http') ? jitsiData.domain : `https://${jitsiData.domain}`}/${jitsiData.roomName}`,
                    });
                } else {
                    const response = await getLiveClassSignature(meetingId);
                    const data = response.data;

                    if (!data.signature || !data.joinUrl) {
                        throw new Error('Failed to get Zoom meeting details');
                    }

                    setZoomConfig({
                        signature: data.signature,
                        sdkKey: data.sdkKey,
                        userName: data.userName,
                        userEmail: data.userEmail,
                        password: data.password,
                        meetingNumber: data.meetingNumber,
                        joinUrl: data.joinUrl,
                        role: data.role,
                        isHost: data.isHost,
                    });
                }

                setLoading(false);
            } catch (err: any) {
                console.error('Failed to get meeting config:', err);
                const errorMsg = err.response?.data?.message || err.message || 'Failed to start meeting';
                setError(errorMsg);
                setLoading(false);
            }
        };

        initMeeting();
    }, [meetingId]);

    // ─── Zoom Handlers ────────────────────────────────────────

    const handleJoinMeeting = () => {
        if (zoomConfig?.joinUrl && zoomConfig?.password) {
            const joinWithPass = `${zoomConfig.joinUrl}?pwd=${zoomConfig.password}`;
            window.location.href = joinWithPass;
        } else if (zoomConfig?.joinUrl) {
            window.location.href = zoomConfig.joinUrl;
        }
    };

    const handleJoinInBrowser = () => {
        if (zoomConfig?.joinUrl) {
            window.location.href = zoomConfig.joinUrl;
        }
    };

    const handleOpenZoomApp = () => {
        if (zoomConfig?.joinUrl) {
            const zoomAppUrl = zoomConfig.joinUrl.replace('https://zoom.us/', 'zoomus://');
            window.location.href = zoomAppUrl;
            setTimeout(() => {
                if (zoomConfig?.joinUrl) window.location.href = zoomConfig.joinUrl;
            }, 2000);
        }
    };

    // ─── Jitsi Handlers ───────────────────────────────────────

    const handleJoinJitsi = () => {
        if (jitsiConfig) {
            // Use pre-built URL if available (has config hash), else build manually
            const baseDomain = jitsiConfig.domain.startsWith('http') ? jitsiConfig.domain : `https://${jitsiConfig.domain}`;
            const fallback = jitsiConfig.jwt ? `${baseDomain}/${jitsiConfig.roomName}?jwt=${jitsiConfig.jwt}` : `${baseDomain}/${jitsiConfig.roomName}`;
            const url = jitsiConfig.jitsiEmbedUrl || fallback;
            window.open(url, '_blank');
        }
    };

    const handleEmbedJitsi = () => {
        setJitsiStarted(true);
    };

    // ─── Jitsi Meeting End Handler ────────────────────────────
    // Listen for Jitsi's postMessage when meeting ends:
    // 1. Reset host_joined_at so students can no longer join
    // 2. Navigate back
    useEffect(() => {
        if (!jitsiStarted) return;
        const handleJitsiMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (
                    data?.action === 'ready-to-close' ||
                    data?.action === 'video-conference-left' ||
                    data?.event === 'VIDEO_CONFERENCE_LEFT' ||
                    data?.event === 'READY_TO_CLOSE'
                ) {
                    endLiveClassSession(meetingId).finally(() => router.back());
                }
            } catch { /* ignore non-JSON messages */ }
        };
        window.addEventListener('message', handleJitsiMessage);
        return () => window.removeEventListener('message', handleJitsiMessage);
    }, [jitsiStarted, meetingId]);

    // ─── Loading State ────────────────────────────────────────

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                bgcolor: '#1a1a1a',
                color: 'white',
                p: 3,
            }}>
                <CircularProgress color="inherit" sx={{ mb: 3 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Preparing meeting...</Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>Meeting ID: {meetingId}</Typography>
            </Box>
        );
    }

    // ─── Error State ──────────────────────────────────────────

    if (error) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                bgcolor: '#f6f7f8',
                p: 3,
            }}>
                <Box sx={{ bgcolor: '#fff', border: '1px solid #e7edf3', borderRadius: 2, p: 4, maxWidth: 500, textAlign: 'center' }}>
                    <VideocamIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, color: '#0d141b' }}>Unable to Load Meeting</Typography>
                    <Typography sx={{ mb: 3, color: '#4c739a' }}>{error}</Typography>
                    <Button variant="outlined" onClick={() => router.back()}>Go Back</Button>
                </Box>
            </Box>
        );
    }

    // ─── Jitsi Embedded View ──────────────────────────────────

    if (platform === 'jitsi' && jitsiStarted && jitsiConfig) {
        // Prefer the pre-built URL (includes JWT + toolbar config in hash), fall back to manual
        const baseDomain = jitsiConfig.domain.startsWith('http') ? jitsiConfig.domain : `https://${jitsiConfig.domain}`;
        const fallbackUrl = jitsiConfig.jwt
            ? `${baseDomain}/${jitsiConfig.roomName}?jwt=${jitsiConfig.jwt}`
            : `${baseDomain}/${jitsiConfig.roomName}`;
        const jitsiUrl = jitsiConfig.jitsiEmbedUrl || fallbackUrl;

        return (
            <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'black', position: 'relative' }}>
                <iframe
                    key={jitsiConfig.roomName}
                    src={jitsiUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                    title="Jitsi Meeting"
                />
            </Box>
        );
    }

    // ─── Jitsi Ready View ─────────────────────────────────────

    if (platform === 'jitsi' && jitsiConfig) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                bgcolor: '#1a1a1a',
                color: 'white',
                p: 3,
            }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                        Ready to Join
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#888', mb: 1 }}>
                        Jitsi Meeting: {jitsiConfig.roomName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                        Role: {jitsiConfig.isModerator ? 'Moderator (Instructor)' : 'Participant'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleEmbedJitsi}
                        sx={{
                            py: 2,
                            bgcolor: '#246FE0',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#1A5CD8' },
                        }}
                    >
                        Join Meeting Here
                    </Button>

                    <Button
                        variant="outlined"
                        size="large"
                        onClick={handleJoinJitsi}
                        sx={{
                            py: 2,
                            color: 'white',
                            borderColor: '#444',
                            fontSize: '1rem',
                            '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' },
                        }}
                    >
                        Open in New Tab
                    </Button>
                </Box>

                <Typography variant="caption" sx={{ color: '#555', mt: 4 }}>
                    Powered by Jitsi Meet
                </Typography>
            </Box>
        );
    }

    // ─── Zoom Ready View ──────────────────────────────────────

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            bgcolor: '#1a1a1a',
            color: 'white',
            p: 3,
        }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                    Ready to Join
                </Typography>
                <Typography variant="body1" sx={{ color: '#888', mb: 1 }}>
                    Meeting: {zoomConfig?.meetingNumber}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                    Role: {zoomConfig?.isHost ? 'Host (Instructor)' : 'Participant'}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleJoinMeeting}
                    sx={{
                        py: 2,
                        bgcolor: '#2D8CFF',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#1A7AFF' },
                    }}
                >
                    Join Meeting
                </Button>

                <Button
                    variant="outlined"
                    size="large"
                    onClick={handleJoinInBrowser}
                    sx={{
                        py: 2,
                        color: 'white',
                        borderColor: '#444',
                        fontSize: '1rem',
                        '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' },
                    }}
                >
                    Open in Browser (Zoom Web)
                </Button>

                <Button
                    variant="outlined"
                    size="large"
                    onClick={handleOpenZoomApp}
                    sx={{
                        py: 2,
                        color: '#2D8CFF',
                        borderColor: '#2D8CFF',
                        fontSize: '1rem',
                        '&:hover': { bgcolor: 'rgba(45,140,255,0.1)' },
                    }}
                >
                    Open Zoom App
                </Button>
            </Box>

            <Typography variant="caption" sx={{ color: '#555', mt: 4 }}>
                You'll be redirected to join the meeting
            </Typography>
        </Box>
    );
};

export default StandaloneLiveClass;
