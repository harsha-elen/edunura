import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    CircularProgress,
    alpha,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import courseService, { Course } from '../services/courseService';
import { profileService, ProfileData } from '../services/profileService';

import { getSettings } from '../services/settings';
import { useThemeContext } from '../context/ThemeContext';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';

const colors = {
    bgLight: '#f6f7f8',
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
};

const fontLexend = { fontFamily: "'Lexend', sans-serif" };

const progressAnimation = keyframes`
    0% { width: 0%; }
    100% { width: 100%; }
`;

const PurchaseSuccess: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { primaryColor } = useThemeContext();
    const id = parseInt(courseId || '0');

    const locationState = (location.state as { orderId?: string; paymentId?: string; isPaid?: boolean }) || {};
    const isPaid = locationState.isPaid || false;
    const orderId = locationState.orderId || null;
    const paymentId = locationState.paymentId || null;

    const [countdown, setCountdown] = useState(5);
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);
    const [userName, setUserName] = useState('');

    // Branding state
    const [siteName, setSiteName] = useState(localStorage.getItem('site_name') || 'LMS Portal');
    const [orgLogo, setOrgLogo] = useState<string | null>(localStorage.getItem('org_logo') || null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [courseResponse, profileResponse] = await Promise.all([
                    courseService.getCourseWithCurriculum(id),
                    profileService.getProfile(),
                ]);
                setCourse(courseResponse.data);
                const profile = profileResponse.data as ProfileData;
                setUserName(profile.first_name || 'Student');
            } catch (error) {
                console.error('Error fetching data:', error);
                setUserName('Student');
            } finally {
                setLoading(false);
            }
        };

        const loadBranding = async () => {
            try {
                const response = await getSettings();
                if (response.status === 'success' && response.data) {
                    if (response.data['site_name']) {
                        setSiteName(response.data['site_name']);
                        localStorage.setItem('site_name', response.data['site_name']);
                    }
                    if (response.data['org_logo']) {
                        setOrgLogo(response.data['org_logo']);
                        localStorage.setItem('org_logo', response.data['org_logo']);
                    }
                }
            } catch (e) {
                // branding is cosmetic, ignore error
            }
        };

        fetchData();
        loadBranding();
    }, [id]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate(`/course/${id}/learn`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate, id]);

    const handleGoToCourse = () => {
        navigate(`/course/${id}/learn`);
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <Box sx={{ bgcolor: colors.bgLight, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: colors.bgLight, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box component="header" sx={{ height: 72, bgcolor: 'white', borderBottom: `1px solid ${colors.slate200}`, display: 'flex', alignItems: 'center', px: { xs: 3, lg: 10 }, position: 'sticky', top: 0, zIndex: 1100 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {orgLogo ? (
                        <Box component="img" src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`} alt={siteName} sx={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                    ) : (
                        <Box sx={{ color: primaryColor, display: 'flex' }}>
                            <svg width="32" height="32" viewBox="0 0 48 48" fill="currentColor">
                                <path d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </Box>
                    )}
                    {!orgLogo && <Typography variant="h6" sx={{ fontWeight: 800, color: colors.slate900, ...fontLexend }}>{siteName}</Typography>}
                </Box>
            </Box>

            <Box component="main" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper elevation={0} sx={{ maxWidth: 540, width: '100%', bgcolor: 'white', borderRadius: 4, border: `1px solid ${colors.slate200}`, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', p: { xs: 4, lg: 6 }, textAlign: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 4 }}>
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7, pointerEvents: 'none' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#60a5fa', position: 'absolute', transform: 'translateX(-48px) translateY(-32px)' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#facc15', position: 'absolute', transform: 'translateX(56px) translateY(24px)' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ade80', position: 'absolute', transform: 'translateX(40px) translateY(-48px)' }} />
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f87171', position: 'absolute', transform: 'translateX(-56px) translateY(40px)' }} />
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#c084fc', position: 'absolute', transform: 'translateX(24px) translateY(56px)' }} />
                        </Box>

                        <Box sx={{ width: 80, height: 80, bgcolor: alpha(primaryColor, 0.1), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 48, fontWeight: 'bold', color: primaryColor }}>check_circle</span>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: colors.slate900, mb: 2, letterSpacing: '-0.02em', ...fontLexend }}>
                            {isPaid ? 'Payment Successful!' : 'Enrollment Successful!'}
                        </Typography>
                        <Typography sx={{ color: colors.slate600, fontSize: '1.125rem', lineHeight: 1.6, ...fontLexend }}>
                            Welcome to the <Box component="span" sx={{ fontWeight: 700, color: primaryColor, fontStyle: 'italic' }}>{course?.title || 'Course'}</Box>, {userName}! Your {isPaid ? 'payment and enrollment are' : 'enrollment is'} complete.
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: colors.slate500, mb: 1.5, ...fontLexend }}>
                            Redirecting to your course in <Box component="span" sx={{ color: colors.slate800, fontWeight: 700 }}>{countdown} seconds</Box>...
                        </Typography>
                        <Box sx={{ width: '100%', height: 6, bgcolor: colors.slate100, borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', bgcolor: primaryColor, borderRadius: 3, animation: `${progressAnimation} 5s linear forwards` }} />
                        </Box>
                    </Box>

                    <Button variant="contained" fullWidth onClick={handleGoToCourse} sx={{ bgcolor: primaryColor, color: 'white', fontWeight: 800, py: 2, borderRadius: 2, textTransform: 'none', fontSize: '1rem', boxShadow: `0 10px 15px -3px ${alpha(primaryColor, 0.2)}`, transition: 'all 0.2s', '&:hover': { bgcolor: alpha(primaryColor, 0.9), transform: 'translateY(-1px)' }, '&:active': { transform: 'scale(0.98)' }, ...fontLexend }} endIcon={<span className="material-symbols-outlined">school</span>}>
                        Start Learning Now
                    </Button>

                    <Box sx={{ mt: 3 }}>
                        <Button variant="text" onClick={handleGoToDashboard} sx={{ color: colors.slate500, fontWeight: 600, ...fontLexend, '&:hover': { color: primaryColor } }}>
                            Go to Dashboard Instead
                        </Button>
                    </Box>

                    <Box sx={{ mt: 5, pt: 4, borderTop: `1px solid ${colors.slate100}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: colors.slate400, fontFamily: 'monospace' }}>
                            {isPaid && orderId ? `Order: ${orderId}` : `Enrollment ID: #ENR-${id}-${Date.now().toString().slice(-6)}`}
                        </Typography>
                        {isPaid && paymentId && (
                            <Typography variant="caption" sx={{ color: colors.slate400, fontFamily: 'monospace' }}>
                                Payment: {paymentId}
                            </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: colors.slate400 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', ...fontLexend }}>{isPaid ? 'Secure Payment' : 'Secure Enrollment'}</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Box component="footer" sx={{ py: 4, borderTop: `1px solid ${colors.slate200}`, bgcolor: 'white', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: colors.slate500, ...fontLexend }}>© {new Date().getFullYear()} {siteName}. All rights reserved.</Typography>
            </Box>
        </Box>
    );
};

export default PurchaseSuccess;
