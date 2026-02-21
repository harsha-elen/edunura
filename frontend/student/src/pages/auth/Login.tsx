import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
    School as SchoolIcon,
    AlternateEmail as AlternateEmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { authService } from '../../services/authService';
import { STATIC_ASSETS_BASE_URL, API_BASE_URL } from '../../services/apiClient';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [orgLogo, setOrgLogo] = useState<string | null>(localStorage.getItem('org_logo') || null);
    const [siteName, setSiteName] = useState(localStorage.getItem('site_name') || 'LMS Education Systems');

    useEffect(() => {
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
            .catch(() => {});
    }, []);

    // Redirect to dashboard if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            const userData = JSON.parse(user);
            if (userData.role === 'student') {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ email, password });

            // Response is already { status, message, data: { user } } - token is in HttpOnly cookie
            const responseData = response.data;
            
            if (!responseData) {
                setError('Invalid response from server');
                setLoading(false);
                return;
            }

            // Extract user from response.data - token is now in HttpOnly cookie
            const user = responseData.user;
            const token = responseData.token;

            if (!user) {
                setError('Invalid user data received from server');
                setLoading(false);
                return;
            }

            if (user.role !== 'student') {
                setError('Access denied. Student credentials required.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Navigate with replace to prevent back-button issues
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: 'background.default', // #f6f7f8
                backgroundImage: `radial-gradient(${theme.palette.primary.main} 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
                position: 'relative',
            }}
        >
            {/* Gradient Overlay for better readability if needed, but HTML just has opacity on dots. 
                 MUI background blend mode can be tricky, simple radial is fine as per HTML */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    zIndex: 0,
                    pointerEvents: 'none'
                }}
            />

            <Box sx={{ position: 'relative', width: '100%', maxWidth: 440, zIndex: 10 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    <Box sx={{ px: 5, pt: 6, pb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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
                                    width: 56,
                                    height: 56,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3,
                                    color: theme.palette.primary.main,
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                }}
                            >
                                <SchoolIcon sx={{ fontSize: 32 }} />
                            </Box>
                        )}
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, letterSpacing: '-0.025em' }}>
                            Student Portal
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280, lineHeight: 1.6 }}>
                            Sign in to access your courses, assignments, and grades.
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} sx={{ px: 5, pb: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', ml: 0.5 }}>
                                Email Address
                            </Typography>
                            <TextField
                                fullWidth
                                id="email"
                                placeholder="name@university.edu"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AlternateEmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 3,
                                        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[800], 0.5) : theme.palette.grey[50],
                                        '& fieldset': { borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300] },
                                        '&:hover fieldset': { borderColor: theme.palette.grey[400] },
                                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
                                        '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}` },
                                        transition: 'all 0.2s',
                                    }
                                }}
                            />
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, ml: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
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
                                            <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                sx={{ color: 'text.primary', mr: 0.5 }}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 3,
                                        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[800], 0.5) : theme.palette.grey[50],
                                        '& fieldset': { borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300] },
                                        '&:hover fieldset': { borderColor: theme.palette.grey[400] },
                                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
                                        '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}` },
                                        transition: 'all 0.2s',
                                    }
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Link href="#" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 600, fontSize: '0.75rem' }}>
                                    Forgot Password?
                                </Link>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        defaultChecked
                                        size="small"
                                        sx={{
                                            color: theme.palette.grey[400],
                                            '&.Mui-checked': { color: theme.palette.primary.main },
                                            '& .MuiSvgIcon-root': { fontSize: 20 }
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        Keep me signed in
                                    </Typography>
                                }
                                sx={{ ml: -0.5 }}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.75,
                                bgcolor: theme.palette.primary.main,
                                '&:hover': { bgcolor: theme.palette.primary.dark },
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                boxShadow: `0 10px 15px -3px ${alpha(theme.palette.primary.main, 0.25)}`,
                                '&:active': { transform: 'scale(0.99)' },
                                transition: 'all 0.1s',
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </Box>

                    <Box sx={{ px: 5, py: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc', borderTop: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <Link component={RouterLink} to="/register" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                                Create an account
                            </Link>
                        </Typography>
                    </Box>
                </Paper>

                <Box sx={{ mt: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 280, mx: 'auto', lineHeight: 1.5 }}>
                        Authorized student access only. Your activity is recorded for security and compliance.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Link href="#" variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, '&:hover': { color: 'text.secondary' } }} underline="hover">
                            Privacy Policy
                        </Link>
                        <Link href="#" variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, '&:hover': { color: 'text.secondary' } }} underline="hover">
                            Terms of Service
                        </Link>
                        <Link href="#" variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, '&:hover': { color: 'text.secondary' } }} underline="hover">
                            Help Center
                        </Link>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', pt: 2, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        © {new Date().getFullYear()} {siteName}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Login;
