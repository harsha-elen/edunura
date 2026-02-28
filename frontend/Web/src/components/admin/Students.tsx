'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { getAllStudents, createStudent, updateStudent, deleteStudent, Student, CreateStudentPayload, UpdateStudentPayload } from '@/services/students';

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
            const response = await getAllStudents();
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
        setFormData({ email: '', password: '', first_name: '', last_name: '', phone: '', is_active: true });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
        if (!selectedStudent && !formData.password) errors.password = 'Password is required for new students';
        else if (formData.password && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (!formData.first_name.trim()) errors.first_name = 'First name is required';
        if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            if (selectedStudent) {
                const payload: UpdateStudentPayload = { email: formData.email, first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone || undefined, is_active: formData.is_active };
                if (formData.password) payload.password = formData.password;
                await updateStudent(selectedStudent.id, payload);
                setSnackbar({ open: true, message: 'Student updated successfully', severity: 'success' });
            } else {
                const payload: CreateStudentPayload = { email: formData.email, password: formData.password, first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone || undefined, is_active: formData.is_active };
                await createStudent(payload);
                setSnackbar({ open: true, message: 'Student created successfully', severity: 'success' });
            }
            handleCloseDialog();
            fetchStudents();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save student', severity: 'error' });
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
            await deleteStudent(studentToDelete.id, 'permanent');
            setSnackbar({ open: true, message: 'Student deleted successfully', severity: 'success' });
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
            fetchStudents();
        } catch (err: any) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete student', severity: 'error' });
        }
    };

    const getAvatarInitials = (firstName: string, lastName: string) => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}>
                        <MuiLink component={Link} underline="hover" color="inherit" href="/admin">Home</MuiLink>
                        <Typography color="text.primary">Students</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>Students Management</Typography>
                    <Typography variant="body2" sx={{ color: '#4c739a', mt: 1 }}>Manage and oversee all students on your platform</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ bgcolor: theme.palette.primary.main, color: 'white', textTransform: 'none', fontWeight: 600, px: 3, '&:hover': { bgcolor: theme.palette.primary.dark || '#1e40af' } }}>
                    Add Student
                </Button>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.primary.main }}><PeopleIcon /></Box>
                            <Box><Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>{stats.total}</Typography><Typography variant="body2" sx={{ color: '#4c739a' }}>Total Students</Typography></Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha('#16a34a', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}><CheckCircleIcon /></Box>
                            <Box><Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>{stats.active}</Typography><Typography variant="body2" sx={{ color: '#4c739a' }}>Active Students</Typography></Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha('#dc2626', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}><CancelIcon /></Box>
                            <Box><Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>{stats.inactive}</Typography><Typography variant="body2" sx={{ color: '#4c739a' }}>Inactive</Typography></Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha('#9333ea', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}><SchoolIcon /></Box>
                            <Box><Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>{stats.recent}</Typography><Typography variant="body2" sx={{ color: '#4c739a' }}>New (30 days)</Typography></Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#4c739a' }} /></InputAdornment> }} sx={{ flex: 1, minWidth: 250, '& .MuiOutlinedInput-root': { bgcolor: '#f6f7f8', borderRadius: 2 } }} />
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status" size="small" sx={{ bgcolor: '#f6f7f8', borderRadius: 2 }}>
                        <MenuItem value="all">All Students</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>
                <ToggleButtonGroup value={viewMode} exclusive onChange={(_, newMode) => newMode && setViewMode(newMode)} size="small" sx={{ bgcolor: '#f6f7f8', borderRadius: 2, p: 0.5 }}>
                    <ToggleButton value="table" sx={{ borderRadius: 1 }}><ViewListIcon /></ToggleButton>
                    <ToggleButton value="grid" sx={{ borderRadius: 1 }}><ViewModuleIcon /></ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {viewMode === 'table' && (
                <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}><CircularProgress /></Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f6f7f8' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3', py: 2 }}>Name & Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">Phone</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">Joined Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#0d141b', borderColor: '#e7edf3' }} align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student) => (
                                            <TableRow key={student.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }, borderBottom: '1px solid #e7edf3' }}>
                                                <TableCell sx={{ fontWeight: 500, color: '#0d141b', borderColor: '#e7edf3', py: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: theme.palette.primary.main, color: 'white', fontWeight: 700, width: 40, height: 40 }}>{getAvatarInitials(student.first_name, student.last_name)}</Avatar>
                                                        <Box><Typography sx={{ fontWeight: 500, color: '#0d141b' }}>{student.first_name} {student.last_name}</Typography><Typography variant="caption" sx={{ color: '#4c739a' }}>{student.email}</Typography></Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ color: '#4c739a', borderColor: '#e7edf3' }} align="center">{student.phone || '—'}</TableCell>
                                                <TableCell sx={{ borderColor: '#e7edf3' }} align="center"><Chip label={student.is_active ? 'Active' : 'Inactive'} size="small" sx={{ bgcolor: student.is_active ? '#f0fdf4' : '#fee2e2', color: student.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} /></TableCell>
                                                <TableCell sx={{ color: '#4c739a', borderColor: '#e7edf3' }} align="center">{new Date(student.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ borderColor: '#e7edf3' }} align="center">
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                        <IconButton size="small" onClick={() => handleOpenDialog(student)} sx={{ color: theme.palette.primary.main, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}><EditIcon sx={{ fontSize: 18 }} /></IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteClick(student)} sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fee2e2' } }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8, borderColor: '#e7edf3' }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} /></Box>
                                                    <Typography variant="h6" sx={{ color: '#0d141b', fontWeight: 600 }}>{students.length === 0 ? 'No Students Yet' : 'No Results Found'}</Typography>
                                                    <Typography sx={{ color: '#4c739a', maxWidth: 400, textAlign: 'center' }}>{students.length === 0 ? 'Get started by adding your first student to the platform' : 'Try adjusting your search or filters'}</Typography>
                                                    {students.length === 0 && <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mt: 2, bgcolor: theme.palette.primary.main, textTransform: 'none', fontWeight: 600 }}>Add First Student</Button>}
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

            {viewMode === 'grid' && (
                <Grid container spacing={3}>
                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={student.id}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: 'none', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' } }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: theme.palette.primary.main, color: 'white', fontWeight: 700, width: 56, height: 56, fontSize: '1.25rem' }}>{getAvatarInitials(student.first_name, student.last_name)}</Avatar>
                                        <Chip label={student.is_active ? 'Active' : 'Inactive'} size="small" sx={{ bgcolor: student.is_active ? '#f0fdf4' : '#fee2e2', color: student.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0d141b', mb: 0.5 }}>{student.first_name} {student.last_name}</Typography>
                                    <Typography variant="body2" sx={{ color: '#4c739a', mb: 2 }}>{student.email}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>Joined: {new Date(student.created_at).toLocaleDateString()}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: '1px solid #e7edf3' }}>
                                        <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(student)} sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>Edit</Button>
                                        <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteClick(student)} sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>Delete</Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )) : (
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
                                <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} /></Box>
                                <Typography variant="h6" sx={{ color: '#0d141b', fontWeight: 600 }}>No Students Found</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#0d141b' }}>{selectedStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField label="First Name" fullWidth required placeholder="Enter first name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} error={!!formErrors.first_name} helperText={formErrors.first_name} size="small" />
                        <TextField label="Last Name" fullWidth required placeholder="Enter last name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} error={!!formErrors.last_name} helperText={formErrors.last_name} size="small" />
                        <TextField label="Email Address" fullWidth required type="email" placeholder="student@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={!!formErrors.email} helperText={formErrors.email} size="small" />
                        <TextField label={selectedStudent ? 'Password (leave blank to keep current)' : 'Password'} fullWidth required={!selectedStudent} type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={!!formErrors.password} helperText={formErrors.password || 'Minimum 6 characters'} size="small" InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" size="small">{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment> }} />
                        <TextField label="Phone Number" fullWidth placeholder="Enter phone number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} size="small" />
                        <TextField label="Status" fullWidth select value={formData.is_active ? 'active' : 'inactive'} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })} size="small" SelectProps={{ native: true }}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleCloseDialog} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: theme.palette.primary.main, color: 'white', textTransform: 'none', '&:hover': { bgcolor: theme.palette.primary.dark || '#1e40af' } }}>
                        {submitting ? <CircularProgress size={20} color="inherit" /> : selectedStudent ? 'Update Student' : 'Add Student'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#0d141b' }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to permanently delete {studentToDelete?.first_name} {studentToDelete?.last_name}? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ textTransform: 'none' }}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default Students;
