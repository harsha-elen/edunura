'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Button,
    Grid,
    useTheme,
    CircularProgress,
    Alert,
    Breadcrumbs,
    Link as MuiLink,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon, Group as GroupIcon } from '@mui/icons-material';
import { getCourses } from '@/services/courseService';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';

const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'published' || normalizedStatus === 'active') {
        return { bg: '#d1fae5', color: '#047857' };
    }

    if (normalizedStatus === 'draft') {
        return { bg: '#fef3c7', color: '#b45309' };
    }

    return { bg: '#f1f5f9', color: '#475569' };
};

const AdminAssignments: React.FC = () => {
    const theme = useTheme();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getCourses({ page: 1, limit: 1000 });

            if (response.data && response.data.courses) {
                setCourses(response.data.courses);
            } else {
                const coursesList = Array.isArray(response) ? response : (response.data || []);
                setCourses(coursesList);
            }
        } catch (err: any) {
            console.error('Error loading courses:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const getInstructorNames = (instructorsData: any): string => {
        try {
            let instructors = instructorsData;

            if (typeof instructorsData === 'string') {
                instructors = JSON.parse(instructorsData);
            }

            if (Array.isArray(instructors) && instructors.length > 0) {
                return instructors.map((instructor: any) => instructor.name || instructor.email).join(', ');
            }

            return 'No instructor assigned';
        } catch {
            return 'No instructor assigned';
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                >
                    <MuiLink component={Link} underline="hover" color="inherit" href="/admin">
                        Home
                    </MuiLink>
                    <Typography color="text.primary">Assignments</Typography>
                </Breadcrumbs>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>
                    Manage Assignments
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Select a course to manage and grade student assignments.
                </Typography>
            </Box>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && !loading && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Empty State */}
            {!loading && !error && courses.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>
                        No courses found
                    </Typography>
                </Box>
            )}

            {/* Courses Grid */}
            {!loading && !error && courses.length > 0 && (
                <Grid container spacing={3}>
                    {courses.map((course) => {
                        const statusStyle = getStatusStyles(course.status);
                        const thumbnailUrl = course.thumbnail
                            ? `${STATIC_ASSETS_BASE_URL}/${course.thumbnail}`
                            : 'https://via.placeholder.com/400x225?text=No+Thumbnail';

                        return (
                            <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={course.id}>
                                <Box
                                    sx={{
                                        bgcolor: '#ffffff',
                                        border: '1px solid #e7edf3',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                        '&:hover': {
                                            boxShadow: '0 16px 24px -12px rgba(15, 23, 42, 0.25)',
                                            transform: 'translateY(-4px)',
                                        },
                                        '&:hover .course-image': {
                                            transform: 'scale(1.05)',
                                        },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                    }}
                                >
                                    <Box sx={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
                                        <Box
                                            component="img"
                                            src={thumbnailUrl}
                                            alt={course.title}
                                            className="course-image"
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
                                            }}
                                        />
                                        <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                                            <Box
                                                sx={{
                                                    bgcolor: statusStyle.bg,
                                                    color: statusStyle.color,
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    px: 1.25,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                }}
                                            >
                                                {course.status}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: theme.palette.primary.main,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                                mb: 1,
                                            }}
                                        >
                                            {course.category}
                                        </Typography>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                mb: 0.5,
                                                minHeight: 40,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {course.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                                            {getInstructorNames(course.instructors)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b', mb: 3 }}>
                                            <GroupIcon sx={{ fontSize: 18 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {course.enrolledStudents || 0} students
                                            </Typography>
                                        </Box>
                                        <Button
                                            component={Link}
                                            href={`/admin/assignments/${course.id}`}
                                            variant="contained"
                                            fullWidth
                                            sx={{
                                                bgcolor: theme.palette.primary.main,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                py: 1.5,
                                                borderRadius: 2,
                                                '&:hover': { bgcolor: theme.palette.primary.dark },
                                            }}
                                        >
                                            Manage Assignments
                                        </Button>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

export default AdminAssignments;
