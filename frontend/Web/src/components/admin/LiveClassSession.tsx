'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { getLiveClassSignature } from '@/services/courseService';

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

const LiveClassSession: React.FC<LiveClassSessionProps> = ({ meetingId }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoomConfig, setZoomConfig] = useState<ZoomConfig | null>(null);

    useEffect(() => {
        const initMeeting = async () => {
            if (!meetingId) {
                setError('Invalid meeting ID');
                setLoading(false);
                return;
            }

            try {
                const response = await getLiveClassSignature(meetingId);
                const data = response.data;

                if (!data.signature) {
                    throw new Error('Failed to get meeting signature');
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

                setLoading(false);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } }; message?: string };
                console.error('Failed to get signature:', err);
                setError(error.response?.data?.message || 'Failed to start meeting. Please try again.');
                setLoading(false);
            }
        };

        initMeeting();
    }, [meetingId]);

    useEffect(() => {
        if (!zoomConfig) return;

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
    }, [zoomConfig]);

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

    return (
        <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'black', position: 'relative', overflow: 'hidden' }}>
            <div id="zmmtg-root"></div>
        </Box>
    );
};

export default LiveClassSession;
