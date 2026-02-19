import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { authService } from '../../services/authService';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ email, password, portal: 'teacher' });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
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
                            <SchoolIcon fontSize="large" />
                        </Box>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                            LMS Teacher Portal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Welcome back, Instructor. Please sign in.
                        </Typography>
                    </Box>

                    {/* Form Section */}
                    <Box component="form" onSubmit={handleSubmit} sx={{ px: 4, pb: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Box>
                            <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5, color: 'text.primary' }}>
                                Email Address
                            </Typography>
                            <TextField
                                fullWidth
                                id="email"
                                placeholder="teacher@school.com"
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
                            <Link href="#" variant="body2" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                                Forgot Password?
                            </Link>
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
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                boxShadow: `0 4px 6px -1px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </Box>

                    {/* Footer Section of Card */}
                    <Box sx={{ px: 4, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.100', display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Need help?{' '}
                            <Link href="#" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                                Contact Support
                            </Link>
                        </Typography>
                    </Box>
                </Paper>

                {/* Outside Footer */}
                <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        © 2024 LMS Enterprise. All rights reserved.
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
