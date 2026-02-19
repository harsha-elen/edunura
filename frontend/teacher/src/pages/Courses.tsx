import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    FormControl,
    Select,
    MenuItem,
    IconButton,
    Grid,
    useTheme,
    Breadcrumbs,
    Link as MuiLink,
    CircularProgress,
    Alert,
    Chip,
    Button,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Group as GroupIcon,
    NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../services/courseService';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';

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

const Courses: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [statusFilter, setStatusFilter] = useState('All Status');

    useEffect(() => {
        loadCourses();
    }, [categoryFilter, statusFilter, searchQuery]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                setError('User information not found');
                setLoading(false);
                return;
            }

            const currentUser = JSON.parse(userStr);
            const userId = currentUser.id;

            // Fetch all courses without pagination
            const params: any = { limit: 1000 };

            if (statusFilter !== 'All Status') {
                params.status = statusFilter.toLowerCase();
            }
            if (categoryFilter !== 'All Categories') {
                params.category = categoryFilter;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const response = await getCourses(params);

            if (response.data && response.data.courses) {
                // Filter to show only courses where user is an instructor
                const assignedCourses = response.data.courses.filter((course: any) => {
                    if (!course.instructors) return false;

                    let instructors = course.instructors;
                    if (typeof instructors === 'string') {
                        try {
                            instructors = JSON.parse(instructors);
                        } catch {
                            return false;
                        }
                    }

                    if (!Array.isArray(instructors)) return false;

                    return instructors.some((instructor: any) => instructor.id === userId);
                });

                setCourses(assignedCourses);
            } else {
                setCourses([]);
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
        } catch (error) {
            return 'No instructor assigned';
        }
    };

    return (
        <Box
            sx={{
                flex: 1,
                overflowY: 'auto',
                p: { xs: 2, md: 4 },
                scrollBehavior: 'smooth',
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2, pb: 0.5 }}>
                    <Box>
                        <Breadcrumbs
                            separator={<NavigateNextIcon fontSize="small" />}
                            aria-label="breadcrumb"
                            sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                        >
                            <MuiLink component={Link} underline="hover" color="inherit" to="/dashboard">
                                Home
                            </MuiLink>
                            <Typography color="text.primary">My Courses</Typography>
                        </Breadcrumbs>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>
                            My Courses
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            View and manage your assigned courses.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                            label="View Only"
                            variant="outlined"
                            color="info"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>
                </Box>

                <Box
                    sx={{
                        bgcolor: '#ffffff',
                        border: '1px solid #e7edf3',
                        borderRadius: 3,
                        p: 3,
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: 2.5,
                        alignItems: { lg: 'center' },
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <TextField
                        placeholder="Search courses by title..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ maxWidth: { lg: 420 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            ),
                            sx: {
                                bgcolor: '#f8fafc',
                                borderRadius: 2,
                                '& fieldset': { borderColor: '#e2e8f0' },
                            },
                        }}
                    />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', width: { xs: '100%', lg: 'auto' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, display: { xs: 'none', sm: 'inline' } }}>
                                Category:
                            </Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
                                >
                                    <MenuItem value="All Categories">All Categories</MenuItem>
                                    <MenuItem value="Design">Design</MenuItem>
                                    <MenuItem value="Development">Development</MenuItem>
                                    <MenuItem value="Business">Business</MenuItem>
                                    <MenuItem value="Marketing">Marketing</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, display: { xs: 'none', sm: 'inline' } }}>
                                Status:
                            </Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
                                >
                                    <MenuItem value="All Status">All Status</MenuItem>
                                    <MenuItem value="Published">Published</MenuItem>
                                    <MenuItem value="Draft">Draft</MenuItem>
                                    <MenuItem value="Archived">Archived</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <IconButton sx={{ color: '#64748b' }}>
                            <FilterListIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Alert severity="error" sx={{ mb: 3, p: 2.5 }}>
                        {error}
                    </Alert>
                )}

                {/* Empty State */}
                {!loading && !error && courses.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 12, px: 3 }}>
                        <Typography variant="h6" sx={{ color: '#64748b', mb: 2, fontWeight: 600 }}>
                            No assigned courses found
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                            {searchQuery || categoryFilter !== 'All Categories' || statusFilter !== 'All Status'
                                ? 'Try adjusting your filters or search query'
                                : 'You have not been assigned to any courses yet'}
                        </Typography>
                    </Box>
                )}

                {/* Courses Grid */}
                {!loading && !error && courses.length > 0 && (
                    <Grid container spacing={3.5} sx={{ mt: 0 }}>
                        {courses.map((course) => {
                            const statusStyle = getStatusStyles(course.status);
                            const thumbnailUrl = course.thumbnail
                                ? `${STATIC_ASSETS_BASE_URL}/${course.thumbnail}`
                                : 'https://via.placeholder.com/400x225?text=No+Thumbnail';

                            return (
                                <Grid item xs={12} sm={6} lg={4} xl={3} key={course.id}>
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
                                        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', minHeight: 190 }}>
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
                                            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                                                    <GroupIcon sx={{ fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {course.enrolledStudents || 0}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => navigate(`/courses/${course.id}/manage`)}
                                                    sx={{
                                                        bgcolor: theme.palette.primary.main,
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        py: 1.25,
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        fontSize: '14px',
                                                        '&:hover': {
                                                            bgcolor: theme.palette.primary.dark,
                                                        },
                                                    }}
                                                >
                                                    Manage Course
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Box>
        </Box>
    );
};

export default Courses;
