'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { getLiveClassSignature, getJitsiConfig, sendHostHeartbeat, endLiveClassSession } from '@/services/courseService';
import { getMeetingPlatform, getOrgLogoUrl } from '@/services/settings';
import JitsiMeetingComponent from '@/components/JitsiMeetingComponent';

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
    jwt?: string;
    displayName: string;
    email: string;
    isModerator: boolean;
}

type MeetingPlatform = 'zoom' | 'jitsi';

const StandaloneLiveClass: React.FC<StandaloneLiveClassProps> = ({ meetingId }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [platform, setPlatform] = useState<MeetingPlatform>('zoom');
    const [zoomConfig, setZoomConfig] = useState<ZoomConfig | null>(null);
    const [jitsiConfig, setJitsiConfig] = useState<JitsiMeetingConfig | null>(null);
    const [orgLogoUrl, setOrgLogoUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        const initMeeting = async () => {
            if (!meetingId) {
                setError('Invalid meeting ID');
                setLoading(false);
                return;
            }

            try {
                const [activePlatform, logoUrl] = await Promise.all([getMeetingPlatform(), getOrgLogoUrl()]);
                setPlatform(activePlatform);
                setOrgLogoUrl(logoUrl);

                if (activePlatform === 'jitsi') {
                    const jitsiResponse = await getJitsiConfig(meetingId);
                    const jitsiData = jitsiResponse.data;

                    console.log('[JITSI] Response data:', jitsiData);

                    if (!jitsiData?.domain || !jitsiData?.roomName) {
                        throw new Error('Failed to get meeting details');
                    }

                    console.log('[JITSI] isModerator from API:', jitsiData.isModerator);

                    setJitsiConfig({
                        domain: jitsiData.domain,
                        roomName: jitsiData.roomName,
                        jwt: jitsiData.jwt,
                        displayName: jitsiData.displayName || 'User',
                        email: jitsiData.email || '',
                        isModerator: jitsiData.isModerator || false,
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
                const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
                console.error('Failed to get meeting config:', err);
                // 425 = host not in room — show waiting UI instead of error
                if (error.response?.status === 425) {
                    setError('The host has not started the meeting yet. Please wait and try again.');
                } else {
                    setError(error.response?.data?.message || error.message || 'Failed to start meeting');
                }
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

    const handleJitsiConferenceLeft = () => {
        // If user was a moderator/host, clear the heartbeat on the backend
        if (jitsiConfig?.isModerator) {
            endLiveClassSession(meetingId).catch(console.error);
        }
        router.back();
    };

    const handleSendHeartbeat = useCallback(() => {
        sendHostHeartbeat(meetingId).catch(console.error);
    }, [meetingId]);

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

    if (platform === 'jitsi' && jitsiConfig) {
        return (
            <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#1a1a1a' }}>
                <JitsiMeetingComponent
                    domain={jitsiConfig.domain}
                    roomName={jitsiConfig.roomName}
                    jwt={jitsiConfig.jwt}
                    displayName={jitsiConfig.displayName}
                    email={jitsiConfig.email}
                    isModerator={jitsiConfig.isModerator}
                    logoUrl={orgLogoUrl}
                    onConferenceLeft={handleJitsiConferenceLeft}
                    sendHeartbeat={jitsiConfig.isModerator ? handleSendHeartbeat : undefined}
                />
            </Box>
        );
    }

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
