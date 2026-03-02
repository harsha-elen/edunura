'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import * as courseService from '@/services/courseService';
import * as profileService from '@/services/profileService';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';
import * as settingsService from '@/services/settings';

const progressAnimation = keyframes`
    0% { width: 0%; }
    100% { width: 100%; }
`;

interface PurchaseSuccessPageProps {
    courseId: number;
}

export default function PurchaseSuccessPage({ courseId }: PurchaseSuccessPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const theme = useTheme();

    // Query params
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');
    const isPaidParam = searchParams.get('isPaid');
    const isPaid = isPaidParam === 'true';

    // State
    const [countdown, setCountdown] = useState(5);
    const [siteName, setSiteName] = useState('LMS Portal');
    const [orgLogo, setOrgLogo] = useState<string | null>(null);

    // Fetch course
    const {
        data: course,
        isLoading: courseLoading,
    } = useQuery({
        queryKey: ['course', courseId],
        queryFn: async () => {
            try {
                const response = await courseService.getCourse(courseId);
                return response.data || response;
            } catch (err) {
                return null;
            }
        },
        enabled: !!courseId,
    });

    // Fetch profile
    const {
        data: profile,
        isLoading: profileLoading,
    } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            try {
                const response = await profileService.getProfile();
                return response.data || response;
            } catch (err) {
                return null;
            }
        },
    });

    // Load branding settings
    useEffect(() => {
        const loadBranding = async () => {
            try {
                const response = await settingsService.getSettings();
                if (response.status === 'success' && response.data) {
                    if (response.data['site_name']) setSiteName(response.data['site_name']);
                    if (response.data['org_logo']) setOrgLogo(response.data['org_logo']);
                }
            } catch (e) {
                // Branding is cosmetic, don't block
            }
        };
        loadBranding();
    }, []);

    // Countdown redirect
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(`/course/${courseId}/learn`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [courseId, router]);

    const handleGoToCourse = () => {
        router.push(`/course/${courseId}/learn`);
    };

    const handleGoToDashboard = () => {
        router.push('/student');
    };

    const generateEnrollmentId = () => {
        return `ENR-${courseId}-${Date.now().toString().slice(-6)}`;
    };

    if (courseLoading || profileLoading) {
        return (
            <Box
                sx={{
                    bgcolor: theme.palette.background.default,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
                component="header"
                sx={{
                    height: 72,
                    bgcolor: 'background.paper',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    px: { xs: 3, lg: 10 },
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {orgLogo ? (
                        <Box
                            component="img"
                            src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`}
                            alt={siteName}
                            sx={{ height: 64, width: 'auto', objectFit: 'contain' }}
                        />
                    ) : null}
                </Box>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: 540,
                        width: '100%',
                        bgcolor: 'background.paper',
                        borderRadius: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[8],
                        p: { xs: 4, lg: 6 },
                        textAlign: 'center',
                    }}
                >
                    {/* Success Icon */}
                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 4 }}>
                        {/* Decorative dots */}
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, pointerEvents: 'none' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#60a5fa', position: 'absolute', transform: 'translateX(-48px) translateY(-32px)' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#facc15', position: 'absolute', transform: 'translateX(56px) translateY(24px)' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ade80', position: 'absolute', transform: 'translateX(40px) translateY(-48px)' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f87171', position: 'absolute', transform: 'translateX(-56px) translateY(40px)' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#c084fc', position: 'absolute', transform: 'translateX(24px) translateY(56px)' }} />
                        </Box>

                        {/* Icon circle */}
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            <Typography variant="h2" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                                ✓
                            </Typography>
                        </Box>
                    </Box>

                    {/* Success Message */}
                    <Box sx={{ mb: 5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                            {isPaid ? 'Payment Successful!' : 'Enrollment Successful!'}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '1.125rem', lineHeight: 1.6 }}>
                            Welcome to{' '}
                            <Box component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontStyle: 'italic' }}>
                                {course?.title || 'the course'}
                            </Box>
                            , {profile?.first_name || 'Student'}! Your {isPaid ? 'payment and enrollment are' : 'enrollment is'} complete.
                        </Typography>
                    </Box>

                    {/* Countdown Progress */}
                    <Box sx={{ mb: 5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', mb: 1.5 }}>
                            Redirecting to your course in{' '}
                            <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                {countdown} seconds
                            </Box>
                            ...
                        </Typography>
                        <Box sx={{ width: '100%', height: 6, bgcolor: theme.palette.action.hover, borderRadius: 3, overflow: 'hidden' }}>
                            <Box
                                sx={{
                                    height: '100%',
                                    bgcolor: theme.palette.primary.main,
                                    borderRadius: 3,
                                    animation: `${progressAnimation} 5s linear forwards`,
                                }}
                            />
                        </Box>
                    </Box>

                    {/* CTA Buttons */}
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleGoToCourse}
                        sx={{
                            fontWeight: 700,
                            py: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: `0 10px 15px -3px ${alpha(theme.palette.primary.main, 0.2)}`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                            },
                        }}
                    >
                        Start Learning Now
                    </Button>

                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="text"
                            onClick={handleGoToDashboard}
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 600,
                                '&:hover': { color: theme.palette.primary.main },
                            }}
                        >
                            Go to Dashboard Instead
                        </Button>
                    </Box>

                    {/* Footer Details */}
                    <Box sx={{ mt: 5, pt: 4, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: 12 }}>
                            {isPaid && orderId ? `Order: ${orderId}` : `Enrollment ID: ${generateEnrollmentId()}`}
                        </Typography>
                        {isPaid && paymentId && (
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: 12 }}>
                                Payment: {paymentId}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.disabled', mt: 1 }}>
                            <span style={{ fontSize: 16 }}>🔒</span>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {isPaid ? 'Secure Payment' : 'Secure Enrollment'}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    py: 4,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    textAlign: 'center',
                }}
            >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    © {new Date().getFullYear()} {siteName}. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
}
