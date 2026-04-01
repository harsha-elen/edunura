'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, TextField,
    Avatar, IconButton, Grid, useTheme,
    Autocomplete,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    MenuItem,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    UploadFile as UploadFileIcon,
    Download as DownloadIcon,
    Close as CloseIcon,
    Groups as GroupsIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import {
    getCourseEnrollments,
    enrollStudent,
    unenrollStudent,
    searchAvailableStudents,
    importEnrollmentRowsBulk,
    Enrollment,
    AvailableStudent,
} from '@/services/enrollmentService';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';
import * as XLSX from 'xlsx';

interface StudentsSectionProps {
    courseId: number;
    enrollmentLimit?: number;
}

interface ImportSummary {
    totalRows: number;
    successCount: number;
    failedCount: number;
    createdUsers: number;
    enrolledExisting: number;
    alreadyEnrolled: number;
    failedRows: Array<{ row: number; reason: string }>;
}

type FieldKey = 'email' | 'first_name' | 'last_name' | 'phone';

const StudentsSection: React.FC<StudentsSectionProps> = ({ courseId, enrollmentLimit }) => {
    const theme = useTheme();

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [options, setOptions] = useState<AvailableStudent[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<AvailableStudent | null>(null);
    const [bulkEnrollModalOpen, setBulkEnrollModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
    const [excelRows, setExcelRows] = useState<Array<Array<string>>>([]);
    const [mappingError, setMappingError] = useState('');
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
    const [fieldMap, setFieldMap] = useState<Record<FieldKey, string>>({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
    });

    const fetchEnrollments = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getCourseEnrollments(courseId);
            setEnrollments(data.enrollments || []);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            console.error('Error fetching enrollments:', err);
            setError(`Error: ${e.response?.data?.message || e.message || 'Failed to load enrollments'}`);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    useEffect(() => {
        const search = async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setOptions([]);
                return;
            }
            setSearchLoading(true);
            try {
                const data = await searchAvailableStudents(courseId, searchTerm, 1, 10);
                setOptions(data.students);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setSearchLoading(false);
            }
        };

        const debounce = setTimeout(() => { search(); }, 500);
        return () => clearTimeout(debounce);
    }, [searchTerm, courseId]);

    const handleEnrollStudent = async () => {
        if (!selectedStudent) return;
        try {
            setSearchLoading(true);
            await enrollStudent(courseId, selectedStudent.id);
            setSuccessMessage(`Successfully enrolled ${selectedStudent.first_name} ${selectedStudent.last_name}`);
            fetchEnrollments();
            setSelectedStudent(null);
            setSearchTerm('');
            setOptions([]);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to enroll student');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleUnenrollStudent = async (enrollment: Enrollment) => {
        if (!window.confirm(`Are you sure you want to unenroll ${enrollment.student.first_name} ${enrollment.student.last_name}?`)) {
            return;
        }
        try {
            await unenrollStudent(courseId, enrollment.student_id);
            setSuccessMessage(`Successfully unenrolled ${enrollment.student.first_name} ${enrollment.student.last_name}`);
            setEnrollments(enrollments.filter(e => e.id !== enrollment.id));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to unenroll student');
        }
    };

    const normalizeHeader = (header: string): string => header.trim().toLowerCase().replace(/\s+/g, '_');

    const autoMapFields = (headers: string[]): Record<FieldKey, string> => {
        const byNormalized = new Map(headers.map(h => [normalizeHeader(h), h]));
        return {
            email: byNormalized.get('email') || '',
            first_name: byNormalized.get('first_name') || byNormalized.get('firstname') || byNormalized.get('first') || '',
            last_name: byNormalized.get('last_name') || byNormalized.get('lastname') || byNormalized.get('last') || '',
            phone: byNormalized.get('phone') || byNormalized.get('mobile') || byNormalized.get('phone_number') || '',
        };
    };

    const resetBulkImportState = () => {
        setSelectedFileName('');
        setExcelHeaders([]);
        setExcelRows([]);
        setMappingError('');
        setImporting(false);
        setImportProgress(0);
        setImportSummary(null);
        setFieldMap({ email: '', first_name: '', last_name: '', phone: '' });
    };

    const handleBulkModalClose = () => {
        if (importing) return;
        setBulkEnrollModalOpen(false);
    };

    const handleFileSelected = async (file: File) => {
        try {
            setMappingError('');
            setImportSummary(null);

            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                setMappingError('No worksheet found in the uploaded file.');
                return;
            }

            const sheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, {
                header: 1,
                raw: false,
                defval: '',
            }) as Array<Array<string | number>>;

            if (!rows.length || rows.length < 2) {
                setMappingError('File must contain a header row and at least one data row.');
                return;
            }

            const headers = rows[0].map(cell => String(cell).trim()).filter(Boolean);
            if (!headers.length) {
                setMappingError('Header row is empty.');
                return;
            }

            const dataRows = rows
                .slice(1)
                .map(r => r.map(cell => String(cell ?? '').trim()))
                .filter(r => r.some(cell => cell !== ''));

            if (!dataRows.length) {
                setMappingError('No valid data rows found.');
                return;
            }

            setSelectedFileName(file.name);
            setExcelHeaders(headers);
            setExcelRows(dataRows);
            setFieldMap(autoMapFields(headers));
        } catch (err) {
            console.error('Failed to parse excel:', err);
            setMappingError('Failed to read the file. Please upload a valid Excel or CSV file.');
        }
    };

    const getMappedValue = (row: string[], headers: string[], mappedHeader: string): string => {
        if (!mappedHeader) return '';
        const idx = headers.findIndex(h => h === mappedHeader);
        if (idx < 0) return '';
        return (row[idx] || '').trim();
    };

    const handleStartImport = async () => {
        if (!fieldMap.email) {
            setMappingError('Email mapping is mandatory. Please map an email column.');
            return;
        }

        setMappingError('');
        setImporting(true);
        setImportProgress(20);

        try {
            const rowsPayload = excelRows.map((row) => ({
                email: getMappedValue(row, excelHeaders, fieldMap.email).toLowerCase(),
                first_name: getMappedValue(row, excelHeaders, fieldMap.first_name) || undefined,
                last_name: getMappedValue(row, excelHeaders, fieldMap.last_name) || undefined,
                phone: getMappedValue(row, excelHeaders, fieldMap.phone) || undefined,
            }));

            setImportProgress(60);
            const summary = await importEnrollmentRowsBulk(courseId, rowsPayload);
            setImportProgress(100);
            setImportSummary(summary);
            fetchEnrollments();
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            setMappingError(apiErr?.response?.data?.message || apiErr?.message || 'Bulk import failed');
        } finally {
            setImporting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 4, px: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            {successMessage && <Alert severity="success" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

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
                                        slotProps={{
                                            input: {
                                                ...params.InputProps,
                                                startAdornment: <SearchIcon sx={{ mr: 1, color: '#4c739a' }} />,
                                                endAdornment: (
                                                    <React.Fragment>
                                                        {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </React.Fragment>
                                                ),
                                            },
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
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    resetBulkImportState();
                                    setBulkEnrollModalOpen(true);
                                }}
                                sx={{
                                    px: 4,
                                    minWidth: 'fit-content',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Bulk Enroll
                            </Button>
                        </Box>
                        {enrollmentLimit !== undefined && enrollments.length >= enrollmentLimit && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                Enrollment limit reached ({enrollmentLimit})
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 3, md: 4 } }}>
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
                                <Grid size={{ xs: 12, md: 6 }} key={enrollment.id}>
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

            <Dialog
                open={bulkEnrollModalOpen}
                onClose={handleBulkModalClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pb: 1.5,
                        pt: 2.5,
                        px: 3,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                bgcolor: `${theme.palette.primary.main}14`,
                                color: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <GroupsIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                Bulk Enroll Students
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                Import learners in one go using an Excel file
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleBulkModalClose} size="small" disabled={importing}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            mb: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 1,
                            borderRadius: '10px',
                            bgcolor: '#eef2ff',
                            border: '1px solid #e0e7ff',
                        }}
                    >
                        <DescriptionIcon sx={{ color: '#4f46e5', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: '#3730a3', fontWeight: 600 }}>
                            Supported format: .xlsx, .xls, .csv
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            border: '2px dashed #cbd5e1',
                            borderRadius: '14px',
                            p: { xs: 2.5, sm: 3.5 },
                            bgcolor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            alignItems: { xs: 'stretch', sm: 'center' },
                            textAlign: { xs: 'left', sm: 'center' },
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                boxShadow: `0 8px 24px ${theme.palette.primary.main}1A`,
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: '14px',
                                bgcolor: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <UploadFileIcon />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                Upload Student Spreadsheet
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                Choose a prepared Excel file to add multiple students quickly.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Box sx={{ px: 1.25, py: 0.5, borderRadius: '999px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>Column: email</Typography>
                            </Box>
                            <Box sx={{ px: 1.25, py: 0.5, borderRadius: '999px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>Column: first_name</Typography>
                            </Box>
                            <Box sx={{ px: 1.25, py: 0.5, borderRadius: '999px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>Column: last_name</Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1.5,
                                flexDirection: { xs: 'column', sm: 'row' },
                                width: '100%',
                                justifyContent: 'center',
                            }}
                        >
                            <Button
                                variant="contained"
                                startIcon={<UploadFileIcon />}
                                component="label"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    px: 2.5,
                                    py: 1,
                                }}
                            >
                                Upload Excel Sheet
                                <input
                                    hidden
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                            handleFileSelected(file);
                                        }
                                        event.currentTarget.value = '';
                                    }}
                                />
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                component="a"
                                href="/samples/bulk-enroll-sample.csv"
                                download="bulk-enroll-sample.csv"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    px: 2.5,
                                    py: 1,
                                }}
                            >
                                Download Sample Excel
                            </Button>
                        </Box>

                        {selectedFileName && (
                            <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>
                                Selected file: {selectedFileName}
                            </Typography>
                        )}

                        {!!excelHeaders.length && (
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    gap: 1.5,
                                }}
                            >
                                <TextField
                                    select
                                    label="Email Column *"
                                    value={fieldMap.email}
                                    onChange={(e) => setFieldMap(prev => ({ ...prev, email: e.target.value }))}
                                    size="small"
                                >
                                    {excelHeaders.map(header => (
                                        <MenuItem key={header} value={header}>{header}</MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    label="First Name Column"
                                    value={fieldMap.first_name}
                                    onChange={(e) => setFieldMap(prev => ({ ...prev, first_name: e.target.value }))}
                                    size="small"
                                >
                                    <MenuItem value="">Not mapped</MenuItem>
                                    {excelHeaders.map(header => (
                                        <MenuItem key={header} value={header}>{header}</MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    label="Last Name Column"
                                    value={fieldMap.last_name}
                                    onChange={(e) => setFieldMap(prev => ({ ...prev, last_name: e.target.value }))}
                                    size="small"
                                >
                                    <MenuItem value="">Not mapped</MenuItem>
                                    {excelHeaders.map(header => (
                                        <MenuItem key={header} value={header}>{header}</MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    label="Phone Column"
                                    value={fieldMap.phone}
                                    onChange={(e) => setFieldMap(prev => ({ ...prev, phone: e.target.value }))}
                                    size="small"
                                >
                                    <MenuItem value="">Not mapped</MenuItem>
                                    {excelHeaders.map(header => (
                                        <MenuItem key={header} value={header}>{header}</MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        )}

                        {!!excelRows.length && (
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Rows ready to import: {excelRows.length}
                            </Typography>
                        )}

                        {!!mappingError && (
                            <Alert severity="error" sx={{ width: '100%' }}>
                                {mappingError}
                            </Alert>
                        )}

                        {importing && (
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                                        Importing students...
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 700 }}>
                                        {importProgress}%
                                    </Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={importProgress} sx={{ height: 8, borderRadius: 999 }} />
                            </Box>
                        )}

                        {importSummary && (
                            <Box
                                sx={{
                                    width: '100%',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    p: 2,
                                    bgcolor: '#f8fafc',
                                }}
                            >
                                <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>Import Result</Typography>
                                <Typography variant="body2" sx={{ color: '#334155' }}>Total rows: {importSummary.totalRows}</Typography>
                                <Typography variant="body2" sx={{ color: '#16a34a' }}>Succeeded: {importSummary.successCount}</Typography>
                                <Typography variant="body2" sx={{ color: '#dc2626' }}>Failed: {importSummary.failedCount}</Typography>
                                <Typography variant="body2" sx={{ color: '#334155' }}>Created users: {importSummary.createdUsers}</Typography>
                                <Typography variant="body2" sx={{ color: '#334155' }}>Enrolled existing users: {importSummary.enrolledExisting}</Typography>
                                <Typography variant="body2" sx={{ color: '#334155' }}>Already enrolled: {importSummary.alreadyEnrolled}</Typography>
                                {!!importSummary.failedRows.length && (
                                    <Box sx={{ mt: 1.25, maxHeight: 150, overflow: 'auto' }}>
                                        {importSummary.failedRows.slice(0, 10).map((failed, idx) => (
                                            <Typography key={`${failed.row}-${idx}`} variant="caption" sx={{ display: 'block', color: '#b91c1c' }}>
                                                Row {failed.row}: {failed.reason}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                    <Button
                        onClick={handleStartImport}
                        variant="contained"
                        disabled={importing || !excelRows.length || !fieldMap.email}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                    >
                        {importing ? 'Importing...' : 'Start Import'}
                    </Button>
                    <Button
                        onClick={handleBulkModalClose}
                        variant="text"
                        disabled={importing}
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StudentsSection;
