'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Search as SearchIcon,
    Timer as TimerIcon,
    TrendingUp as TrendingUpIcon,
    Analytics as AnalyticsIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    AssignmentSubmission,
    AssignmentSubmissionStatus,
    getAssignmentSubmissionsForTeacher,
    getCourseWithCurriculum,
    getCourses,
    reviewAssignmentSubmission,
} from '@/services/courseService';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';

type DashboardRole = 'admin' | 'teacher';

type SubmissionFilter = 'all' | 'submitted' | 'reviewed' | 'resubmit_required';

interface AssignmentSubmissionsDashboardProps {
    role: DashboardRole;
    courseId?: number;
}

interface SubmissionRow {
    id: number;
    courseId: number;
    courseTitle: string;
    lessonId: number;
    lessonTitle: string;
    studentId: number;
    studentName: string;
    studentEmail: string;
    studentAvatar: string | null;
    submittedAt: string;
    status: AssignmentSubmissionStatus;
    score: number | null;
    feedback: string | null;
    submissionFilePath: string;
    submissionFileName: string;
}

interface AssignmentLessonRef {
    id: number;
    title: string;
    courseId: number;
    courseTitle: string;
}

const getStatusChip = (status: AssignmentSubmissionStatus) => {
    if (status === 'reviewed') {
        return { label: 'Graded', bg: '#dbeafe', color: '#1d4ed8' };
    }
    if (status === 'resubmit_required') {
        return { label: 'Resubmit Required', bg: '#fee2e2', color: '#991b1b' };
    }
    return { label: 'Pending', bg: '#ede9fe', color: '#5b21b6' };
};

