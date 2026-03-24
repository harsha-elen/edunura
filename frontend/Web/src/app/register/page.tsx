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
    Person as PersonIcon,
    Phone as PhoneIcon,
    Visibility,
    VisibilityOff,
    VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import { register as registerApi, sendRegistrationOtpApi } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { STATIC_ASSETS_BASE_URL, API_BASE_URL } from '@/services/apiClient';

const RegisterPage: React.FC = () => {
    const router = useRouter();
    const { login } = useAuth();
    const theme = useTheme();

    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // OTP State
    const [otp, setOtp] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [safeNext, setSafeNext] = useState<string | undefined>(undefined);
    const [orgLogo, setOrgLogo] = useState<string | null>(null);
    const [siteName, setSiteName] = useState('LMS Enterprise');
    const [isHydrated, setIsHydrated] = useState(false);

    // Run after hydration to prevent SSR/client mismatch
    useEffect(() => {
        setIsHydrated(true);
        
        const savedLogo = localStorage.getItem('org_logo');
        const savedName = localStorage.getItem('site_name');
        if (savedLogo) setOrgLogo(savedLogo);
        if (savedName) setSiteName(savedName);

        const nextParam = new URLSearchParams(window.location.search).get('next') || '';
        if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
            setSafeNext(nextParam);
        }

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

    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await sendRegistrationOtpApi(email.trim());

            if (response.status === 'success') {
                setStep('otp');
                setSuccessMessage('Please check your email for the verification code.');
                setResendTimer(60);
            } else {
                setError('Failed to send verification code. Please try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email already exists or failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await registerApi({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                password,
                phone: phone?.trim() || undefined,
                otp: otp.trim(),
            });

            if (response.status === 'success' && response.data) {
                login(response.data.token!, response.data.user as any, response.data.refreshToken!, safeNext);
            } else {
                setError('Registration failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await sendRegistrationOtpApi(email.trim());
            setSuccessMessage('A new verification code has been sent to your email.');
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
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 520, zIndex: 10 }}>
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
                            {step === 'details' ? 'Create Student Account' : 'Verify Email Address'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {step === 'details' 
                                ? 'Register to continue to checkout.' 
                                : `We sent a 6-digit code to ${email}`}
                        </Typography>
                    </Box>

                    {/* DETAILS STEP */}
                    {step === 'details' && (
                        <Box component="form" onSubmit={handleSubmitDetails} sx={{ px: 4, pb: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {error && <Alert severity="error">{error}</Alert>}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                        First Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        disabled={loading}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon sx={{ color: 'text.secondary' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                        Last Name
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        disabled={loading}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>
                            </Box>

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

                            <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    Phone (optional)
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="+91 98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    Password
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Enter your password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    helperText="Use at least 8 chars, uppercase, lowercase, number, and special char"
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

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    mt: 1,
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
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                            </Button>
                        </Box>
                    )}

                    {/* OTP VERIFICATION STEP */}
                    {step === 'otp' && (
                        <Box component="form" onSubmit={handleVerifyOtp} sx={{ px: 4, pb: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {successMessage && <Alert severity="success">{successMessage}</Alert>}
                            {error && <Alert severity="error">{error}</Alert>}

                            <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                    6-Digit Verification Code
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

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading || otp.length < 6}
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
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Account'}
                            </Button>

                            <Box sx={{ mt: 1, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Didn't receive the code?
                                </Typography>
                                <Button
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || loading}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Shared Sign in Link */}
                    {step === 'details' && (
                        <Box sx={{ px: 4, pb: 2 }}>
                            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                Already have an account?{' '}
                                <Link
                                    href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : '/login'}
                                    underline="hover"
                                    sx={{ color: theme.palette.primary.main, fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Sign in
                                </Link>
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ px: 4, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.100', display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            By registering, you agree to our{' '}
                            <Link href="#" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                                Terms of Service
                            </Link>
                        </Typography>
                    </Box>
                </Paper>

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

export default RegisterPage;
