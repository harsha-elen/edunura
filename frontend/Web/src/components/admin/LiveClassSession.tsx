'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { getLiveClassSignature, getJitsiConfig, sendHostHeartbeat, endLiveClassSession } from '@/services/courseService';
import { getMeetingPlatform } from '@/services/settings';

interface LiveClassSessionProps {
    meetingId: string;
}

interface ZoomConfig {
    signature: string;
    sdkKey: string;
    userName: string;
    userEmail: string;
    password: string;
    meetingNumber: string;
    leaveUrl: string;
}

interface JitsiMeetingConfig {
    domain: string;
    roomName: string;
    jwt: string;
    jitsiEmbedUrl?: string;  // Pre-built URL with JWT + moderator config hash
    joinUrl: string;
}

type MeetingPlatform = 'zoom' | 'jitsi';

const LiveClassSession: React.FC<LiveClassSessionProps> = ({ meetingId }) => {
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
                        jitsiEmbedUrl: jitsiData.jitsiEmbedUrl,  // Pre-built URL with moderator role
                    joinUrl: jitsiData.joinUrl || `${jitsiData.domain.startsWith('http') ? jitsiData.domain : `https://${jitsiData.domain}`}/${jitsiData.roomName}`,
                    });
                } else {
                    const response = await getLiveClassSignature(meetingId);
                    const data = response.data;

                    if (!data.signature) {
                        throw new Error('Failed to get Zoom meeting signature');
                    }

                    setZoomConfig({
                        signature: data.signature,
                        sdkKey: data.sdkKey,
                        userName: data.userName,
                        userEmail: data.userEmail,
                        password: data.password,
                        meetingNumber: data.meetingNumber,
                        leaveUrl: window.location.origin + '/admin/courses',
                    });
                }

                setLoading(false);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } }; message?: string };
                console.error('Failed to get meeting config:', err);
                setError(error.response?.data?.message || 'Failed to start meeting. Please try again.');
                setLoading(false);
            }
        };

        initMeeting();
    }, [meetingId]);

    // Zoom SDK init
    useEffect(() => {
        if (!zoomConfig || platform !== 'zoom') return;

        const initZoom = async () => {
            try {
                const { ZoomMtg } = await import('@zoom/meetingsdk');

                ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
                ZoomMtg.preLoadWasm();
                ZoomMtg.prepareWebSDK();

                ZoomMtg.init({
                    leaveUrl: zoomConfig.leaveUrl,
                    success: () => {
                        ZoomMtg.join({
                            sdkKey: zoomConfig.sdkKey,
                            signature: zoomConfig.signature,
                            meetingNumber: zoomConfig.meetingNumber,
                            userName: zoomConfig.userName,
                            userEmail: zoomConfig.userEmail,
                            passWord: zoomConfig.password,
                            tk: '',
                            success: () => {
                                console.log('ZoomMtg join success');
                            },
                            error: () => {
                                setError('Failed to join the meeting. Please try opening in Zoom app.');
                            },
                        });
                    },
                    error: () => {
                        setError('Failed to initialize Zoom. Please try opening in Zoom app.');
                    },
                });
            } catch {
                setError('Failed to load Zoom. Please try opening in Zoom app.');
            }
        };

        initZoom();
    }, [zoomConfig, platform]);

    // ─── Host heartbeat: keeps isLive=true while admin is in the meeting ────────
    // Pings every 15s. If tab closes/reloads without postMessage, students see
    // "Waiting for host" after 35s automatically.
    useEffect(() => {
        if (platform !== 'jitsi' || !jitsiConfig || !meetingId) return;
        sendHostHeartbeat(meetingId); // immediate first ping
        const interval = setInterval(() => sendHostHeartbeat(meetingId), 15000);
        return () => clearInterval(interval);
    }, [platform, jitsiConfig, meetingId]);

    // ─── Jitsi Meeting End Handler ────────────────────────────
    // Best-effort instant clear on explicit leave (no need to wait 35s).
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
                    endLiveClassSession(meetingId).finally(() => router.push('/admin/courses'));
                }
            } catch { /* ignore non-JSON messages */ }
        };
        window.addEventListener('message', handleJitsiMessage);
        return () => window.removeEventListener('message', handleJitsiMessage);
    }, [platform, jitsiConfig, meetingId]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#1a1a1a', color: 'white' }}>
                <CircularProgress color="inherit" sx={{ mb: 2 }} />
                <Typography>Connecting to meeting...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: 'background.default', p: 3 }}>
                <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>{error}</Alert>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={() => router.push('/admin/courses')}>Back to Courses</Button>
                    <Button variant="outlined" onClick={() => window.location.reload()}>Try Again</Button>
                </Box>
            </Box>
        );
    }

    // Jitsi embedded iframe
    if (platform === 'jitsi' && jitsiConfig) {
        const baseDomain = jitsiConfig.domain.startsWith('http') ? jitsiConfig.domain : `https://${jitsiConfig.domain}`;
        const fallbackUrl = jitsiConfig.jwt
            ? `${baseDomain}/${jitsiConfig.roomName}?jwt=${jitsiConfig.jwt}`
            : `${baseDomain}/${jitsiConfig.roomName}`;
        // Use pre-built URL (has JWT + moderator toolbar config in hash)
        const jitsiUrl = jitsiConfig.jitsiEmbedUrl || fallbackUrl;

        return (
            <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'black', position: 'relative', overflow: 'hidden' }}>
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

    // Zoom embedded SDK
    return (
        <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'black', position: 'relative', overflow: 'hidden' }}>
            <div id="zmmtg-root"></div>
        </Box>
    );
};

export default LiveClassSession;
