import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
    Group as GroupIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { courseService } from '../services/courseService';
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
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        loadCourses();
    }, [page, categoryFilter, statusFilter, searchQuery]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const params: any = { page, limit: 12 };

            if (statusFilter !== 'All Status') {
                params.status = statusFilter.toLowerCase();
            }
            if (categoryFilter !== 'All Categories') {
                params.category = categoryFilter;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const response = await courseService.getCourses(params);

            // Response structure from backend: { status: "success", data: { courses, total, page, pages } }
            if (response.data && response.data.courses) {
                setCourses(response.data.courses);
                setPagination({
                    total: response.data.total,
                    totalPages: response.data.pages
                });
            } else {
                // Fallback for unexpected response format
                const courses = Array.isArray(response) ? response : (response.data || []);
                setCourses(courses);
                setPagination({ total: courses.length, totalPages: 1 });
            }
        } catch (err: any) {
            console.error('Error loading courses:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (course: any) => {
        setCourseToDelete(course);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!courseToDelete) return;
        setDeleting(true);
        try {
            await courseService.deleteCourse(courseToDelete.id);
            // Remove the course from the list
            setCourses(courses.filter(c => c.id !== courseToDelete.id));
            setDeleteDialogOpen(false);
            setCourseToDelete(null);
        } catch (err: any) {
            console.error('Error deleting course:', err);
            setError(err.response?.data?.message || err.message || 'Failed to delete course');
        } finally {
            setDeleting(false);
        }
    };

const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
};

    const getInstructorNames = (instructorsData: any): string => {
        try {
            let instructors = instructorsData;

            // If it's a JSON string, parse it
            if (typeof instructorsData === 'string') {
                instructors = JSON.parse(instructorsData);
            }

            // If it's an array, extract names
            if (Array.isArray(instructors) && instructors.length > 0) {
                return instructors.map((instructor: any) => instructor.name || instructor.email).join(', ');
            }

            return 'No instructor assigned';
        } catch (error) {
            return 'No instructor assigned';
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <Breadcrumbs
                        separator={<NavigateNextIcon fontSize="small" />}
                        aria-label="breadcrumb"
                        sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                    >
                        <MuiLink component={Link} underline="hover" color="inherit" to="/dashboard">
                            Home
                        </MuiLink>
                        <Typography color="text.primary">Courses</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>
                        Course Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Create, edit, and organize your learning content.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                    <Button
                        component={Link}
                        to="/courses/create"
                        variant="contained"
                        startIcon={<AddIcon fontSize="small" />}
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                            py: 1.25,
                            borderRadius: 2,
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
                            '&:hover': { bgcolor: theme.palette.primary.dark },
                        }}
                    >
                        Create New Course
                    </Button>
                    <Button
                        component={Link}
                        to="/courses/categories"
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                            py: 1.25,
                            borderRadius: 2,
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            '&:hover': { borderColor: theme.palette.primary.main, color: theme.palette.primary.main },
                        }}
                    >
                        Category Management
                    </Button>
                </Box>
            </Box>

            <Box
                sx={{
                    bgcolor: '#ffffff',
                    border: '1px solid #e7edf3',
                    borderRadius: 3,
                    p: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', lg: 'row' },
                    gap: 2,
                    alignItems: { lg: 'center' },
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                }}
            >
                <TextField
                    placeholder="Search courses by title or instructor..."
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
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                        {searchQuery || categoryFilter !== 'All Categories' || statusFilter !== 'All Status'
                            ? 'Try adjusting your filters or search query'
                            : 'Create your first course to get started'}
                    </Typography>
                    {!searchQuery && categoryFilter === 'All Categories' && statusFilter === 'All Status' && (
                        <Button
                            component={Link}
                            to="/courses/create"
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ textTransform: 'none' }}
                        >
                            Create New Course
                        </Button>
                    )}
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
                                        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                                                <GroupIcon sx={{ fontSize: 18 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {course.enrolledStudents || 0}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <IconButton
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                        color: '#6366f1',
                                                        '&:hover': { bgcolor: '#6366f1', color: '#ffffff' },
                                                    }}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton
                                                    component={Link}
                                                    to={`/courses/edit/${course.id}`}
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(43, 140, 238, 0.1)',
                                                        color: theme.palette.primary.main,
                                                        '&:hover': { bgcolor: theme.palette.primary.main, color: '#ffffff' },
                                                    }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
<IconButton
                                                    onClick={() => handleDeleteClick(course)}
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(220, 38, 38, 0.1)',
                                                        color: '#dc2626',
                                                        '&:hover': { bgcolor: '#dc2626', color: '#ffffff' },
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>

            )}

            {/* Pagination */}
            {!loading && !error && pagination.total > 0 && (
                <Box
                    sx={{
                        mt: 3,
                        pt: 3,
                        borderTop: '1px solid #e7edf3',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Showing {courses.length} of {pagination.total} courses
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            sx={{ borderRadius: 2, border: '1px solid #e7edf3' }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>

                        {/* Page Numbers */}
                        {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                            const pageNum = index + 1;
                            return (
                                <Box
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        ...(page === pageNum ? {
                                            bgcolor: theme.palette.primary.main,
                                            color: '#ffffff',
                                        } : {
                                            color: '#0f172a',
                                            '&:hover': { bgcolor: '#f1f5f9' },
                                        }),
                                    }}
                                >
                                    {pageNum}
                                </Box>
                            );
                        })}

                        {pagination.totalPages > 5 && (
                            <>
                                <Typography variant="body2" sx={{ color: '#94a3b8', px: 1 }}>
                                    ...
                                </Typography>
                                <Box
                                    onClick={() => setPage(pagination.totalPages)}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: '#f1f5f9' },
                                    }}
                                >
                                    {pagination.totalPages}
                                </Box>
                            </>
                        )}

                        <IconButton
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                            sx={{ borderRadius: 2, border: '1px solid #e7edf3' }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                </Box>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCancelDelete}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#0d141b' }}>
                    Delete Course
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography sx={{ color: '#64748b', mb: 2 }}>
                        Are you sure you want to delete <strong>{courseToDelete?.title}</strong>?
                    </Typography>
                    <Typography sx={{ color: '#dc2626', fontSize: '0.875rem' }}>
                        ⚠️ This action will permanently delete the course and all related content (sections, lessons, files, and folders). This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleCancelDelete}
                        disabled={deleting}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {deleting ? 'Deleting...' : 'Delete Course'}
                    </Button>
</DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Courses;
