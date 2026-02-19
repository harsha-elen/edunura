import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    TextField,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    CircularProgress,
    Alert,
    Snackbar,
    Breadcrumbs,
    Link as MuiLink,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { PhoneInput } from 'react-international-phone';
import teachersService, { Teacher, CreateTeacherPayload, UpdateTeacherPayload } from '../services/teachers';

const Teachers: React.FC = () => {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Fetch teachers from API
    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await teachersService.getAllTeachers();
            setTeachers(response.data || []);
        } catch (err: any) {
            console.error('Error fetching teachers:', err);
            setError(err.response?.data?.message || 'Failed to load teachers');
        } finally {
            setLoading(false);
        }
    };

    const filteredTeachers = teachers.filter((teacher) => {
        const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return (
            fullName.includes(search) ||
            teacher.email.toLowerCase().includes(search)
        );
    });

    const handleOpenDialog = (teacher: Teacher | null = null) => {
        if (teacher) {
            setFormData({
                email: teacher.email,
                password: '',
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                phone: teacher.phone || '',
                is_active: teacher.is_active,
            });
            setSelectedTeacher(teacher);
        } else {
            setFormData({
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                phone: '',
                is_active: true,
            });
            setSelectedTeacher(null);
        }
        setFormErrors({});
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTeacher(null);
        setFormData({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            phone: '',
            is_active: true,
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!selectedTeacher && !formData.password) {
            errors.password = 'Password is required for new teachers';
        } else if (formData.password && formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!formData.first_name.trim()) {
            errors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            errors.last_name = 'Last name is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            if (selectedTeacher) {
                // Update existing teacher
                const payload: UpdateTeacherPayload = {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone || undefined,
                    is_active: formData.is_active,
                };
                if (formData.password) {
                    payload.password = formData.password;
                }
                await teachersService.updateTeacher(selectedTeacher.id, payload);
                setSnackbar({ open: true, message: 'Teacher updated successfully', severity: 'success' });
            } else {
                // Create new teacher
                const payload: CreateTeacherPayload = {
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone || undefined,
                    is_active: formData.is_active,
                };
                await teachersService.createTeacher(payload);
                setSnackbar({ open: true, message: 'Teacher created successfully', severity: 'success' });
            }
            handleCloseDialog();
            fetchTeachers(); // Refresh list
        } catch (err: any) {
            console.error('Error saving teacher:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to save teacher',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this teacher?')) return;

        try {
            await teachersService.deleteTeacher(id);
            setSnackbar({ open: true, message: 'Teacher deleted successfully', severity: 'success' });
            fetchTeachers(); // Refresh list
        } catch (err: any) {
            console.error('Error deleting teacher:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to delete teacher',
                severity: 'error',
            });
        }
    };

    const getAvatarInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Breadcrumbs
                        separator={<NavigateNextIcon fontSize="small" />}
                        aria-label="breadcrumb"
                        sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                    >
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/dashboard">
                            Home
                        </MuiLink>
                        <Typography color="text.primary">Teachers</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>
                        Teachers Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4c739a', mt: 1 }}>
                        Manage and oversee all instructors on your platform ({teachers.length} total)
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': {
                            bgcolor: theme.palette.primary.dark || '#1e40af',
                        },
                    }}
                >
                    Add Teacher
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Search Bar */}
            <TextField
                fullWidth
                placeholder="Search teachers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#4c739a', mr: 1 }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        bgcolor: '#f6f7f8',
                        borderRadius: 2,
                        '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                        },
                    },
                }}
            />

            {/* Teachers Table */}
            <Paper
                sx={{
                    borderRadius: 3,
                    border: '1px solid #e7edf3',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f6f7f8' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3', py: 2 }}>
                                        Name & Email
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">
                                        Phone
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">
                                        Status
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">
                                        Joined Date
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTeachers.length > 0 ? (
                                    filteredTeachers.map((teacher) => (
                                        <TableRow
                                            key={teacher.id}
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                    transition: 'background-color 200ms ease',
                                                },
                                                borderBottom: '1px solid #e7edf3',
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 500, color: '#0d141b', borderColor: '#e7edf3', py: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: theme.palette.primary.main,
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            width: 40,
                                                            height: 40,
                                                        }}
                                                    >
                                                        {getAvatarInitials(teacher.first_name, teacher.last_name)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 500, color: '#0d141b' }}>
                                                            {teacher.first_name} {teacher.last_name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#4c739a' }}>
                                                            {teacher.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#4c739a', borderColor: '#e7edf3' }} align="center">
                                                {teacher.phone || '—'}
                                            </TableCell>
                                            <TableCell sx={{ borderColor: '#e7edf3' }} align="center">
                                                <Chip
                                                    label={teacher.is_active ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: teacher.is_active ? '#f0fdf4' : '#fee2e2',
                                                        color: teacher.is_active ? '#16a34a' : '#dc2626',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#4c739a', borderColor: '#e7edf3' }} align="center">
                                                {new Date(teacher.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell sx={{ borderColor: '#e7edf3' }} align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(teacher)}
                                                        sx={{
                                                            color: theme.palette.primary.main,
                                                            '&:hover': {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            },
                                                        }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(teacher.id)}
                                                        sx={{
                                                            color: '#dc2626',
                                                            '&:hover': {
                                                                bgcolor: '#fee2e2',
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, borderColor: '#e7edf3' }}>
                                            <Typography sx={{ color: '#4c739a' }}>
                                                {teachers.length === 0 ? 'No teachers found. Add your first teacher!' : 'No teachers found matching your search'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Add/Edit Teacher Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#0d141b' }}>
                    {selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="First Name"
                            fullWidth
                            required
                            placeholder="Enter first name"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            error={!!formErrors.first_name}
                            helperText={formErrors.first_name}
                            size="small"
                        />
                        <TextField
                            label="Last Name"
                            fullWidth
                            required
                            placeholder="Enter last name"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            error={!!formErrors.last_name}
                            helperText={formErrors.last_name}
                            size="small"
                        />
                        <TextField
                            label="Email Address"
                            fullWidth
                            required
                            type="email"
                            placeholder="teacher@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={!!formErrors.email}
                            helperText={formErrors.email}
                            size="small"
                        />
                        <TextField
                            label={selectedTeacher ? 'Password (leave blank to keep current)' : 'Password'}
                            fullWidth
                            required={!selectedTeacher}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={!!formErrors.password}
                            helperText={formErrors.password || 'Minimum 6 characters'}
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            edge="end"
                                            size="small"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box>
                            <Typography variant="caption" sx={{ color: '#4c739a', fontWeight: 600, display: 'block', mb: 1 }}>
                                Phone Number
                            </Typography>
                            <Box
                                sx={{
                                    '& .react-international-phone-container': {
                                        width: '100%',
                                    },
                                    '& .react-international-phone-input': {
                                        width: '100%',
                                        height: 40,
                                        borderRadius: '0 4px 4px 0',
                                        borderColor: 'rgba(0, 0, 0, 0.23)',
                                        fontSize: '0.875rem',
                                        backgroundColor: '#ffffff',
                                    },
                                    '& .react-international-phone-input:focus': {
                                        borderColor: theme.palette.primary.main,
                                        boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                                    },
                                    '& .react-international-phone-country-selector-button': {
                                        height: 40,
                                        borderRadius: '4px 0 0 4px',
                                        borderColor: 'rgba(0, 0, 0, 0.23)',
                                        backgroundColor: '#f6f7f8',
                                    },
                                    '& .react-international-phone-country-selector-dropdown': {
                                        zIndex: 1400,
                                    },
                                }}
                            >
                                <PhoneInput
                                    defaultCountry="in"
                                    value={formData.phone}
                                    onChange={(phone) => setFormData({ ...formData, phone })}
                                    placeholder="Enter phone number"
                                />
                            </Box>
                        </Box>
                        <TextField
                            label="Status"
                            fullWidth
                            select
                            value={formData.is_active ? 'active' : 'inactive'}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                            size="small"
                            SelectProps={{
                                native: true,
                            }}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleCloseDialog} disabled={submitting} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: theme.palette.primary.dark || '#1e40af',
                            },
                        }}
                    >
                        {submitting ? <CircularProgress size={20} color="inherit" /> : selectedTeacher ? 'Update Teacher' : 'Add Teacher'}
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

export default Teachers;