const getTeacherAssignedCourses = (courses: any[], userId: number): any[] => {
    return courses.filter((course) => {
        if (!course?.instructors) return false;

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
};

const buildAssetUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${STATIC_ASSETS_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const AssignmentSubmissionsDashboard: React.FC<AssignmentSubmissionsDashboardProps> = ({ role, courseId }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<SubmissionRow[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<SubmissionFilter>('all');
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewingRow, setReviewingRow] = useState<SubmissionRow | null>(null);
    const [reviewScore, setReviewScore] = useState<string>('');
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [savingReview, setSavingReview] = useState(false);
    const [courseName, setCourseName] = useState<string>('');

    useEffect(() => {
        const loadAllSubmissions = async () => {
            try {
                setLoading(true);
                setError(null);

                const coursesResponse = await getCourses({ page: 1, limit: 1000 });
                const allCourses = coursesResponse?.data?.courses || [];

                let scopedCourses = allCourses;
                if (role === 'teacher') {
                    const userRaw = localStorage.getItem('user');
                    if (!userRaw) {
                        setError('User information not found');
                        setLoading(false);
                        return;
                    }
                    const user = JSON.parse(userRaw);
                    scopedCourses = getTeacherAssignedCourses(allCourses, user.id);
                }

                // Filter to specific course if courseId provided
                if (courseId) {
                    const course = scopedCourses.find((c: any) => c.id === courseId);
                    if (course) {
                        scopedCourses = [course];
                        setCourseName(course.title);
                    } else {
                        setError('Course not found');
                        setLoading(false);
                        return;
                    }
                }

                const courseCurricula = await Promise.all(
                    scopedCourses.map(async (course: any) => {
                        try {
                            const response = await getCourseWithCurriculum(course.id);
                            return response?.data || null;
                        } catch {
                            return null;
                        }
                    })
                );

                const assignmentLessons: AssignmentLessonRef[] = [];
                courseCurricula.forEach((course) => {
                    if (!course?.sections) return;
                    course.sections.forEach((section: any) => {
                        const lessons = section?.lessons || [];
                        lessons.forEach((lesson: any) => {
                            if (lesson.content_type === 'assignment') {
                                assignmentLessons.push({
                                    id: lesson.id,
                                    title: lesson.title,
                                    courseId: course.id,
                                    courseTitle: course.title,
                                });
                            }
                        });
                    });
                });

                const submissionResults = await Promise.all(
                    assignmentLessons.map(async (lesson) => {
                        try {
                            const response = await getAssignmentSubmissionsForTeacher(lesson.id);
                            const submissions: AssignmentSubmission[] = response?.data || [];
                            return submissions.map((submission) => ({ lesson, submission }));
                        } catch {
                            return [] as Array<{ lesson: AssignmentLessonRef; submission: AssignmentSubmission }>;
                        }
                    })
                );

                const flattenedRows: SubmissionRow[] = submissionResults.flat().map(({ lesson, submission }) => ({
                    id: submission.id,
                    courseId: lesson.courseId,
                    courseTitle: lesson.courseTitle,
                    lessonId: lesson.id,
                    lessonTitle: lesson.title,
                    studentId: submission.student_id,
                    studentName: `${submission.student?.first_name || ''} ${submission.student?.last_name || ''}`.trim() || 'Unknown Student',
                    studentEmail: submission.student?.email || '-',
                    studentAvatar: submission.student?.avatar || null,
                    submittedAt: submission.submitted_at,
                    status: submission.status,
                    score: submission.score ?? null,
                    feedback: submission.feedback ?? null,
                    submissionFilePath: submission.file_path,
                    submissionFileName: submission.file_name || 'Assignment Submission',
                }));

                setRows(flattenedRows);
            } catch (err: any) {
                setError(err?.response?.data?.message || err?.message || 'Failed to load assignment submissions');
            } finally {
                setLoading(false);
            }
        };

        void loadAllSubmissions();
    }, [role, courseId]);

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const statusMatch = statusFilter === 'all' ? true : row.status === statusFilter;
            if (!statusMatch) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                row.studentName.toLowerCase().includes(q)
                || row.studentEmail.toLowerCase().includes(q)
                || row.courseTitle.toLowerCase().includes(q)
                || row.lessonTitle.toLowerCase().includes(q)
            );
        });
    }, [rows, searchQuery, statusFilter]);

    const totalStudents = useMemo(() => new Set(rows.map((r) => r.studentId)).size, [rows]);
    const submittedCount = rows.length;
    const pendingCount = rows.filter((r) => r.status === 'submitted').length;
    const scoredRows = rows.filter((r) => typeof r.score === 'number');
    const classAverage = scoredRows.length
        ? Math.round(scoredRows.reduce((sum, row) => sum + (row.score || 0), 0) / scoredRows.length)
        : null;

    const openReviewDialog = (row: SubmissionRow) => {
        setReviewingRow(row);
        setReviewScore(row.score === null ? '' : String(row.score));
        setReviewFeedback(row.feedback || '');
        setReviewDialogOpen(true);
    };

    const closeReviewDialog = () => {
        setReviewDialogOpen(false);
        setReviewingRow(null);
    };

    const handleReviewScoreChange = (rawValue: string) => {
        const digitsOnly = rawValue.replace(/\D/g, '');
        if (!digitsOnly) {
            setReviewScore('');
            return;
        }

        const numericValue = Number(digitsOnly);
        setReviewScore(String(Math.min(100, numericValue)));
    };

    const handleSaveReview = async () => {
        if (!reviewingRow) return;
        try {
            setSavingReview(true);
            const sanitizedScore = reviewScore.trim() === ''
                ? null
                : Math.min(100, Number(reviewScore.replace(/\D/g, '')));

            const payload = {
                status: 'reviewed' as AssignmentSubmissionStatus,
                feedback: reviewFeedback,
                score: Number.isNaN(sanitizedScore) ? null : sanitizedScore,
            };

            const response = await reviewAssignmentSubmission(reviewingRow.id, payload);
            const updated = response.data;

            setRows((prev) => prev.map((row) => (
                row.id === reviewingRow.id
                    ? {
                        ...row,
                        status: updated.status,
                        score: updated.score ?? null,
                        feedback: updated.feedback ?? null,
                    }
                    : row
            )));
            closeReviewDialog();
        } catch {
            // Keep dialog open so user can retry
        } finally {
            setSavingReview(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {courseId ? `${courseName} - Assignments` : 'Assignment Submissions'}
                    </Typography>
                    <Typography sx={{ color: '#64748b' }}>
                        {courseId ? 'Review and grade student assignments for this course.' : 'Manage and evaluate student performance for assignments.'}
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                            Total Students
                        </Typography>
                        <Typography sx={{ fontSize: '1.95rem', fontWeight: 800, color: '#0f172a' }}>
                            {totalStudents}
                        </Typography>
                        <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75, color: '#047857', fontSize: '0.82rem', fontWeight: 600 }}>
                            <TrendingUpIcon sx={{ fontSize: 16 }} />
                            Active participation
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                            Submitted
                        </Typography>
                        <Typography sx={{ fontSize: '1.95rem', fontWeight: 800, color: theme.palette.primary.main }}>
                            {submittedCount}
                        </Typography>
                        <Box sx={{ mt: 1.25, height: 6, bgcolor: '#e2e8f0', borderRadius: 999 }}>
                            <Box sx={{ height: '100%', width: `${submittedCount === 0 ? 0 : Math.min(100, Math.round((submittedCount / Math.max(totalStudents, 1)) * 100))}%`, bgcolor: theme.palette.primary.main, borderRadius: 999 }} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                            Pending Review
                        </Typography>
                        <Typography sx={{ fontSize: '1.95rem', fontWeight: 800, color: '#7c3aed' }}>
                            {pendingCount}
                        </Typography>
                        <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75, color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                            <TimerIcon sx={{ fontSize: 16 }} />
                            Awaiting evaluation
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                            Class Average
                        </Typography>
                        <Typography sx={{ fontSize: '1.95rem', fontWeight: 800, color: '#0f172a' }}>
                            {classAverage === null ? '--' : `${classAverage}%`}
                        </Typography>
                        <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75, color: '#2563eb', fontSize: '0.82rem', fontWeight: 600 }}>
                            <AnalyticsIcon sx={{ fontSize: 16 }} />
                            Based on graded submissions
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ p: 2, borderRadius: '12px 12px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', boxShadow: 'none', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All Submissions' },
                        { key: 'submitted', label: 'Pending' },
                        { key: 'reviewed', label: 'Graded' },
                        { key: 'resubmit_required', label: 'Resubmit Required' },
                    ].map((chip) => (
                        <Chip
                            key={chip.key}
                            label={chip.label}
                            onClick={() => setStatusFilter(chip.key as SubmissionFilter)}
                            sx={{
                                borderRadius: 999,
                                fontWeight: 700,
                                bgcolor: statusFilter === chip.key ? alpha(theme.palette.primary.main, 0.15) : '#f8fafc',
                                color: statusFilter === chip.key ? theme.palette.primary.main : '#64748b',
                            }}
                        />
                    ))}
                </Box>

                <TextField
                    size="small"
                    placeholder="Search students, course or assignment"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 320 } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8' }} />
                                </InputAdornment>
                            ),
                            sx: { bgcolor: '#f8fafc', borderRadius: 2 },
                        },
                    }}
                />
            </Paper>

            <Paper sx={{ border: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px', boxShadow: 'none', overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assignment</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Submission Date</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ py: 6 }}>
                                    <Typography sx={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                        No submissions found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}

                        {filteredRows.map((row) => {
                            const status = getStatusChip(row.status);
                            return (
                                <TableRow key={row.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                src={row.studentAvatar ? `${STATIC_ASSETS_BASE_URL}${row.studentAvatar.startsWith('/') ? row.studentAvatar : '/' + row.studentAvatar}` : undefined}
                                                sx={{ width: 36, height: 36 }}
                                            />
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                                    {row.studentName}
                                                </Typography>
                                                <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                    {row.studentEmail}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>{row.lessonTitle}</Typography>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.74rem' }}>{row.courseTitle}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: '#0f172a', fontSize: '0.84rem' }}>
                                        {new Date(row.submittedAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={status.label}
                                            sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, borderRadius: 999, fontSize: '0.72rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {typeof row.score === 'number' ? (
                                            <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>{row.score}</Typography>
                                        ) : (
                                            <Typography sx={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.84rem' }}>Not Graded</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'right' }}>
                                        <Button
                                            onClick={() => openReviewDialog(row)}
                                            variant="outlined"
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>

            <Dialog
                open={reviewDialogOpen}
                onClose={closeReviewDialog}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    sx: {
                        maxWidth: '1100px',
                        height: '88vh',
                        borderRadius: '1rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box
                        sx={{
                            px: 4,
                            py: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '0.75rem',
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <AssignmentIcon sx={{ color: theme.palette.primary.main }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                    Assignment Submission Review
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                    Review student work, assign score, and publish feedback
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={closeReviewDialog} sx={{ color: '#94a3b8' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <DialogContent
                        sx={{
                            p: 0,
                            display: 'flex',
                            flex: 1,
                            overflow: 'hidden',
                            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                        }}
                    >
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 4, height: 16, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
                                    Assignment Title
                                </Typography>
                                <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: '0.75rem', boxShadow: 'none' }}>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {reviewingRow?.lessonTitle || '-'}
                                    </Typography>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mt: 0.25 }}>
                                        {reviewingRow?.courseTitle || '-'}
                                    </Typography>
                                </Paper>
                            </Box>

                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                    gap: 2,
                                }}
                            >
                                <Paper sx={{ p: 2, borderRadius: '0.75rem', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
                                        Submitted File
                                    </Typography>
                                    {reviewingRow?.submissionFilePath ? (
                                        <Button
                                            href={buildAssetUrl(reviewingRow.submissionFilePath)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            startIcon={<DownloadIcon />}
                                            variant="outlined"
                                            sx={{ textTransform: 'none', fontWeight: 700, width: '100%', justifyContent: 'flex-start' }}
                                        >
                                            Download {reviewingRow.submissionFileName}
                                        </Button>
                                    ) : (
                                        <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>No submission file found.</Typography>
                                    )}
                                </Paper>

                                <Paper sx={{ p: 2, borderRadius: '0.75rem', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
                                        Grading
                                    </Typography>
                                    <TextField
                                        label="Score (Out of 100)"
                                        type="text"
                                        value={reviewScore}
                                        onChange={(e) => handleReviewScoreChange(e.target.value)}
                                        slotProps={{
                                            htmlInput: {
                                                inputMode: 'numeric',
                                                pattern: '[0-9]*',
                                                maxLength: 3,
                                            },
                                        }}
                                        fullWidth
                                    />
                                </Paper>
                            </Box>

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 4, height: 16, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
                                    Remarks
                                </Typography>
                                <Paper
                                    sx={{
                                        p: 3,
                                        borderRadius: '1rem',
                                        border: `1px solid ${theme.palette.divider}`,
                                        boxShadow: 'none',
                                        minHeight: 320,
                                        bgcolor: theme.palette.background.paper,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '0.75rem',
                                            bgcolor: theme.palette.background.paper,
                                        },
                                    }}
                                >
                                    <TextField
                                        value={reviewFeedback}
                                        onChange={(e) => setReviewFeedback(e.target.value)}
                                        multiline
                                        minRows={10}
                                        fullWidth
                                        placeholder="Write detailed feedback for the student..."
                                    />
                                </Paper>
                            </Box>
                        </Box>

                        <Box sx={{ width: 360, borderLeft: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2 }}>Student Details</Typography>
                                <Paper sx={{ p: 2, borderRadius: '0.75rem', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar
                                            src={reviewingRow?.studentAvatar ? `${STATIC_ASSETS_BASE_URL}${reviewingRow.studentAvatar.startsWith('/') ? reviewingRow.studentAvatar : `/${reviewingRow.studentAvatar}`}` : undefined}
                                            sx={{ width: 44, height: 44 }}
                                        />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }} noWrap>
                                                {reviewingRow?.studentName || '-'}
                                            </Typography>
                                            <Typography sx={{ color: '#64748b', fontSize: '0.76rem' }} noWrap>
                                                {reviewingRow?.studentEmail || '-'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 1.75 }}>
                                        <Typography sx={{ fontSize: '0.74rem', color: '#64748b', mb: 0.6 }}>Current Status</Typography>
                                        {reviewingRow && (
                                            <Chip
                                                label={getStatusChip(reviewingRow.status).label}
                                                sx={{
                                                    bgcolor: getStatusChip(reviewingRow.status).bg,
                                                    color: getStatusChip(reviewingRow.status).color,
                                                    fontWeight: 700,
                                                    borderRadius: 999,
                                                    fontSize: '0.72rem',
                                                }}
                                            />
                                        )}
                                    </Box>

                                    <Typography sx={{ fontSize: '0.74rem', color: '#64748b', mt: 1.5, mb: 0.25 }}>Submitted At</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                                        {reviewingRow?.submittedAt ? new Date(reviewingRow.submittedAt).toLocaleString() : '-'}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    </DialogContent>

                    <DialogActions
                        sx={{
                            px: 4,
                            py: 2.5,
                            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                            borderTop: `1px solid ${theme.palette.divider}`,
                            gap: 1.5,
                        }}
                    >
                        <Button
                            onClick={closeReviewDialog}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: '#64748b',
                                px: 3,
                                py: 1.1,
                                borderRadius: '0.5rem',
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveReview}
                            variant="contained"
                            disabled={savingReview}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                px: 3.5,
                                py: 1.1,
                                borderRadius: '0.5rem',
                                boxShadow: 'none',
                            }}
                        >
                            {savingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    );
};

export default AssignmentSubmissionsDashboard;
