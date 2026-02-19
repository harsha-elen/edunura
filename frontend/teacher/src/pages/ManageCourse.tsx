import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Breadcrumbs,
    Link as MuiLink,
    useTheme,
    CircularProgress,
    Alert,
    Snackbar,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon, Save as SaveIcon } from '@mui/icons-material';
import CurriculumSection from '../components/courses/CurriculumSection';
import { getCourseById } from '../services/courseService';

const ManageCourse: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const theme = useTheme();
    const [courseTitle, setCourseTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

    useEffect(() => {
        if (id) {
            loadCourseDetails();
        }
    }, [id]);

    const loadCourseDetails = async () => {
        try {
            setLoading(true);
            const data = await getCourseById(parseInt(id!));
            setCourseTitle(data.title);
        } catch (err: any) {
            console.error('Error loading course:', err);
            setError(err.response?.data?.message || 'Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = () => {
        // Since CurriculumSection handles its own saving (reordering), this button is mostly visual
        // or could trigger a global re-validation if needed.
        // For now, we'll just show a success message as per the user requirement.
        setSnackbar({ open: true, message: 'All changes saved successfully.', severity: 'success' });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button component={Link} to="/courses" sx={{ mt: 2 }}>
                    Back to Courses
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 }, pb: 6 }}>
            <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
                {/* Header Section */}
                <Box sx={{ mb: 2 }}>
                    <Breadcrumbs
                        separator={<NavigateNextIcon fontSize="small" />}
                        aria-label="breadcrumb"
                        sx={{ mb: 1.5, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                    >
                        <MuiLink component={Link} underline="hover" color="inherit" to="/dashboard">
                            Home
                        </MuiLink>
                        <MuiLink component={Link} underline="hover" color="inherit" to="/courses">
                            My Courses
                        </MuiLink>
                        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                            {courseTitle}
                        </Typography>
                    </Breadcrumbs>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>
                            Manage Curriculum
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveChanges}
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                '&:hover': { bgcolor: theme.palette.primary.dark },
                                px: 3,
                                py: 1,
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Save Changes
                        </Button>
                    </Box>

                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        Edit modules and lessons for <strong>{courseTitle}</strong>
                    </Typography>
                </Box>

                {/* Main Content - Full Width, No Border */}
                <Box sx={{
                    width: '100%',
                }}>
                    <CurriculumSection courseId={parseInt(id!)} />
                </Box>
            </Box>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ManageCourse;
