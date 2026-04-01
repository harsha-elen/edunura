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
    Checkbox,
    FormControlLabel,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    GridView as GridViewIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { login as loginApi, verify2FA } from '@/services/authService';
import { STATIC_ASSETS_BASE_URL, API_BASE_URL } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';

const Login: React.FC = () => {
    const router = useRouter();
    const { login } = useAuth();
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step2FA, setStep2FA] = useState(false);
    const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [orgLogo, setOrgLogo] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('org_logo') : null);
    const [siteName, setSiteName] = useState(typeof window !== 'undefined' ? localStorage.getItem('site_name') || 'LMS Enterprise' : 'LMS Enterprise');
    const [safeNext, setSafeNext] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const nextParam = new URLSearchParams(window.location.search).get('next') || '';
        if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
            setSafeNext(nextParam);
        }
    }, []);

    useEffect(() => {
        console.log('[Login Page] API Base URL:', API_BASE_URL);
        console.log('[Login Page] Fetching organization settings...');
        fetch(`${API_BASE_URL}/settings`)
            .then(r => {
                console.log('[Login Page] Settings response status:', r.status);
                return r.json();
            })
            .then(data => {
                console.log('[Login Page] Settings data received:', data);
                const logo = data?.data?.org_logo;
                if (logo) {
                    setOrgLogo(logo);
                    localStorage.setItem('org_logo', logo);
                    console.log('[Login Page] Logo set:', logo);
                }
                const name = data?.data?.site_name;
                if (name) {
                    setSiteName(name);
                    localStorage.setItem('site_name', name);
                    console.log('[Login Page] Site name set:', name);
                }
            })
            .catch((err) => {
                console.error('[Login Page] Failed to fetch settings:', err);
            });
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log('[Login Page] Login attempt started with email:', email);
        console.log('[Login Page] API Base URL being used:', API_BASE_URL);

        try {
            if (step2FA) {
                const response = await verify2FA(otpCode, tempToken);
                if (response.status === 'success' && response.data?.user && response.data?.token) {
                    login(response.data.token, response.data.user as any, response.data.refreshToken!, safeNext);
                } else {
                    setError('Invalid verification code.');
                    setLoading(false);
                }
            } else if (emailVerificationRequired) {
                // Verify email during login
                if (!otpCode || otpCode.length < 6) {
                    setError('Please enter the 6-digit code sent to your email.');
                    setLoading(false);
                    return;
                }
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/verify-email-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email.trim(), otp: otpCode.trim() }),
                    });
                    const data = await response.json();
                    if (data.status === 'success' && data.data?.user && data.data?.token) {
                        login(data.data.token, data.data.user as any, data.data.refreshToken!, safeNext);
                    } else {
                        setError(data.message || 'Verification failed. Please try again.');
                        setLoading(false);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to verify email.');
                    setLoading(false);
                }
            } else {
                console.log('[Login Page] Calling login API...');
                const response = await loginApi({ email, password });
                console.log('[Login Page] Login response received:', response);

                if (response.status === 'success' && response.data) {
                    if (response.data.requires2FA) {
                        setStep2FA(true);
                        setTempToken(response.data.tempToken!);
                        setLoading(false);
                        return;
                    }
                    if (response.data.requiresEmailVerification) {
                        // Email verification required
                        setEmailVerificationRequired(true);
                        setResendTimer(60);
                        setLoading(false);
                        setError('');
                        setOtpCode('');
                        return;
                    }
                    console.log('[Login Page] Login successful! User:', response.data.user);
                    login(response.data.token!, response.data.user as any, response.data.refreshToken!, safeNext);
                } else {
                    console.warn('[Login Page] Login response status not success:', response.status);
                    setError('Login failed. Please check your credentials.');
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error('[Login Page] Login error:', err);
            console.error('[Login Page] Error response:', err.response?.data);
            console.error('[Login Page] Error message:', err.message);
            setError(err.response?.data?.message || 'Login failed. Please try again.');
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;
        setError('');
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await response.json();
            if (data.data?.requiresEmailVerification) {
                setResendTimer(60);
                setError('');
            } else {
                setError('Failed to resend code. Please try again.');
            }
        } catch (err: any) {
            setError('Failed to resend code. Please try again.');
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
                <Paper
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'grey.200',
                    }}
                >
                    {/* Header Section */}
                    <Box sx={{ px: 4, pt: 5, pb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        {orgLogo ? (
                            <Box
                                component="img"
                                src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`}
                                alt="Logo"
                                sx={{ height: 80, width: 'auto', maxWidth: '85%', objectFit: 'contain', mb: 3 }}
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
                            LMS Portal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to access your dashboard.
                        </Typography>
                    </Box>

                    {/* Form Section */}
                    <Box component="form" onSubmit={handleSubmit} sx={{ px: 4, pb: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        {!step2FA && !emailVerificationRequired ? (
                            <>
                                <Box>
                                    <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                        Email Address
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        id="email"
                                        placeholder="you@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
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

                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={500} sx={{ color: 'text.primary' }}>
                                            Password
                                        </Typography>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        id="password"
                                        placeholder="Enter your password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
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
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                    <FormControlLabel
                                        control={<Checkbox defaultChecked size="small" sx={{
                                            color: 'grey.400',
                                            '&.Mui-checked': { color: theme.palette.primary.main }
                                        }} />}
                                        label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                                    />
                                    <Link href="/forgot-password" variant="body2" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                                        Forgot Password?
                                    </Link>
                                </Box>
                            </>
                        ) : step2FA ? (
                            <Box>
                                <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary' }}>
                                    Your account is protected by Two-Factor Authentication. Please enter the generated code from your authenticator app.
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    Verification Code
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="6-digit code"
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    required
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary' }}>
                                    We've sent a verification code to your email. Please enter it below to verify your account.
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    Verification Code
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="000000"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                                    required
                                    disabled={loading}
                                    inputProps={{ maxLength: 6, style: { fontSize: '1.2rem', letterSpacing: '8px', textAlign: 'center' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
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

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading || (emailVerificationRequired && otpCode.length < 6)}
                            sx={{
                                mt: 1,
                                py: 1.25,
                                bgcolor: theme.palette.primary.main,
                                '&:hover': { bgcolor: theme.palette.primary.dark },
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                boxShadow: `0 4px 6px -1px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (step2FA ? 'Verify Code' : (emailVerificationRequired ? 'Verify Email' : 'Sign In'))}
                        </Button>

                        {emailVerificationRequired && (
                            <Button
                                onClick={() => {
                                    setEmailVerificationRequired(false);
                                    setOtpCode('');
                                    setError('');
                                    setResendTimer(0);
                                }}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Back to Login
                            </Button>
                        )}

                        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            New student?{' '}
                            <Link
                                href={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : '/register'}
                                underline="hover"
                                sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                            >
                                Create account
                            </Link>
                        </Typography>
                    </Box>

                    {/* Footer Section of Card */}
                    <Box sx={{ px: 4, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.100', display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Need help?{' '}
                            <Link href="#" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                                Contact IT Support
                            </Link>
                        </Typography>
                    </Box>
                </Paper>

                {/* Outside Footer */}
                <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        © {new Date().getFullYear()} {siteName}. All rights reserved.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Link href="#" variant="caption" color="text.secondary" underline="hover">
                            Privacy Policy
                        </Link>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Link href="#" variant="caption" color="text.secondary" underline="hover">
                            Terms of Service
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Login;
