import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Paper,
    useTheme,
    Breadcrumbs,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    FileDownload as FileDownloadIcon,
    Code as CodeIcon,
    Palette as PaletteIcon,
    Psychology as PsychologyIcon,
    TrendingUp as TrendingUpIcon,
    EditOutlined as EditOutlinedIcon,
    DeleteOutline as DeleteOutlineIcon,
    NavigateNext as NavigateNextIcon,
    Analytics as AnalyticsIcon,
    School as SchoolIcon,
    Business as BusinessIcon,
    Language as LanguageIcon,
    SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
} from '@mui/icons-material';
import { getCategories, deleteCategory, CourseCategory } from '../services/categories';

const iconMap: { [key: string]: JSX.Element } = {
    code: <CodeIcon />,
    analytics: <AnalyticsIcon />,
    palette: <PaletteIcon />,
    psychology: <PsychologyIcon />,
    school: <SchoolIcon />,
    business: <BusinessIcon />,
    language: <LanguageIcon />,
    trending_up: <TrendingUpIcon />,
};

const getStatusChip = (status: string) => {
    if (status === 'Active') {
        return {
            label: 'Active',
            sx: {
                bgcolor: '#d1fae5',
                color: '#047857',
                fontWeight: 600,
                fontSize: '0.75rem',
                px: 1,
            },
        };
    }

    return {
        label: 'Inactive',
        sx: {
            bgcolor: '#f1f5f9',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1,
        },
    };
};

const CourseCategories: React.FC = () => {
    const theme = useTheme();
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CourseCategory | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategories({ search: searchQuery });
            setCategories(response.data);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to fetch categories',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleSearchSubmit = () => {
        fetchCategories();
    };

    const handleDeleteClick = (category: CourseCategory) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;

        try {
            await deleteCategory(categoryToDelete.id);
            setSnackbar({
                open: true,
                message: 'Category deleted successfully',
                severity: 'success',
            });
            fetchCategories();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to delete category',
                severity: 'error',
            });
        } finally {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getIconForCategory = (iconName?: string) => {
        if (!iconName) return <SchoolIcon />;
        return iconMap[iconName] || <SchoolIcon />;
    };

    const getAccentColor = (color?: string) => {
        return color || '#e8f2fe';
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                >
                    <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">
                        Home
                    </Link>
                    <Link component={RouterLink} underline="hover" color="inherit" to="/courses">
                        Courses
                    </Link>
                    <Typography color="text.primary">Categories</Typography>
                </Breadcrumbs>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            Category Management
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Organize and structure your course catalog across different disciplines.
                        </Typography>
                    </Box>
                    <Button
                        component={RouterLink}
                        to="/courses/categories/create"
                        variant="contained"
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            py: 1.25,
                            boxShadow: '0 12px 24px -12px rgba(43, 140, 238, 0.6)',
                            '&:hover': { bgcolor: theme.palette.primary.dark },
                            alignSelf: { xs: 'flex-start', md: 'center' },
                        }}
                    >
                        Create Category
                    </Button>
                </Box>
            </Box>

            <Box>
                <Box sx={{ flexGrow: 1 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2,
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <TextField
                                placeholder="Search categories..."
                                size="small"
                                fullWidth
                                value={searchQuery}
                                onChange={handleSearch}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                sx={{ maxWidth: 420 }}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                    variant="text"
                                    startIcon={<FilterListIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        color: '#64748b',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: '#f1f5f9' },
                                    }}
                                >
                                    Filter
                                </Button>
                                <Button
                                    variant="text"
                                    startIcon={<FileDownloadIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        color: '#64748b',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: '#f1f5f9' },
                                    }}
                                >
                                    Export
                                </Button>
                            </Box>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(248, 250, 252, 0.6)' }}>
                                        {['Category Name', 'Slug', 'Course Count', 'Status', 'Actions'].map((header) => (
                                            <TableCell
                                                key={header}
                                                align={header === 'Status' ? 'center' : header === 'Actions' ? 'right' : 'left'}
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                    color: '#94a3b8',
                                                    fontWeight: 700,
                                                    py: 2,
                                                }}
                                            >
                                                {header}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                <CircularProgress size={40} />
                                            </TableCell>
                                        </TableRow>
                                    ) : categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No categories found. Create your first category to get started.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map((category) => {
                                        const status = getStatusChip(category.is_active ? 'Active' : 'Inactive');
                                        const isChildCategory = category.parent_id !== null && category.parent_id !== undefined;

                                        return (
                                            <TableRow
                                                key={category.id}
                                                sx={{
                                                    '&:hover': { bgcolor: '#f8fafc' },
                                                }}
                                            >
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                            pl: isChildCategory ? 4 : 0,
                                                        }}
                                                    >
                                                        {isChildCategory && (
                                                            <SubdirectoryArrowRightIcon 
                                                                sx={{ 
                                                                    color: '#94a3b8', 
                                                                    fontSize: 20,
                                                                    mr: -1,
                                                                }} 
                                                            />
                                                        )}
                                                        <Box
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 2,
                                                                bgcolor: getAccentColor(category.accent_color),
                                                                color: category.color || theme.palette.primary.main,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: isChildCategory ? '2px dashed #cbd5e1' : 'none',
                                                            }}
                                                        >
                                                            {getIconForCategory(category.icon)}
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                                                {category.name}
                                                            </Typography>
                                                            {isChildCategory && (
                                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                                                    Subcategory
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>{category.slug}</TableCell>
                                                <TableCell>
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            bgcolor: '#f1f5f9',
                                                            color: '#64748b',
                                                            borderRadius: 1,
                                                            px: 1,
                                                            py: 0.5,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            display: 'inline-block',
                                                        }}
                                                    >
                                                        {category.course_count} Courses
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip label={status.label} size="small" sx={status.sx} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box
                                                        sx={{
                                                            display: 'inline-flex',
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <IconButton 
                                                            size="small" 
                                                            sx={{ 
                                                                color: theme.palette.primary.main,
                                                                '&:hover': { bgcolor: 'rgba(43, 140, 238, 0.1)' },
                                                            }}
                                                            component={RouterLink}
                                                            to={`/courses/categories/edit/${category.id}`}
                                                        >
                                                            <EditOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton 
                                                            size="small" 
                                                            sx={{ 
                                                                color: '#ef4444',
                                                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                                                            }}
                                                            onClick={() => handleDeleteClick(category)}
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                                alignItems: { sm: 'center' },
                                justifyContent: 'space-between',
                            }}
                        >
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Showing {categories.length} {categories.length === 1 ? 'entry' : 'entries'}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Delete Category</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>?
                        {categoryToDelete && categoryToDelete.course_count > 0 && (
                            <Typography color="error" sx={{ mt: 1 }}>
                                Warning: This category has {categoryToDelete.course_count} course(s). You need to reassign or delete them first.
                            </Typography>
                        )}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        sx={{ textTransform: 'none' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CourseCategories;
