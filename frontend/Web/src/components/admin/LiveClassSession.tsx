'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { getLiveClassSignature, getJitsiConfig, sendHostHeartbeat, endLiveClassSession } from '@/services/courseService';
import { getMeetingPlatform, getOrgLogoUrl } from '@/services/settings';
import JitsiMeetingComponent from '@/components/JitsiMeetingComponent';

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
    jwt?: string;
    displayName: string;
    email: string;
    isModerator: boolean;
}

type MeetingPlatform = 'zoom' | 'jitsi';

const LiveClassSession: React.FC<LiveClassSessionProps> = ({ meetingId }) => {
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

                    console.log('[JITSI ADMIN] Response data:', jitsiData);

                    if (!jitsiData?.domain || !jitsiData?.roomName) {
                        throw new Error('Failed to get meeting details');
                    }

                    console.log('[JITSI ADMIN] isModerator from API:', jitsiData.isModerator);

                    setJitsiConfig({
                        domain: jitsiData.domain,
                        roomName: jitsiData.roomName,
                        jwt: jitsiData.jwt,
                        displayName: jitsiData.displayName || 'Admin',
                        email: jitsiData.email || '',
                        isModerator: jitsiData.isModerator || true,
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
                setError(error.response?.data?.message || error.message || 'Failed to start meeting. Please try again.');
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

    const handleSendHeartbeat = () => {
        // Use jitsi room name (not numeric ID) to match student polling key
        const heartbeatKey = jitsiConfig?.roomName || meetingId;
        sendHostHeartbeat(heartbeatKey).catch(console.error);
    };

    const handleJitsiConferenceLeft = () => {
        // Use same key as heartbeat to correctly clear the in-memory entry
        const endKey = jitsiConfig?.roomName || meetingId;
        endLiveClassSession(endKey).finally(() => router.push('/admin/courses'));
    };

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

    // Jitsi with SDK Component
    if (platform === 'jitsi' && jitsiConfig) {
        return (
            <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'black' }}>
                <JitsiMeetingComponent
                    domain={jitsiConfig.domain}
                    roomName={jitsiConfig.roomName}
                    jwt={jitsiConfig.jwt}
                    displayName={jitsiConfig.displayName}
                    email={jitsiConfig.email}
                    isModerator={jitsiConfig.isModerator}
                    logoUrl={orgLogoUrl}
                    sendHeartbeat={handleSendHeartbeat}
                    onConferenceLeft={handleJitsiConferenceLeft}
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
