import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Breadcrumbs,
    Link,
    TextField,
    Button,
    Grid,
    Paper,
    Switch,
    useTheme,
    Snackbar,
    Alert,
    CircularProgress,
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';
import {
    NavigateNext as NavigateNextIcon,
    Analytics as AnalyticsIcon,
    Code as CodeIcon,
    Brush as BrushIcon,
    Payments as PaymentsIcon,
    Science as ScienceIcon,
    Psychology as PsychologyIcon,
    Public as PublicIcon,
    School as SchoolIcon,
    Terminal as TerminalIcon,
    Storage as StorageIcon,
    Campaign as CampaignIcon,
    Groups as GroupsIcon,
    Inventory2 as Inventory2Icon,
    Language as LanguageIcon,
    Bolt as BoltIcon,
    RocketLaunch as RocketLaunchIcon,
    Info as InfoIcon,
    MenuBook as MenuBookIcon,
    Group as GroupIcon,
} from '@mui/icons-material';
import { createCategory, getCategories, CategoryFormData, CourseCategory } from '../services/categories';

const iconOptions = [
    { key: 'analytics', icon: <AnalyticsIcon /> },
    { key: 'code', icon: <CodeIcon /> },
    { key: 'brush', icon: <BrushIcon /> },
    { key: 'payments', icon: <PaymentsIcon /> },
    { key: 'science', icon: <ScienceIcon /> },
    { key: 'psychology', icon: <PsychologyIcon /> },
    { key: 'public', icon: <PublicIcon /> },
    { key: 'school', icon: <SchoolIcon /> },
    { key: 'terminal', icon: <TerminalIcon /> },
    { key: 'storage', icon: <StorageIcon /> },
    { key: 'campaign', icon: <CampaignIcon /> },
    { key: 'groups', icon: <GroupsIcon /> },
    { key: 'inventory', icon: <Inventory2Icon /> },
    { key: 'language', icon: <LanguageIcon /> },
    { key: 'bolt', icon: <BoltIcon /> },
    { key: 'rocket', icon: <RocketLaunchIcon /> },
];

const accentColors = [
    { key: 'primary', color: '#2b8cee' },
    { key: 'emerald', color: '#10b981' },
    { key: 'amber', color: '#f59e0b' },
    { key: 'rose', color: '#f43f5e' },
    { key: 'indigo', color: '#6366f1' },
    { key: 'fuchsia', color: '#d946ef' },
];

