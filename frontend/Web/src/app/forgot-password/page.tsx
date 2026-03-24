'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Link,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    GridView as GridViewIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    VpnKey as VpnKeyIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { forgotPasswordApi, resetPasswordApi } from '@/services/authService';
import { STATIC_ASSETS_BASE_URL, API_BASE_URL } from '@/services/apiClient';

const ForgotPasswordPage: React.FC = () => {
    const router = useRouter();
    const theme = useTheme();

    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    
    // OTP & Reset State
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Hydration & Theme State
    const [orgLogo, setOrgLogo] = useState<string | null>(null);
    const [siteName, setSiteName] = useState('LMS Enterprise');
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
        
        const savedLogo = localStorage.getItem('org_logo');
        const savedName = localStorage.getItem('site_name');
        if (savedLogo) setOrgLogo(savedLogo);
        if (savedName) setSiteName(savedName);

        fetch(`${API_BASE_URL}/settings`)
            .then(r => r.json())
            .then(data => {
                const logo = data?.data?.org_logo;
                if (logo) {
                    setOrgLogo(logo);
                    localStorage.setItem('org_logo', logo);
                }
                const name = data?.data?.site_name;
                if (name) {
                    setSiteName(name);
                    localStorage.setItem('site_name', name);
                }
            })
            .catch(() => { });
    }, []);

    // OTP Timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await forgotPasswordApi(email.trim());

            if (response.status === 'success') {
                setStep('reset');
                setSuccessMessage('If the email exists, a password reset code has been sent.');
                setResendTimer(60);
            } else {
                setError('Failed to send verification code. Please try again.');
            }
        } catch (err: any) {
            // generic fallback
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await resetPasswordApi({
                email: email.trim(),
                otp: otp.trim(),
                newPassword: newPassword,
            });

            if (response.status === 'success') {
                setSuccessMessage('Password reset successfully. Redirecting to login...');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setError('Password reset failed. Please check the code and try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired reset code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await forgotPasswordApi(email.trim());
            setSuccessMessage('A new reset code has been sent to your email.');
            setResendTimer(60);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend code. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                backgroundImage: `radial-gradient(${theme.palette.primary.main} 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
                backgroundColor: '#f6f7f8',
            }}
        >
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 480, zIndex: 10 }}>
                {/* Back to Login link */}
                <Box sx={{ mb: 2 }}>
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => step === 'reset' ? setStep('email') : router.push('/login')}
                        sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
                    >
                        {step === 'reset' ? 'Back' : 'Back to Login'}
                    </Button>
                </Box>

                <Paper
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'grey.200',
                    }}
                >
                    <Box sx={{ px: 4, pt: 5, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        {isHydrated && orgLogo ? (
                            <Box
                                component="img"
                                src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`}
                                alt={siteName}
                                sx={{ height: 60, width: 'auto', maxWidth: '100%', objectFit: 'contain', mb: 3 }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3,
                                    color: theme.palette.primary.main,
                                }}
                            >
                                <GridViewIcon fontSize="large" />
                            </Box>
                        )}
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                            {step === 'email' ? 'Forgot Password?' : 'Enter Reset Code'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {step === 'email' 
                                ? "Enter your email address and we'll send you a secure code to reset your password." 
                                : `We sent a 6-digit code to ${email}`}
                        </Typography>
                    </Box>

                    {/* EMAIL STEP */}
                    {step === 'email' && (
                        <Box component="form" onSubmit={handleSendCode} sx={{ px: 4, pb: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {error && <Alert severity="error">{error}</Alert>}

                            <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    Email Address
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="john.doe@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading || !email}
                                sx={{
                                    mt: 2,
                                    py: 1.25,
                                    bgcolor: theme.palette.primary.main,
                                    '&:hover': { bgcolor: theme.palette.primary.dark },
                                    '&:disabled': { bgcolor: alpha(theme.palette.primary.main, 0.5) },
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    boxShadow: `0 4px 6px -1px ${alpha(theme.palette.primary.main, 0.2)}`,
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
                            </Button>
                        </Box>
                    )}

                    {/* NEW PASSWORD & OTP STEP */}
                    {step === 'reset' && (
                        <Box component="form" onSubmit={handleResetPassword} sx={{ px: 4, pb: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {successMessage && <Alert severity="success">{successMessage}</Alert>}
                            {error && <Alert severity="error">{error}</Alert>}

                            <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    6-Digit Reset Code
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    disabled={loading}
                                    inputProps={{ maxLength: 6, style: { fontSize: '1.2rem', letterSpacing: '8px', textAlign: 'center' } }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <VpnKeyIcon sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    New Password
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Enter your new password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    disabled={loading}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Box>
                            
                            <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    Confirm New Password
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Confirm your new password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading || otp.length < 6 || !newPassword || !confirmPassword}
                                sx={{
                                    py: 1.25,
                                    bgcolor: theme.palette.primary.main,
                                    '&:hover': { bgcolor: theme.palette.primary.dark },
                                    '&:disabled': { bgcolor: alpha(theme.palette.primary.main, 0.5) },
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    boxShadow: `0 4px 6px -1px ${alpha(theme.palette.primary.main, 0.2)}`,
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                            </Button>

                            <Box sx={{ mt: 1, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Didn't receive the code?
                                </Typography>
                                <Button
                                    onClick={handleResendCode}
                                    disabled={resendTimer > 0 || loading}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                                </Button>
                            </Box>
                        </Box>
                    )}

                </Paper>
            </Box>
        </Box>
    );
};

export default ForgotPasswordPage;
