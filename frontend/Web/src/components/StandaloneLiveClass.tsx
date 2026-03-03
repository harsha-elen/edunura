'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { getLiveClassSignature, getJitsiConfig } from '@/services/courseService';
import { getMeetingPlatform } from '@/services/settings';

interface StandaloneLiveClassProps {
    meetingId: string;
}

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
    jitsiEmbedUrl?: string;
    displayName: string;
    email: string;
    isModerator: boolean;
    joinUrl: string;
}

type MeetingPlatform = 'zoom' | 'jitsi';

const StandaloneLiveClass: React.FC<StandaloneLiveClassProps> = ({ meetingId }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [platform, setPlatform] = useState<MeetingPlatform>('zoom');
    const [zoomConfig, setZoomConfig] = useState<ZoomConfig | null>(null);
    const [jitsiConfig, setJitsiConfig] = useState<JitsiMeetingConfig | null>(null);

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
                        jitsiEmbedUrl: jitsiData.jitsiEmbedUrl,
                        displayName: jitsiData.displayName || 'User',
                        email: jitsiData.email || '',
                        isModerator: jitsiData.isModerator || false,
                        joinUrl: jitsiData.joinUrl || `${jitsiData.domain.startsWith('http') ? jitsiData.domain : `https://${jitsiData.domain}`}/${jitsiData.roomName}`,
                    });
                } else {
                    const response = await getLiveClassSignature(meetingId);
                    const data = response.data;

                    if (!data.signature || !data.joinUrl) {
                        throw new Error('Failed to get meeting details');
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
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } }; message?: string };
                console.error('Failed to get meeting config:', err);
                setError(error.response?.data?.message || error.message || 'Failed to start meeting');
                setLoading(false);
            }
        };

        initMeeting();
    }, [meetingId]);

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
                window.location.href = zoomConfig.joinUrl;
            }, 2000);
        }
    };

    const handleJoinWithPassword = () => {
        if (zoomConfig?.joinUrl && zoomConfig?.password) {
            window.location.href = `${zoomConfig.joinUrl}?pwd=${zoomConfig.password}`;
        }
    };

    const handleJoinJitsi = () => {
        if (jitsiConfig?.joinUrl) {
            const url = jitsiConfig.jwt
                ? `${jitsiConfig.joinUrl}?jwt=${jitsiConfig.jwt}`
                : jitsiConfig.joinUrl;
            window.open(url, '_blank');
        }
    };

    // ─── Jitsi Meeting End Handler ────────────────────────────
    // Listen for Jitsi's postMessage when meeting ends and go back
    useEffect(() => {
        if (platform !== 'jitsi' || !jitsiConfig) return;
        const handleJitsiMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (
                    data?.action === 'ready-to-close' ||
                    data?.action === 'video-conference-left' ||
                    data?.event === 'VIDEO_CONFERENCE_LEFT' ||
                    data?.event === 'READY_TO_CLOSE'
                ) {
                    router.back();
                }
            } catch { /* ignore non-JSON messages */ }
        };
        window.addEventListener('message', handleJitsiMessage);
        return () => window.removeEventListener('message', handleJitsiMessage);
    }, [platform, jitsiConfig]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#1a1a1a', color: 'white', p: 3 }}>
                <CircularProgress color="inherit" sx={{ mb: 3 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Preparing meeting...</Typography>
                <Typography variant="body2" sx={{ color: '#888' }}>Meeting ID: {meetingId}</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#f6f7f8', p: 3 }}>
                <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>{error}</Alert>
                <Button variant="outlined" onClick={() => router.back()}>Go Back</Button>
            </Box>
        );
    }

    // Jitsi meeting UI
    if (platform === 'jitsi' && jitsiConfig) {
        const baseDomain = jitsiConfig.domain.startsWith('http') ? jitsiConfig.domain : `https://${jitsiConfig.domain}`;
        const fallbackUrl = jitsiConfig.jwt
            ? `${baseDomain}/${jitsiConfig.roomName}?jwt=${jitsiConfig.jwt}`
            : `${baseDomain}/${jitsiConfig.roomName}`;
        // Use pre-built URL (has JWT + toolbar hash config) if available
        const jitsiIframeSrc = jitsiConfig.jitsiEmbedUrl || fallbackUrl;

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#1a1a1a' }}>
                <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#111' }}>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                        {jitsiConfig.displayName} &mdash; {jitsiConfig.isModerator ? 'Host' : 'Participant'}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={handleJoinJitsi}
                        sx={{ color: 'white', borderColor: '#444', textTransform: 'none', '&:hover': { borderColor: '#666' } }}
                    >
                        Open in New Tab
                    </Button>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <iframe
                        key={jitsiConfig.roomName}
                        src={jitsiIframeSrc}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                        title="Jitsi Meeting"
                    />
                </Box>
            </Box>
        );
    }

    // Zoom meeting UI
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#1a1a1a', color: 'white', p: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Ready to Join</Typography>
                <Typography variant="body1" sx={{ color: '#888', mb: 1 }}>Meeting: {zoomConfig?.meetingNumber}</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>Role: {zoomConfig?.isHost ? 'Host (Instructor)' : 'Participant'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleJoinWithPassword}
                    sx={{ py: 2, bgcolor: '#2D8CFF', fontSize: '1.1rem', fontWeight: 600, '&:hover': { bgcolor: '#1A7AFF' } }}
                >
                    Join Meeting
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={handleJoinInBrowser}
                    sx={{ py: 2, color: 'white', borderColor: '#444', fontSize: '1rem', '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' } }}
                >
                    Open in Browser (Zoom Web)
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={handleOpenZoomApp}
                    sx={{ py: 2, color: '#2D8CFF', borderColor: '#2D8CFF', fontSize: '1rem', '&:hover': { bgcolor: 'rgba(45,140,255,0.1)' } }}
                >
                    Open Zoom App
                </Button>
            </Box>

            <Typography variant="caption" sx={{ color: '#555', mt: 4 }}>
                You&apos;ll be redirected to join the meeting
            </Typography>
        </Box>
    );
};

export default StandaloneLiveClass;
