import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Button,
    LinearProgress,
    TextField,
    InputAdornment,
    Chip,
    useTheme,
    Pagination,
    Stack,
    Alert,
    Skeleton
} from '@mui/material';
import {
    Search as SearchIcon,
    School as SchoolIcon,
    PlayArrow as PlayArrowIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import enrollmentService, { EnrolledCourse } from '../services/enrollmentService';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';

const MyCourses: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

    const filters = ['All', 'In Progress', 'Completed'];

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await enrollmentService.getMyEnrollments();
            setCourses(data);
        } catch (err: any) {
            console.error('Error fetching enrolled courses:', err);
            setError(err.response?.data?.message || 'Failed to load your courses');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter((course) => {
        const matchesSearch = 
            course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.instructors.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = 
            selectedFilter === 'All' ||
            (selectedFilter === 'Completed' && course.status === 'completed') ||
            (selectedFilter === 'In Progress' && course.status === 'active');
        
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const paginatedCourses = filteredCourses.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const getCourseImage = (thumbnail?: string) => {
        if (thumbnail) {
            return `${STATIC_ASSETS_BASE_URL}/${thumbnail}`;
        }
        return 'https://via.placeholder.com/400x300?text=No+Image';
    };

    const getStatusLabel = (status: string, progress: number) => {
        if (status === 'completed' || progress === 100) return 'Completed';
        if (progress === 0) return 'Not Started';
        return 'In Progress';
    };

    return (
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3, lg: 4 }, maxWidth: 1440, mx: 'auto', width: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            My Courses
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {loading ? 'Loading...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} enrolled`}
                        </Typography>
                    </Box>

                    <TextField
                        placeholder="Search my courses..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        sx={{
                            width: { xs: '100%', md: 320 },
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'background.paper'
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                    {filters.map((filter) => (
                        <Chip
                            key={filter}
                            label={filter}
                            onClick={() => {
                                setSelectedFilter(filter);
                                setPage(1);
                            }}
                            sx={{
                                fontWeight: 600,
                                borderRadius: 4,
                                px: 1,
                                bgcolor: selectedFilter === filter ? 'primary.main' : 'background.paper',
                                color: selectedFilter === filter ? 'white' : 'text.secondary',
                                border: `1px solid ${selectedFilter === filter ? 'transparent' : theme.palette.divider}`,
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {/* Loading */}
            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                                <Skeleton variant="rectangular" width={280} height={180} sx={{ borderRadius: 2 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton width="60%" height={32} />
                                    <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
                                    <Skeleton width="100%" height={60} sx={{ mt: 2 }} />
                                </Box>
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Empty State */}
            {!loading && courses.length === 0 && (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    py: 8,
                    textAlign: 'center'
                }}>
                    <Box sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                    }}>
                        <SchoolIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                        No Courses Yet
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mb: 3 }}>
                        You haven't enrolled in any courses yet. Browse our catalog and start learning today!
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/courses')}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 4
                        }}
                    >
                        Browse Courses
                    </Button>
                </Box>
            )}

            {/* Course List */}
            {!loading && filteredCourses.length > 0 && (
                <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {paginatedCourses.map((course) => (
                            <Card
                                key={course.course_id}
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gap: 3,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: theme.shadows[2],
                                        borderColor: 'primary.main',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                {/* Course Image */}
                                <Box sx={{
                                    width: { xs: '100%', md: 280 },
                                    height: 180,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    flexShrink: 0
                                }}>
                                    <Box
                                        component="img"
                                        src={getCourseImage(course.thumbnail)}
                                        alt={course.title}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s',
                                            '&:hover': { transform: 'scale(1.05)' }
                                        }}
                                    />
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 12,
                                        left: 12,
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                    }}>
                                        {course.level}
                                    </Box>
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        bgcolor: course.status === 'completed' ? 'success.main' : 'primary.main',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                    }}>
                                        {getStatusLabel(course.status, course.progress_percentage)}
                                    </Box>
                                </Box>

                                {/* Content */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                                                    {course.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                    {course.instructors} • {course.total_lessons} Lessons
                                                </Typography>
                                            </Box>
                                            <Chip 
                                                label={course.category || 'General'} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                    fontWeight: 600
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {course.short_description || course.description}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'center' }, gap: 2, mt: 2 }}>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                                                    Progress
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: course.progress_percentage === 100 ? 'success.main' : 'primary.main', fontSize: '0.75rem' }}>
                                                    {course.progress_percentage}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={course.progress_percentage}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: theme.palette.action.selected,
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: course.progress_percentage === 100 ? 'success.main' : 'primary.main',
                                                        borderRadius: 4
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block', fontSize: '0.7rem' }}>
                                                {course.completed_lessons} of {course.total_lessons} lessons completed
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => navigate(`/course/${course.course_id}`)}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    px: 2,
                                                    py: 0.5,
                                                    fontSize: '0.875rem',
                                                    borderColor: theme.palette.divider,
                                                    color: 'text.primary',
                                                    whiteSpace: 'nowrap',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        color: 'primary.main'
                                                    }
                                                }}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => navigate(`/course/${course.course_id}/learn`)}
                                                disabled={course.progress_percentage === 100}
                                                startIcon={course.progress_percentage === 100 ? <CheckCircleIcon /> : <PlayArrowIcon />}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    px: 2,
                                                    py: 0.5,
                                                    fontSize: '0.875rem',
                                                    boxShadow: 'none',
                                                    whiteSpace: 'nowrap',
                                                    bgcolor: course.progress_percentage === 100 ? 'success.main' : 'primary.main',
                                                }}
                                            >
                                                {course.progress_percentage === 100 ? 'Completed' : course.progress_percentage === 0 ? 'Start' : 'Resume'}
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Box>

                    {/* Pagination */}
                    {filteredCourses.length > itemsPerPage && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                shape="rounded"
                                color="primary"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default MyCourses;
