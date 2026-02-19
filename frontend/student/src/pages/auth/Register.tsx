import React, { useState } from 'react';
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
    Person as PersonIcon,
    Mail as MailIcon,
    Lock as LockIcon,
    LockReset as LockResetIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { authService } from '../../services/authService';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!acceptTerms) {
            setError('You must accept the Terms & Conditions');
            return;
        }

        setLoading(true);

        try {
            // Split Full Name into First and Last Name
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const response = await authService.register({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                role: 'student'
            });

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

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Show success message briefly
            setSuccess('Account created successfully! Redirecting to dashboard...');

            // Redirect to dashboard immediately
            navigate('/dashboard', { replace: true });

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
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
            {/* Gradient Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255,255,255,0.6)', // Slightly less opacity than login to see dots
                    zIndex: 0,
                    pointerEvents: 'none'
                }}
            />

            <Box sx={{ position: 'relative', width: '100%', maxWidth: 520, zIndex: 10 }}>
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
                    <Box sx={{ px: 5, pt: 6, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            }}
                        >
                            <SchoolIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, letterSpacing: '-0.025em' }}>
                            Create Student Account
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 350, lineHeight: 1.6 }}>
                            Join our learning community and start your journey.
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} sx={{ px: 5, pb: 5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}

                        {/* Full Name */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', ml: 0.5 }}>
                                Full Name
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={!!success}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 3,
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                                        '& fieldset': { borderColor: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
                                        '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}` },
                                        transition: 'all 0.2s',
                                    }
                                }}
                            />
                        </Box>

                        {/* Email */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', ml: 0.5 }}>
                                Email Address
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="student@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={!!success}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        borderRadius: 3,
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                                        '& fieldset': { borderColor: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
                                        '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}` },
                                        transition: 'all 0.2s',
                                    }
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                            {/* Password */}
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', ml: 0.5 }}>
                                    Password
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="••••••••"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={!!success}
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
                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                                            '& fieldset': { borderColor: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
                                            '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}` },
                                            transition: 'all 0.2s',
                                        }
                                    }}
                                />
                            </Box>

                            {/* Confirm Password */}
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary', ml: 0.5 }}>
                                    Confirm Password
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="••••••••"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={!!success}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockResetIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                    sx={{ color: 'text.primary', mr: 0.5 }}
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 3,
                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                                            '& fieldset': { borderColor: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
                                            '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}` },
                                            transition: 'all 0.2s',
                                        }
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        disabled={!!success}
                                        size="small"
                                        sx={{
                                            mt: -0.5,
                                            color: '#cbd5e1',
                                            '&.Mui-checked': { color: theme.palette.primary.main },
                                            '& .MuiSvgIcon-root': { fontSize: 20 }
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                        I agree to the <Link href="#" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>Terms & Conditions</Link> and <Link href="#" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>Privacy Policy</Link>.
                                    </Typography>
                                }
                                sx={{ ml: -0.5, alignItems: 'flex-start' }}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading || !!success}
                            sx={{
                                py: 1.75,
                                bgcolor: theme.palette.primary.main,
                                '&:hover': { bgcolor: '#2563eb' },
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                boxShadow: `0 10px 15px -3px ${alpha(theme.palette.primary.main, 0.25)}`,
                                '&:active': { transform: 'scale(0.99)' },
                                transition: 'all 0.1s',
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : success ? 'Success!' : 'Create Account'}
                        </Button>
                    </Box>

                    <Box sx={{ px: 5, py: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc', borderTop: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link component={RouterLink} to="/login" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                                Back to Login
                            </Link>
                        </Typography>
                    </Box>
                </Paper>

                <Box sx={{ mt: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', maxWidth: 280, mx: 'auto', lineHeight: 1.5 }}>
                        © 2024 LMS Portal. Empowering education everywhere.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Link href="#" variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, '&:hover': { color: 'text.secondary' } }} underline="hover">
                            Help Center
                        </Link>
                        <Typography variant="caption" color="text.disabled">•</Typography>
                        <Link href="#" variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, '&:hover': { color: 'text.secondary' } }} underline="hover">
                            System Status
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Register;
