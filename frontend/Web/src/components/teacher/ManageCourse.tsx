'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import NextLink from 'next/link';
import CurriculumSection from '@/components/teacher/CurriculumSection';
import { getCourse } from '@/services/courseService';

const ManageCourse: React.FC = () => {
    const params = useParams();
    const id = params?.id as string;
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
            const response = await getCourse(parseInt(id));
            setCourseTitle(response.data.title);
        } catch (err: any) {
            console.error('Error loading course:', err);
            setError(err.response?.data?.message || 'Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = () => {
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
                <Button component={NextLink} href="/teacher/courses" sx={{ mt: 2 }}>
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
                        <MuiLink component={NextLink} underline="hover" color="inherit" href="/teacher">
                            Home
                        </MuiLink>
                        <MuiLink component={NextLink} underline="hover" color="inherit" href="/teacher/courses">
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
                                borderRadius: 2,
                            }}
                        >
                            Save Changes
                        </Button>
                    </Box>

                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        Edit modules and lessons for <strong>{courseTitle}</strong>
                    </Typography>
                </Box>

                {/* Main Content */}
                <Box sx={{ width: '100%' }}>
                    <CurriculumSection courseId={parseInt(id)} />
                </Box>
            </Box>

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
