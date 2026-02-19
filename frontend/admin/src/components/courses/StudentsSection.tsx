import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, TextField,
    Avatar, IconButton, Grid, useTheme,
    Autocomplete,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import { enrollmentService, Enrollment, AvailableStudent } from '../../services/enrollmentService';
import { STATIC_ASSETS_BASE_URL } from '../../services/apiClient';

interface StudentsSectionProps {
    courseId: number;
    enrollmentLimit?: number;
}

const StudentsSection: React.FC<StudentsSectionProps> = ({ courseId, enrollmentLimit }) => {
    const theme = useTheme();

    // State
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Search State
    const [options, setOptions] = useState<AvailableStudent[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<AvailableStudent | null>(null);

    // Fetch enrollments
    const fetchEnrollments = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await enrollmentService.getCourseEnrollments(courseId);
            setEnrollments(data.enrollments || []);
        } catch (err: any) {
            console.error('Error fetching enrollments:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load enrollments';
            setError(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    // Search for available students
    useEffect(() => {
        const searchStudents = async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setOptions([]);
                return;
            }

            setSearchLoading(true);
            try {
                const data = await enrollmentService.searchAvailableStudents(courseId, searchTerm, 1, 10);
                setOptions(data.students);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setSearchLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            searchStudents();
        }, 500);

        return () => clearTimeout(debounce);
    }, [searchTerm, courseId]);

    const handleEnrollStudent = async () => {
        if (!selectedStudent) return;

        try {
            setSearchLoading(true);
            await enrollmentService.enrollStudent(courseId, selectedStudent.id);
            setSuccessMessage(`Successfully enrolled ${selectedStudent.first_name} ${selectedStudent.last_name}`);

            // Refresh list
            fetchEnrollments();

            // Reset search
            setSelectedStudent(null);
            setSearchTerm('');
            setOptions([]);

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to enroll student');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleUnenrollStudent = async (enrollment: Enrollment) => {
        if (!window.confirm(`Are you sure you want to unenroll ${enrollment.student.first_name} ${enrollment.student.last_name}?`)) {
            return;
        }

        try {
            await enrollmentService.unenrollStudent(courseId, enrollment.student_id);
            setSuccessMessage(`Successfully unenrolled ${enrollment.student.first_name} ${enrollment.student.last_name}`);
            setEnrollments(enrollments.filter(e => e.id !== enrollment.id));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to unenroll student');
        }
    };

    return (
        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 4, px: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Alerts */}
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            {successMessage && <Alert severity="success" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

            {/* Enrolled Students Card */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3', boxShadow: 'none' }}>
                <Box sx={{ p: { xs: 3, md: 4 }, borderBottom: '1px solid #e7edf3' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 3, mb: 4 }}>
                        <Box sx={{ maxWidth: '448px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Enrolled Students</Typography>
                            <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>
                                Manage student enrollments for this specific course.
                            </Typography>
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Enroll Student</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Autocomplete
                                fullWidth
                                openOnFocus
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
                                options={options}
                                loading={searchLoading}
                                onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                                onChange={(_, newValue) => setSelectedStudent(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search for a student by name or email..."
                                        size="medium"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: <SearchIcon sx={{ mr: 1, color: '#4c739a' }} />,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { bgcolor: 'rgba(246, 247, 248, 0.5)', borderRadius: '8px' }
                                        }}
                                    />
                                )}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleEnrollStudent}
                                disabled={!selectedStudent}
                                sx={{
                                    px: 4,
                                    minWidth: 'fit-content',
                                    bgcolor: theme.palette.primary.main,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap',
                                    boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                                    '&:hover': { bgcolor: theme.palette.primary.dark },
                                }}
                            >
                                Enroll Student
                            </Button>
                        </Box>
                        {enrollmentLimit !== undefined && enrollments.length >= enrollmentLimit && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                Enrollment limit reached ({enrollmentLimit})
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 3, md: 4 }, spaceY: 4 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#4c739a', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 3 }}>
                        Enrolled Students ({enrollments.length})
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {enrollments.map((enrollment) => (
                                <Grid item xs={12} md={6} key={enrollment.id}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: '12px',
                                            border: '1px solid #e7edf3',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            '&:hover': { border: `1px solid ${theme.palette.primary.main}4D`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                src={enrollment.student?.avatar ? `${STATIC_ASSETS_BASE_URL}${enrollment.student.avatar}` : undefined}
                                                sx={{ width: 56, height: 56, border: '2px solid #e7edf3' }}
                                            >
                                                {enrollment.student?.first_name?.charAt(0) || 'S'}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0d141b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {enrollment.student?.first_name || 'Unknown'} {enrollment.student?.last_name || ''}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#4c739a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {enrollment.student?.email || 'No email'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleUnenrollStudent(enrollment)}
                                                sx={{ color: '#4c739a', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' } }}
                                            >
                                                <DeleteIcon sx={{ fontSize: '1.25rem' }} />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default StudentsSection;
