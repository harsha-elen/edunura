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
} from '@mui/icons-material';
import { register as registerApi } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { STATIC_ASSETS_BASE_URL, API_BASE_URL } from '@/services/apiClient';

const RegisterPage: React.FC = () => {
    const router = useRouter();
    const { login } = useAuth();
    const theme = useTheme();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [safeNext, setSafeNext] = useState<string | undefined>(undefined);
    const [orgLogo, setOrgLogo] = useState<string | null>(null);
    const [siteName, setSiteName] = useState('LMS Enterprise');
    const [isHydrated, setIsHydrated] = useState(false);

    // Run after hydration to prevent SSR/client mismatch
    useEffect(() => {
        setIsHydrated(true);
        
        // Load from localStorage after hydration
        const savedLogo = localStorage.getItem('org_logo');
        const savedName = localStorage.getItem('site_name');
        if (savedLogo) setOrgLogo(savedLogo);
        if (savedName) setSiteName(savedName);

        // Parse next param
        const nextParam = new URLSearchParams(window.location.search).get('next') || '';
        if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
            setSafeNext(nextParam);
        }

        // Fetch branding from API
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await registerApi({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                password,
                phone: phone?.trim() || undefined,
            });

            if (response.status === 'success' && response.data) {
                // Pass safeNext to login function for proper redirection
                login(response.data.token, response.data.user, response.data.refreshToken, safeNext);
                return;
            }

            setError('Registration failed. Please try again.');
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
                    {/* Header Section */}
                    <Box sx={{ px: 4, pt: 5, pb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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
                            Create Student Account
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Register to continue to checkout.
                        </Typography>
                    </Box>

                    {/* Form Section */}
                    <Box component="form" onSubmit={handleSubmit} sx={{ px: 4, pb: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
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

                    {/* Footer Section of Card */}
                    <Box sx={{ px: 4, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.100', display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            By registering, you agree to our{' '}
                            <Link href="#" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                                Terms of Service
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

export default RegisterPage;
