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
    Grid,
    Card,
    CardContent,
    Skeleton,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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
    School as SchoolIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    FileDownload as FileDownloadIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { PhoneInput } from 'react-international-phone';
import studentsService, { Student, CreateStudentPayload, UpdateStudentPayload } from '../services/students';

const Students: React.FC = () => {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [showPassword, setShowPassword] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

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

    // Calculate statistics
    const stats = {
        total: students.length,
        active: students.filter(s => s.is_active).length,
        inactive: students.filter(s => !s.is_active).length,
        recent: students.filter(s => {
            const joinDate = new Date(s.created_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return joinDate >= thirtyDaysAgo;
        }).length,
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await studentsService.getAllStudents();
            setStudents(response.data || []);
        } catch (err: any) {
            console.error('Error fetching students:', err);
            setError(err.response?.data?.message || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter((student) => {
        const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        const matchesSearch = fullName.includes(search) || student.email.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && student.is_active) || 
            (statusFilter === 'inactive' && !student.is_active);
        return matchesSearch && matchesStatus;
    });

    const handleOpenDialog = (student: Student | null = null) => {
        if (student) {
            setFormData({
                email: student.email,
                password: '',
                first_name: student.first_name,
                last_name: student.last_name,
                phone: student.phone || '',
                is_active: student.is_active,
            });
            setSelectedStudent(student);
        } else {
            setFormData({
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                phone: '',
                is_active: true,
            });
            setSelectedStudent(null);
        }
        setFormErrors({});
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedStudent(null);
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

        if (!selectedStudent && !formData.password) {
            errors.password = 'Password is required for new students';
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
            if (selectedStudent) {
                const payload: UpdateStudentPayload = {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone || undefined,
                    is_active: formData.is_active,
                };
                if (formData.password) {
                    payload.password = formData.password;
                }
                await studentsService.updateStudent(selectedStudent.id, payload);
                setSnackbar({ open: true, message: 'Student updated successfully', severity: 'success' });
            } else {
                const payload: CreateStudentPayload = {
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone || undefined,
                    is_active: formData.is_active,
                };
                await studentsService.createStudent(payload);
                setSnackbar({ open: true, message: 'Student created successfully', severity: 'success' });
            }
            handleCloseDialog();
            fetchStudents();
        } catch (err: any) {
            console.error('Error saving student:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to save student',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (student: Student) => {
        setStudentToDelete(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;

        try {
            await studentsService.deleteStudent(studentToDelete.id, 'permanent');
            setSnackbar({ open: true, message: 'Student deleted successfully', severity: 'success' });
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
            fetchStudents();
        } catch (err: any) {
            console.error('Error deleting student:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to delete student',
                severity: 'error',
            });
        }
    };

    const getAvatarInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Breadcrumbs
                        separator={<NavigateNextIcon fontSize="small" />}
                        aria-label="breadcrumb"
                        sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                    >
                        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/dashboard">
                            Home
                        </MuiLink>
                        <Typography color="text.primary">Students</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>
                        Students Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4c739a', mt: 1 }}>
                        Manage and oversee all students on your platform
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#e7edf3',
                            color: '#0d141b',
                            '&:hover': {
                                borderColor: '#cbd5e1',
                                bgcolor: '#f8fafc',
                            },
                        }}
                    >
                        Export
                    </Button>
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
                        Add Student
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.palette.primary.main,
                            }}>
                                <PeopleIcon />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                    {loading ? <Skeleton width={40} /> : stats.total}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4c739a' }}>
                                    Total Students
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: alpha('#16a34a', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#16a34a',
                            }}>
                                <CheckCircleIcon />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                    {loading ? <Skeleton width={40} /> : stats.active}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4c739a' }}>
                                    Active Students
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: alpha('#dc2626', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#dc2626',
                            }}>
                                <CancelIcon />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                    {loading ? <Skeleton width={40} /> : stats.inactive}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4c739a' }}>
                                    Inactive
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: alpha('#9333ea', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9333ea',
                            }}>
                                <TrendingUpIcon />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                    {loading ? <Skeleton width={40} /> : stats.recent}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4c739a' }}>
                                    New (30 days)
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Filters and Search */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#4c739a' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        flex: 1,
                        minWidth: 250,
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
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                        size="small"
                        sx={{ bgcolor: '#f6f7f8', borderRadius: 2 }}
                    >
                        <MenuItem value="all">All Students</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    sx={{ bgcolor: '#f6f7f8', borderRadius: 2, p: 0.5 }}
                >
                    <ToggleButton value="table" sx={{ borderRadius: 1 }}>
                        <ViewListIcon />
                    </ToggleButton>
                    <ToggleButton value="grid" sx={{ borderRadius: 1 }}>
                        <ViewModuleIcon />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Students Display - Table View */}
            {viewMode === 'table' && (
            <Paper
                sx={{
                    borderRadius: 3,
                    border: '1px solid #e7edf3',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                }}
            >
                {loading ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f6f7f8' }}>
                                    <TableCell sx={{ py: 2 }}><Skeleton width={100} /></TableCell>
                                    <TableCell align="center"><Skeleton width={60} /></TableCell>
                                    <TableCell align="center"><Skeleton width={60} /></TableCell>
                                    <TableCell align="center"><Skeleton width={80} /></TableCell>
                                    <TableCell align="center"><Skeleton width={60} /></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Skeleton variant="circular" width={40} height={40} />
                                                <Box>
                                                    <Skeleton width={120} height={20} />
                                                    <Skeleton width={180} height={16} />
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center"><Skeleton width={100} /></TableCell>
                                        <TableCell align="center"><Skeleton width={60} /></TableCell>
                                        <TableCell align="center"><Skeleton width={80} /></TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Skeleton variant="circular" width={32} height={32} />
                                                <Skeleton variant="circular" width={32} height={32} />
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
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
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <TableRow
                                            key={student.id}
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
                                                        {getAvatarInitials(student.first_name, student.last_name)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 500, color: '#0d141b' }}>
                                                            {student.first_name} {student.last_name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#4c739a' }}>
                                                            {student.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: '#4c739a', borderColor: '#e7edf3' }} align="center">
                                                {student.phone || '—'}
                                            </TableCell>
                                            <TableCell sx={{ borderColor: '#e7edf3' }} align="center">
                                                <Chip
                                                    label={student.is_active ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: student.is_active ? '#f0fdf4' : '#fee2e2',
                                                        color: student.is_active ? '#16a34a' : '#dc2626',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#4c739a', borderColor: '#e7edf3' }} align="center">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell sx={{ borderColor: '#e7edf3' }} align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(student)}
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
                                                        onClick={() => handleDeleteClick(student)}
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
                                        <TableCell colSpan={5} align="center" sx={{ py: 8, borderColor: '#e7edf3' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: '50%',
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                                                </Box>
                                                <Typography variant="h6" sx={{ color: '#0d141b', fontWeight: 600 }}>
                                                    {students.length === 0 ? 'No Students Yet' : 'No Results Found'}
                                                </Typography>
                                                <Typography sx={{ color: '#4c739a', maxWidth: 400, textAlign: 'center' }}>
                                                    {students.length === 0 
                                                        ? 'Get started by adding your first student to the platform' 
                                                        : 'Try adjusting your search or filters to find what you\'re looking for'}
                                                </Typography>
                                                {students.length === 0 && (
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => handleOpenDialog()}
                                                        sx={{
                                                            mt: 2,
                                                            bgcolor: theme.palette.primary.main,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Add First Student
                                                    </Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
            )}

            {/* Students Display - Grid View */}
            {viewMode === 'grid' && (
                <>
                    {loading ? (
                        <Grid container spacing={3}>
                            {[1, 2, 3, 4].map((i) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <Skeleton variant="circular" width={56} height={56} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Skeleton width={120} height={24} />
                                                    <Skeleton width={180} height={16} />
                                                </Box>
                                            </Box>
                                            <Skeleton width="100%" height={20} />
                                            <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : filteredStudents.length > 0 ? (
                        <Grid container spacing={3}>
                            {filteredStudents.map((student) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                                    <Card sx={{ 
                                        borderRadius: 3, 
                                        border: '1px solid #e7edf3',
                                        boxShadow: 'none',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: theme.palette.primary.main,
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        width: 56,
                                                        height: 56,
                                                        fontSize: '1.25rem',
                                                    }}
                                                >
                                                    {getAvatarInitials(student.first_name, student.last_name)}
                                                </Avatar>
                                                <Chip
                                                    label={student.is_active ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: student.is_active ? '#f0fdf4' : '#fee2e2',
                                                        color: student.is_active ? '#16a34a' : '#dc2626',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0d141b', mb: 0.5 }}>
                                                {student.first_name} {student.last_name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#4c739a', mb: 2 }}>
                                                {student.email}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    📞 {student.phone || 'No phone'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                                                Joined: {new Date(student.created_at).toLocaleDateString()}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: '1px solid #e7edf3' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleOpenDialog(student)}
                                                    sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDeleteClick(student)}
                                                    sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
                                                >
                                                    Delete
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
                            <Box sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#0d141b', fontWeight: 600 }}>
                                {students.length === 0 ? 'No Students Yet' : 'No Results Found'}
                            </Typography>
                            <Typography sx={{ color: '#4c739a', maxWidth: 400, textAlign: 'center' }}>
                                {students.length === 0 
                                    ? 'Get started by adding your first student to the platform' 
                                    : 'Try adjusting your search or filters to find what you\'re looking for'}
                            </Typography>
                            {students.length === 0 && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog()}
                                    sx={{
                                        mt: 2,
                                        bgcolor: theme.palette.primary.main,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Add First Student
                                </Button>
                            )}
                        </Box>
                    )}
                </>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#0d141b' }}>
                    {selectedStudent ? 'Edit Student' : 'Add New Student'}
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
                            placeholder="student@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={!!formErrors.email}
                            helperText={formErrors.email}
                            size="small"
                        />
                        <TextField
                            label={selectedStudent ? 'Password (leave blank to keep current)' : 'Password'}
                            fullWidth
                            required={!selectedStudent}
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
                        {submitting ? <CircularProgress size={20} color="inherit" /> : selectedStudent ? 'Update Student' : 'Add Student'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#0d141b' }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{studentToDelete?.first_name} {studentToDelete?.last_name}</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
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

export default Students;