const CreateCourseCategory: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        slug: '',
        description: '',
        parent_id: undefined,
        icon: 'analytics',
        color: '#2b8cee',
        accent_color: '#e8f2fe',
        display_order: 0,
        is_featured: false,
        is_active: true,
    });
    
    const [selectedIcon, setSelectedIcon] = useState('analytics');
    const [selectedColor, setSelectedColor] = useState('#2b8cee');
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Fetch existing categories for parent dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories({ status: 'active' });
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (field: keyof CategoryFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setFormData({ ...formData, [field]: value });
        
        // Auto-generate slug from name
        if (field === 'name') {
            const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setFormData(prev => ({ ...prev, name: value, slug }));
        }
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleIconSelect = (iconKey: string) => {
        setSelectedIcon(iconKey);
        setFormData({ ...formData, icon: iconKey });
    };

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        const accentColor = color + '20'; // Add transparency
        setFormData({ ...formData, color, accent_color: accentColor });
    };

    const handleSwitchChange = (field: 'is_featured' | 'is_active') => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: event.target.checked });
    };

    const handleParentChange = (event: any) => {
        const value = event.target.value;
        setFormData({ ...formData, parent_id: value === '' ? undefined : Number(value) });
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Category name is required';
        }
        
        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: 'Please fill in all required fields',
                severity: 'error',
            });
            return;
        }

        try {
            setLoading(true);
            await createCategory(formData);
            setSnackbar({
                open: true,
                message: 'Category created successfully!',
                severity: 'success',
            });
            
            // Navigate back to categories list after a short delay
            setTimeout(() => {
                navigate('/courses/categories');
            }, 1500);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to create category',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = () => {
        navigate('/courses/categories');
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
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
                        Admin
                    </Link>
                    <Link component={RouterLink} underline="hover" color="inherit" to="/courses/categories">
                        Categories
                    </Link>
                    <Typography color="text.primary">Create New</Typography>
                </Breadcrumbs>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, fontSize: '2rem' }}>
                    Create New Category
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                    Organize your courses by creating a new category. This will be visible to all students on the library page.
                </Typography>
            </Box>

            <Grid container spacing={6}>
                <Grid item xs={12} lg={8}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                bgcolor: '#ffffff',
                            }}
                        >
                            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
                                        Category Name *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. Data Science & Analytics"
                                        value={formData.name}
                                        onChange={handleChange('name')}
                                        error={!!errors.name}
                                        helperText={errors.name}
                                        InputProps={{
                                            sx: {
                                                px: 0.5,
                                                py: 0.75,
                                                borderRadius: 2,
                                                bgcolor: '#ffffff',
                                            },
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
                                        URL Slug *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. data-science-analytics"
                                        value={formData.slug}
                                        onChange={handleChange('slug')}
                                        error={!!errors.slug}
                                        helperText={errors.slug || 'Auto-generated from name, but you can customize it'}
                                        InputProps={{
                                            sx: {
                                                px: 0.5,
                                                py: 0.75,
                                                borderRadius: 2,
                                                bgcolor: '#ffffff',
                                            },
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
                                        Description
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        placeholder="Briefly describe what students will learn in this category..."
                                        value={formData.description}
                                        onChange={handleChange('description')}
                                        InputProps={{
                                            sx: {
                                                px: 0.5,
                                                py: 0.75,
                                                borderRadius: 2,
                                                bgcolor: '#ffffff',
                                            },
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
                                        Parent Category (Optional)
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={formData.parent_id || ''}
                                            onChange={handleParentChange}
                                            displayEmpty
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: '#ffffff',
                                            }}
                                        >
                                            <MenuItem value="">None (Top Level Category)</MenuItem>
                                            {categories.map((category) => (
                                                <MenuItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                                            Select Visual Icon
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                                            gap: 1.5,
                                        }}
                                    >
                                        {iconOptions.map((option) => (
                                            <Box
                                                key={option.key}
                                                onClick={() => handleIconSelect(option.key)}
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: selectedIcon === option.key ? theme.palette.primary.main : '#e2e8f0',
                                                    bgcolor: selectedIcon === option.key ? 'rgba(43, 140, 238, 0.1)' : '#ffffff',
                                                    color: selectedIcon === option.key ? theme.palette.primary.main : '#64748b',
                                                    borderRadius: 2,
                                                    aspectRatio: '1 / 1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: selectedIcon === option.key ? '0 0 0 2px rgba(43, 140, 238, 0.2)' : 'none',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        bgcolor: 'rgba(43, 140, 238, 0.05)',
                                                    },
                                                }}
                                            >
                                                {option.icon}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
                                        Accent Color
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {accentColors.map((accent) => (
                                            <Box
                                                key={accent.key}
                                                onClick={() => handleColorSelect(accent.color)}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: accent.color,
                                                    border: selectedColor === accent.color ? `2px solid ${accent.color}` : 'none',
                                                    boxShadow: selectedColor === accent.color ? '0 0 0 4px rgba(43, 140, 238, 0.2)' : 'none',
                                                    transition: 'transform 0.2s ease',
                                                    cursor: 'pointer',
                                                    '&:hover': { transform: 'scale(1.08)' },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                            <Button 
                                onClick={handleDiscard}
                                variant="text" 
                                sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}
                            >
                                Discard Changes
                            </Button>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    onClick={handleSubmit}
                                    variant="contained"
                                    disabled={loading}
                                    sx={{ 
                                        textTransform: 'none', 
                                        fontWeight: 600,
                                        bgcolor: theme.palette.primary.main,
                                        px: 4,
                                    }}
                                >
                                    {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create Category'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 24 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1,
                                borderRadius: 3,
                                border: '1px dashed #cbd5e1',
                                bgcolor: 'rgba(148, 163, 184, 0.08)',
                            }}
                        >
                            <Paper elevation={0} sx={{ borderRadius: 3, p: 3, bgcolor: '#ffffff' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
                                        STUDENT VIEW PREVIEW
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {[0, 1, 2].map((dot) => (
                                            <Box key={dot} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e2e8f0' }} />
                                        ))}
                                    </Box>
                                </Box>
                                <Box sx={{ mb: 3 }}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            aspectRatio: '4 / 3',
                                            borderRadius: 3,
                                            bgcolor: selectedColor || theme.palette.primary.main,
                                            overflow: 'hidden',
                                            boxShadow: '0 24px 30px -18px rgba(15, 23, 42, 0.35)',
                                        }}
                                    >
                                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255, 255, 255, 0.15)' }} />
                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Box
                                                sx={{
                                                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                                                    borderRadius: 3,
                                                    p: 2,
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                }}
                                            >
                                                {React.cloneElement(
                                                    iconOptions.find(opt => opt.key === selectedIcon)?.icon || <AnalyticsIcon />,
                                                    { sx: { fontSize: 48, color: '#ffffff' } }
                                                )}
                                            </Box>
                                        </Box>
                                        <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                                            <Box sx={{ height: 6, borderRadius: 999, bgcolor: 'rgba(0, 0, 0, 0.1)' }}>
                                                <Box sx={{ height: '100%', width: '35%', bgcolor: 'rgba(255, 255, 255, 0.4)', borderRadius: 999 }} />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                                    {formData.name || 'Category Name'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#64748b', fontSize: '0.875rem' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <MenuBookIcon sx={{ fontSize: 16 }} />
                                        0 Courses
                                    </Box>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <GroupIcon sx={{ fontSize: 16 }} />
                                        0 Students
                                    </Box>
                                </Box>
                            </Paper>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                bgcolor: '#ffffff',
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 2 }}>
                                Status & Visibility
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                                    Active Status
                                </Typography>
                                <Switch
                                    checked={formData.is_active}
                                    onChange={handleSwitchChange('is_active')}
                                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main } }}
                                />
                            </Box>
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                                    Featured on Home
                                </Typography>
                                <Switch
                                    checked={formData.is_featured}
                                    onChange={handleSwitchChange('is_featured')}
                                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main } }}
                                />
                            </Box>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid rgba(43, 140, 238, 0.2)',
                                bgcolor: 'rgba(43, 140, 238, 0.06)',
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <InfoIcon sx={{ color: theme.palette.primary.main, mt: 0.25 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                        Category Tips
                                    </Typography>
                                    <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0, color: '#475569', fontSize: '0.875rem' }}>
                                        <li>Keep names under 30 characters for best display on mobile.</li>
                                        <li>Use a distinct icon to help students visually navigate.</li>
                                        <li>Color-coding helps categorize different course types (e.g., Tech vs Soft Skills).</li>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>

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

export default CreateCourseCategory;
