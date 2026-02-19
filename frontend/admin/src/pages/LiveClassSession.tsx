import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { courseService } from '../services/courseService';

const LiveClassSession: React.FC = () => {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoomConfig, setZoomConfig] = useState<any>(null);

    useEffect(() => {
        const initMeeting = async () => {
            if (!meetingId) {
                setError('Invalid meeting ID');
                setLoading(false);
                return;
            }

            try {
                // Get signature and config from backend
                const response = await courseService.getLiveClassSignature(meetingId);
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
                    leaveUrl: window.location.origin + '/courses',
                });

                setLoading(false);
            } catch (err: any) {
                console.error('Failed to get signature:', err);
                setError(err.response?.data?.message || 'Failed to start meeting. Please try again.');
                setLoading(false);
            }
        };

        initMeeting();
    }, [meetingId]);

    useEffect(() => {
        if (!zoomConfig) return;

        const initZoom = async () => {
            try {
                // Dynamically import Zoom SDK
                const { ZoomMtg } = await import('@zoom/meetingsdk');

                ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
                ZoomMtg.preLoadWasm();
                ZoomMtg.prepareWebSDK();

                ZoomMtg.init({
                    leaveUrl: zoomConfig.leaveUrl,
                    success: (success: any) => {
                        console.log('ZoomMtg init success', success);
                        
                        ZoomMtg.join({
                            sdkKey: zoomConfig.sdkKey,
                            signature: zoomConfig.signature,
                            meetingNumber: zoomConfig.meetingNumber,
                            userName: zoomConfig.userName,
                            userEmail: zoomConfig.userEmail,
                            passWord: zoomConfig.password,
                            tk: '',
                            success: (result: any) => {
                                console.log('ZoomMtg join success', result);
                            },
                            error: (err: any) => {
                                console.error('ZoomMtg join error', err);
                                setError('Failed to join the meeting. Please try opening in Zoom app.');
                            }
                        });
                    },
                    error: (err: any) => {
                        console.error('ZoomMtg init error', err);
                        setError('Failed to initialize Zoom. Please try opening in Zoom app.');
                    }
                });
            } catch (err: any) {
                console.error('Zoom SDK error:', err);
                setError('Failed to load Zoom. Please try opening in Zoom app.');
            }
        };

        initZoom();

        return () => {
            // Cleanup on unmount
            try {
                // Zoom SDK cleanup is tricky, navigation usually handles it
            } catch (e) {
                // Ignore cleanup errors
            }
        };
    }, [zoomConfig]);

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh', 
                bgcolor: '#1a1a1a',
                color: 'white'
            }}>
                <CircularProgress color="inherit" sx={{ mb: 2 }} />
                <Typography>Connecting to meeting...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh', 
                bgcolor: 'background.default',
                p: 3
            }}>
                <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
                    {error}
                </Alert>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="contained" 
                        onClick={() => navigate('/courses')}
                    >
                        Back to Courses
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'black', position: 'relative', overflow: 'hidden' }}>
            {/* Zoom SDK renders here automatically */}
            <div id="zmmtg-root"></div>
        </Box>
    );
};

export default LiveClassSession;
