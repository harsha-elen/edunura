'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import {
    Box,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    Grid,
    CircularProgress,
    Snackbar,
    Alert,
    Breadcrumbs,
    Link,
    useTheme,
} from '@mui/material';
import { alpha, Theme } from '@mui/material/styles';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
    ArrowBack as ArrowBackIcon,
    PlayArrow as PlayIcon,
    Check as CheckIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    BookmarkBorder as BookmarkIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    UploadFile as UploadFileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    Description as DocumentIcon,
    InsertDriveFile as FileIcon,
    VideoLibrary as VideoFileIcon,
    Videocam as VideoCallIcon,
} from '@mui/icons-material';
import VideoPlayer from '@/components/VideoPlayer';
import JitsiMeetingComponent from '@/components/JitsiMeetingComponent';
import { getOrgLogoUrl } from '@/services/settings';
import {
    getCourseWithCurriculum,
    getCourseProgress,
    markLessonComplete,
    markLessonIncomplete,
    getVideoUrl,
    getResourceUrl,
    getJitsiConfig,
    getLiveClassStatus,
    getStudentQuiz,
    submitStudentQuiz,
    getMyAssignmentSubmission,
    submitAssignment,
    CourseWithSections,
    CourseProgress,
    Lesson,
    StudentQuizQuestion,
    StudentQuizAttemptResult,
    AssignmentSubmission,
} from '@/services/courseService';

type QuizResultStatus = 'correct' | 'wrong' | 'review';

interface QuizCheckResult {
    status: QuizResultStatus;
    explanation?: string | null;
    correctAnswer?: string;
}

const mapAttemptResultToQuizResult = (result: StudentQuizAttemptResult): QuizCheckResult => ({
    status: result.status,
    explanation: result.explanation,
    correctAnswer: result.correct_answer,
});

const getErrorMessage = (error: unknown, fallback: string): string => {
    const e = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
    return e?.response?.data?.message || e?.message || fallback;
};

// ─── Helper Functions ─────────────────────────────────────────

const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return <FileIcon />;
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <PdfIcon />;
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('webp')) return <ImageIcon />;
    if (type.includes('doc') || type.includes('docx') || type.includes('word') || type.includes('text')) return <DocumentIcon />;
    if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) return <VideoFileIcon />;
    return <FileIcon />;
};

const formatFileSize = (size: number | string | undefined): string => {
    if (!size) return '0 MB';
    if (typeof size === 'string') {
        if (size.includes('MB') || size.includes('KB') || size.includes('GB') || size.includes('B')) return size;
        const numSize = parseFloat(size);
        if (isNaN(numSize)) return size;
        if (numSize < 1024) return `${numSize} B`;
        if (numSize < 1024 * 1024) return `${(numSize / 1024).toFixed(2)} KB`;
        return `${(numSize / 1024 / 1024).toFixed(2)} MB`;
    }
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const getFileIconColor = (fileType: string | undefined, theme: Theme) => {
    if (!fileType) return theme.palette.text.secondary;
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return theme.palette.error.main;
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('webp')) return theme.palette.success.main;
    if (type.includes('doc') || type.includes('docx') || type.includes('word') || type.includes('text')) return theme.palette.info.main;
    if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) return '#8b5cf6';
    return theme.palette.text.secondary;
};

const getFileBgColor = (fileType: string | undefined, theme: Theme) => {
    if (!fileType) return theme.palette.action.hover;
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return alpha(theme.palette.error.main, 0.08);
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('webp')) return alpha(theme.palette.success.main, 0.08);
    if (type.includes('doc') || type.includes('docx') || type.includes('word') || type.includes('text')) return alpha(theme.palette.info.main, 0.08);
    if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) return alpha('#8b5cf6', 0.08);
    return theme.palette.action.hover;
};

const escapeHtml = (value: string): string => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeAssetUrl = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
    return '';
};

const renderEditorJsListItems = (items: unknown[]): string => {
    return items.map((item) => {
        if (typeof item === 'string') {
            return `<li>${DOMPurify.sanitize(item)}</li>`;
        }

        if (!item || typeof item !== 'object') return '<li></li>';

        const itemData = item as { content?: string; text?: string; items?: unknown[] };
        const content = DOMPurify.sanitize(itemData.content || itemData.text || '');
        const nestedItems = Array.isArray(itemData.items) && itemData.items.length > 0
            ? `<ul>${renderEditorJsListItems(itemData.items)}</ul>`
            : '';
        return `<li>${content}${nestedItems}</li>`;
    }).join('');
};

const renderEditorJsToHtml = (rawContent: string | undefined, fallbackText: string): string => {
    if (!rawContent) return `<p>${escapeHtml(fallbackText)}</p>`;

    try {
        const parsed = JSON.parse(rawContent);
        if (!Array.isArray(parsed?.blocks)) {
            return DOMPurify.sanitize(rawContent);
        }

        const html = parsed.blocks.map((block: unknown) => {
            const blockData = block as { type?: string; data?: Record<string, unknown> };
            const type = blockData?.type;
            const data = blockData?.data || {};

            const text = typeof data.text === 'string' ? data.text : '';
            const caption = typeof data.caption === 'string' ? data.caption : '';
            const level = Number(data.level);
            const code = typeof data.code === 'string' ? data.code : '';
            const rawHtml = typeof data.html === 'string' ? data.html : '';

            if (type === 'paragraph') {
                return `<p>${DOMPurify.sanitize(text)}</p>`;
            }

            if (type === 'header') {
                const headingLevel = Math.min(6, Math.max(1, level || 2));
                return `<h${headingLevel}>${DOMPurify.sanitize(text)}</h${headingLevel}>`;
            }

            if (type === 'list') {
                const style = data.style === 'ordered' ? 'ol' : 'ul';
                const items = Array.isArray(data.items) ? data.items : [];
                return `<${style}>${renderEditorJsListItems(items)}</${style}>`;
            }

            if (type === 'quote') {
                const quoteText = DOMPurify.sanitize(text);
                const quoteCaption = DOMPurify.sanitize(caption);
                return `<blockquote>${quoteText}${quoteCaption ? `<cite>${quoteCaption}</cite>` : ''}</blockquote>`;
            }

            if (type === 'delimiter') {
                return '<hr />';
            }

            if (type === 'image') {
                const fileData = (data.file && typeof data.file === 'object')
                    ? (data.file as { url?: unknown })
                    : undefined;
                const imageUrl = sanitizeAssetUrl(fileData?.url);
                const imageCaption = DOMPurify.sanitize(caption);
                if (!imageUrl) return '';
                return `<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageCaption || 'Lesson image')}"/>${imageCaption ? `<figcaption>${imageCaption}</figcaption>` : ''}</figure>`;
            }

            if (type === 'table') {
                const rows = Array.isArray(data.content) ? data.content : [];
                if (!rows.length) return '';
                const rowHtml = rows
                    .map((row: unknown) => `<tr>${(Array.isArray(row) ? row : []).map((cell) => `<td>${DOMPurify.sanitize(String(cell || ''))}</td>`).join('')}</tr>`)
                    .join('');
                return `<table><tbody>${rowHtml}</tbody></table>`;
            }

            if (type === 'checklist') {
                const items = Array.isArray(data.items) ? data.items : [];
                const checklistItems = items.map((item: unknown) => {
                    const checklistItem = item as { text?: string; checked?: boolean };
                    const text = DOMPurify.sanitize(checklistItem?.text || '');
                    const checked = Boolean(checklistItem?.checked);
                    return `<li>${checked ? '&#10003; ' : '&#9711; '}${text}</li>`;
                }).join('');
                return `<ul>${checklistItems}</ul>`;
            }

            if (type === 'code') {
                return `<pre><code>${escapeHtml(code)}</code></pre>`;
            }

            if (type === 'raw') {
                return DOMPurify.sanitize(rawHtml);
            }

            return '';
        }).join('');

        return html.trim() || `<p>${escapeHtml(fallbackText)}</p>`;
    } catch {
        return DOMPurify.sanitize(rawContent);
    }
};

// ─── CoursePlayer Component ───────────────────────────────────

export default function CoursePlayer() {
    const params = useParams();
    const router = useRouter();
    const theme = useTheme();

    const courseId = params?.courseId as string;
    const lessonId = params?.lessonId as string | undefined;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<CourseWithSections | null>(null);
    const [progress, setProgress] = useState<CourseProgress | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedModules, setExpandedModules] = useState<number[]>([]);
    const [completingLesson, setCompletingLesson] = useState<number | null>(null);
    const [jitsiEmbedUrl, setJitsiEmbedUrl] = useState<string | null>(null);
    const [jitsiConfig, setJitsiConfig] = useState<{
        domain: string;
        roomName: string;
        jwt?: string;
        displayName: string;
        isModerator: boolean;
    } | null>(null);
    const [orgLogoUrl, setOrgLogoUrl] = useState<string | undefined>(undefined);
    const [jitsiLoading, setJitsiLoading] = useState(false);
    // null = not yet checked, false = host not in yet, true = host joined
    const [hostJoined, setHostJoined] = useState<boolean | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<StudentQuizQuestion[]>([]);
    const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizResults, setQuizResults] = useState<Record<number, QuizCheckResult>>({});
    const [quizPostSubmitView, setQuizPostSubmitView] = useState<'none' | 'report' | 'review'>('none');
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
    const [assignmentSubmission, setAssignmentSubmission] = useState<AssignmentSubmission | null>(null);
    const [assignmentSelectedFile, setAssignmentSelectedFile] = useState<File | null>(null);
    const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);

    const courseIdNum = courseId ? parseInt(courseId) : 0;

    // ─── Fetch Course Data ────────────────────────────────────

    useEffect(() => {
        if (courseId) {
            fetchCourseData();
        }
    }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (course && lessonId) {
            const lesson = findLessonById(parseInt(lessonId));
            if (lesson) {
                setCurrentLesson(lesson);
            }
        } else if (course && course.sections.length > 0) {
            const firstSection = course.sections[0];
            if (firstSection && firstSection.lessons.length > 0) {
                const firstLesson = firstSection.lessons[0];
                setCurrentLesson(firstLesson);
                router.replace(`/course/${courseId}/lesson/${firstLesson.id}`);
            }
        }
    }, [course, lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setActiveTab(0);
    }, [currentLesson?.id]);

    const findLessonById = (id: number): Lesson | null => {
        if (!course) return null;
        for (const section of course.sections) {
            for (const lesson of section.lessons) {
                if (lesson.id === id) return lesson;
            }
        }
        return null;
    };

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [courseResponse, progressResponse] = await Promise.all([
                getCourseWithCurriculum(courseIdNum),
                getCourseProgress(courseIdNum),
            ]);

            if (courseResponse.status === 'success' && courseResponse.data) {
                setCourse(courseResponse.data);
                const firstSection = courseResponse.data.sections[0];
                if (firstSection && firstSection.lessons.length > 0) {
                    setExpandedModules([firstSection.id]);
                }
            } else {
                setError('Failed to load course. Please try again.');
            }

            if (progressResponse.status === 'success' && progressResponse.data) {
                setProgress(progressResponse.data);
            }
        } catch (error: unknown) {
            console.error('Error loading course:', error);
            setError(getErrorMessage(error, 'Failed to load course. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    // ─── Handlers ─────────────────────────────────────────────

    const handleLessonClick = (lesson: Lesson) => {
        setCurrentLesson(lesson);
        setJitsiEmbedUrl(null); // Reset embedded meeting when switching lessons
        setHostJoined(null);    // Reset host status for new lesson
        router.push(`/course/${courseId}/lesson/${lesson.id}`);
    };

    useEffect(() => {
        const loadQuiz = async () => {
            if (!currentLesson || currentLesson.content_type !== 'quiz') {
                setQuizQuestions([]);
                setQuizCurrentIndex(0);
                setQuizAnswers({});
                setQuizSubmitted(false);
                setQuizResults({});
                setQuizPostSubmitView('none');
                return;
            }

            try {
                setQuizLoading(true);
                const response = await getStudentQuiz(currentLesson.id);
                const questions = (response?.data?.questions || []).slice().sort((a, b) => a.order - b.order);
                const attempt = response?.data?.attempt;
                setQuizQuestions(questions);
                setQuizCurrentIndex(0);
                setQuizAnswers(attempt?.answers || {});
                setQuizSubmitted(Boolean(attempt));

                const resultMap: Record<number, QuizCheckResult> = {};
                (attempt?.results || []).forEach((result) => {
                    resultMap[result.question_id] = mapAttemptResultToQuizResult(result);
                });
                setQuizResults(resultMap);
                setQuizPostSubmitView(attempt ? 'report' : 'none');
            } catch (err: unknown) {
                setSnackbar({
                    open: true,
                    message: getErrorMessage(err, 'Failed to load quiz questions'),
                    severity: 'error',
                });
                setQuizQuestions([]);
            } finally {
                setQuizLoading(false);
            }
        };

        void loadQuiz();
    }, [currentLesson]);

    useEffect(() => {
        const loadAssignmentSubmission = async () => {
            if (!currentLesson || currentLesson.content_type !== 'assignment') {
                setAssignmentSubmission(null);
                setAssignmentSelectedFile(null);
                return;
            }

            try {
                setAssignmentLoading(true);
                const response = await getMyAssignmentSubmission(currentLesson.id);
                setAssignmentSubmission(response?.data || null);
            } catch (err: unknown) {
                setSnackbar({
                    open: true,
                    message: getErrorMessage(err, 'Failed to load assignment submission status'),
                    severity: 'error',
                });
            } finally {
                setAssignmentLoading(false);
            }
        };

        void loadAssignmentSubmission();
    }, [currentLesson]);

    const handleQuizAnswerChange = (questionId: number, answer: string) => {
        setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmitQuiz = async () => {
        if (!currentLesson || currentLesson.content_type !== 'quiz') return;

        try {
            setQuizSubmitting(true);
            const payloadAnswers = quizQuestions.map((question) => ({
                question_id: question.id,
                student_answer: (quizAnswers[question.id] || '').trim(),
            }));

            const response = await submitStudentQuiz(currentLesson.id, payloadAnswers);
            const attempt = response.data.attempt;

            const resultMap: Record<number, QuizCheckResult> = {};
            (attempt?.results || []).forEach((result) => {
                resultMap[result.question_id] = mapAttemptResultToQuizResult(result);
            });

            setQuizResults(resultMap);
            setQuizSubmitted(true);
            setQuizAnswers(attempt?.answers || quizAnswers);
            setQuizPostSubmitView('report');
            setSnackbar({
                open: true,
                message: response.data.already_submitted
                    ? 'Quiz already submitted. Showing saved result.'
                    : 'Quiz submitted successfully',
                severity: 'success',
            });
        } catch (err: unknown) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, 'Failed to submit quiz'),
                severity: 'error',
            });
        } finally {
            setQuizSubmitting(false);
        }
    };

    const handleSubmitAssignment = async () => {
        if (!currentLesson || currentLesson.content_type !== 'assignment' || !assignmentSelectedFile) return;

        if (assignmentSelectedFile.type !== 'application/pdf') {
            setSnackbar({
                open: true,
                message: 'Only PDF files are allowed for assignment submission',
                severity: 'error',
            });
            return;
        }

        try {
            setAssignmentSubmitting(true);
            const response = await submitAssignment(currentLesson.id, assignmentSelectedFile);
            setAssignmentSubmission(response.data);
            setAssignmentSelectedFile(null);
            setSnackbar({
                open: true,
                message: response.message || 'Assignment submitted successfully',
                severity: 'success',
            });
        } catch (err: unknown) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, 'Failed to submit assignment'),
                severity: 'error',
            });
        } finally {
            setAssignmentSubmitting(false);
        }
    };

    // ─── Poll host presence for live Jitsi lessons ────────────────────
    // Polls every 8s until hostJoined=true, then stops. Clears when lesson changes.
    useEffect(() => {
        const isJitsiLive =
            currentLesson?.content_type === 'live' &&
            currentLesson?.content_platform === 'jitsi';

        if (!isJitsiLive || hostJoined === true) return;

        const sessionId = currentLesson.jitsi_room_name || currentLesson.id;

        let cancelled = false;
        const checkStatus = async () => {
            try {
                const status = await getLiveClassStatus(sessionId);
                if (!cancelled) setHostJoined(status.isLive);
            } catch {
                // silently ignore poll errors
            }
        };

        checkStatus(); // immediate first check
        const interval = setInterval(checkStatus, 8000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [currentLesson, hostJoined]);

    // ─── Jitsi Meeting End Handler ────────────────────────────
    // Listen for Jitsi's postMessage when meeting ends and close the iframe
    useEffect(() => {
        if (!jitsiEmbedUrl) return;
        const handleJitsiMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (
                    data?.action === 'ready-to-close' ||
                    data?.action === 'video-conference-left' ||
                    data?.event === 'VIDEO_CONFERENCE_LEFT' ||
                    data?.event === 'READY_TO_CLOSE'
                ) {
                    setJitsiEmbedUrl(null); // Close meeting, return to lesson view
                }
            } catch { /* ignore non-JSON messages */ }
        };
        window.addEventListener('message', handleJitsiMessage);
        return () => window.removeEventListener('message', handleJitsiMessage);
    }, [jitsiEmbedUrl]);

    const toggleModule = (moduleId: number) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleMarkComplete = async () => {
        if (!currentLesson || !progress) return;

        const isCompleted = progress.completed_lesson_ids.includes(currentLesson.id);

        try {
            setCompletingLesson(currentLesson.id);

            if (isCompleted) {
                await markLessonIncomplete(courseIdNum, currentLesson.id);
            } else {
                await markLessonComplete(courseIdNum, currentLesson.id);
            }

            const newProgress = await getCourseProgress(courseIdNum);
            if (newProgress.status === 'success' && newProgress.data) {
                setProgress(newProgress.data);
            }

            setSnackbar({
                open: true,
                message: isCompleted ? 'Lesson marked as incomplete' : 'Lesson marked as complete!',
                severity: 'success',
            });
        } catch (error: unknown) {
            setSnackbar({
                open: true,
                message: getErrorMessage(error, 'Failed to update progress'),
                severity: 'error',
            });
        } finally {
            setCompletingLesson(null);
        }
    };

    // ─── Navigation Helpers ───────────────────────────────────

    const getNextLesson = (): Lesson | null => {
        if (!course || !currentLesson) return null;
        let foundCurrent = false;
        for (const section of course.sections) {
            for (const lesson of section.lessons) {
                if (foundCurrent) return lesson;
                if (lesson.id === currentLesson.id) foundCurrent = true;
            }
        }
        return null;
    };

    const getPrevLesson = (): Lesson | null => {
        if (!course || !currentLesson) return null;
        let prevLesson: Lesson | null = null;
        for (const section of course.sections) {
            for (const lesson of section.lessons) {
                if (lesson.id === currentLesson.id) return prevLesson;
                prevLesson = lesson;
            }
        }
        return null;
    };

    const isLessonCompleted = (lessonId: number): boolean => {
        return progress?.completed_lesson_ids.includes(lessonId) || false;
    };

    const isCurrentLesson = (lessonId: number): boolean => {
        return currentLesson?.id === lessonId;
    };

    // ─── Loading / Error / Empty States ───────────────────────

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: theme.palette.background.default,
                flexDirection: 'column',
                gap: 2,
            }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
                <Typography sx={{ color: theme.palette.text.secondary }}>Loading course...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: theme.palette.background.default,
                flexDirection: 'column',
                gap: 2,
                p: 3,
            }}>
                <Typography variant="h6" sx={{ color: theme.palette.error.main }}>{error}</Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push('/student/courses')}
                    sx={{ bgcolor: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.dark } }}
                >
                    Back to My Courses
                </Button>
            </Box>
        );
    }

    if (!course) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: theme.palette.background.default,
                flexDirection: 'column',
                gap: 2,
            }}>
                <Typography sx={{ color: theme.palette.text.secondary }}>Course not found</Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push('/student/courses')}
                    sx={{ bgcolor: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.dark } }}
                >
                    Back to My Courses
                </Button>
            </Box>
        );
    }

    const nextLesson = getNextLesson();
    const prevLesson = getPrevLesson();
    const isCurrentCompleted = currentLesson ? isLessonCompleted(currentLesson.id) : false;
    const isReadingLesson = currentLesson?.content_type === 'text' || currentLesson?.content_type === 'document';
    const isQuizLesson = currentLesson?.content_type === 'quiz';
    const isAssignmentLesson = currentLesson?.content_type === 'assignment';
    const isReaderModeLesson = isReadingLesson || isAssignmentLesson;
    const activeQuizQuestion = quizQuestions[quizCurrentIndex] || null;
    const isLastQuizQuestion = quizCurrentIndex === quizQuestions.length - 1;
    const lessonTabs = isReaderModeLesson ? ['Resources', 'Discussion'] : ['Overview', 'Resources', 'Discussion'];
    const resourcesTabIndex = isReaderModeLesson ? 0 : 1;
    const discussionTabIndex = isReaderModeLesson ? 1 : 2;

    const quizResultCounts = { correct: 0, wrong: 0, review: 0 };
    Object.values(quizResults).forEach((result) => {
        if (result.status === 'correct') quizResultCounts.correct += 1;
        if (result.status === 'wrong') quizResultCounts.wrong += 1;
        if (result.status === 'review') quizResultCounts.review += 1;
    });

    const quizChartData = [
        { name: 'Correct', value: quizResultCounts.correct, color: '#22c55e' },
        { name: 'Wrong', value: quizResultCounts.wrong, color: '#ef4444' },
        { name: 'Review', value: quizResultCounts.review, color: '#f59e0b' },
    ].filter((item) => item.value > 0);
    const assignmentIsGraded = assignmentSubmission?.status === 'reviewed';
    const assignmentScore = typeof assignmentSubmission?.score === 'number' ? assignmentSubmission.score : null;
    const assignmentScorePieData = assignmentScore === null
        ? []
        : [
            { name: 'Score', value: assignmentScore, color: '#22c55e' },
            { name: 'Remaining', value: Math.max(0, 100 - assignmentScore), color: '#e2e8f0' },
        ];
    const assignmentRemarks = (assignmentSubmission?.feedback || '').trim();
    const assignmentRemarksPreview = assignmentRemarks.length > 140
        ? `${assignmentRemarks.slice(0, 140)}...`
        : assignmentRemarks;

    // ─── Render ───────────────────────────────────────────────

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: theme.palette.background.default, fontFamily: '"Lexend", sans-serif' }}>
            {/* ─── Sticky Header ─── */}
            <Box
                component="header"
                sx={{
                    height: 64,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Link
                        onClick={() => router.push('/student/courses')}
                        color="inherit"
                        underline="none"
                        sx={{ display: 'flex', alignItems: 'center', color: theme.palette.text.secondary, cursor: 'pointer', '&:hover': { color: theme.palette.primary.main } }}
                    >
                        <ArrowBackIcon sx={{ fontSize: 24 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, ml: 1, display: { xs: 'none', md: 'block' } }}>
                            Back to Dashboard
                        </Typography>
                    </Link>
                    <Box sx={{ width: '1px', height: 24, bgcolor: theme.palette.divider, display: { xs: 'none', md: 'block' } }} />
                    <Breadcrumbs separator="/" aria-label="breadcrumb">
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '12px' }}>My Courses</Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 500, fontSize: '12px' }}>
                            {course.title}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: '0.05em', fontSize: '10px' }}>
                            Overall Progress
                        </Typography>
                        <Box sx={{ width: 128, height: 6, bgcolor: theme.palette.action.hover, borderRadius: 3, mt: 0.5, overflow: 'hidden' }}>
                            <Box sx={{ width: `${progress?.progress_percentage || 0}%`, height: '100%', bgcolor: theme.palette.primary.main, borderRadius: 3, transition: 'width 0.3s ease' }} />
                        </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main, display: { xs: 'none', sm: 'block' } }}>
                        {progress?.progress_percentage || 0}%
                    </Typography>
                </Box>
            </Box>

            {/* ─── Main Content ─── */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flexGrow: 1 }}>
                {/* ─── Left Column: Video & Content ─── */}
                <Box sx={{ width: { xs: '100%', lg: '75%' }, display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.paper, minWidth: 0 }}>
                    {/* Video Player / Zoom Meeting / Reading Mode / No Video */}
                    <Box sx={{
                        width: '100%',
                        aspectRatio: currentLesson?.content_type === 'live' ? 'auto' : isReadingLesson || isQuizLesson ? 'auto' : '16/9',
                        minHeight: currentLesson?.content_type === 'live' ? 500 : isReadingLesson ? 180 : isQuizLesson ? 420 : 0,
                        bgcolor: isReadingLesson || isQuizLesson || isAssignmentLesson ? theme.palette.background.default : '#000',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {currentLesson?.content_type === 'live' ? (
                            currentLesson?.content_platform === 'jitsi' ? (
                                jitsiConfig ? (
                                    /* ── Embedded Jitsi Meeting using SDK ── */
                                    <Box sx={{ width: '100%', minHeight: 500, position: 'relative', bgcolor: '#000' }}>
                                        <JitsiMeetingComponent
                                            domain={jitsiConfig.domain}
                                            roomName={jitsiConfig.roomName}
                                            jwt={jitsiConfig.jwt}
                                            displayName={jitsiConfig.displayName}
                                            email=""
                                            isModerator={jitsiConfig.isModerator}
                                            logoUrl={orgLogoUrl}
                                            onConferenceLeft={() => {
                                                // Immediately mark host as gone so join button
                                                // is disabled — prevents rejoining an empty room
                                                // before the 8s poll catches up.
                                                setHostJoined(false);
                                                setJitsiConfig(null);
                                            }}
                                        />
                                    </Box>
                                ) : currentLesson?.jitsi_join_url ? (
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: 500,
                                        bgcolor: '#1a1a1a',
                                        p: 4,
                                    }}>
                                        <VideoCallIcon sx={{ fontSize: 80, color: hostJoined ? '#246FE0' : '#94a3b8', mb: 2 }} />
                                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                                            Live Class in Progress
                                        </Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, textAlign: 'center' }}>
                                            {currentLesson?.title}
                                        </Typography>
                                        {/* Host status indicator */}
                                        <Typography sx={{
                                            color: hostJoined ? '#4ade80' : '#fbbf24',
                                            fontSize: '0.8rem',
                                            mb: 3,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}>
                                            <Box component="span" sx={{
                                                display: 'inline-block',
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: hostJoined ? '#4ade80' : '#fbbf24',
                                                animation: hostJoined ? 'none' : 'pulse 1.5s ease-in-out infinite',
                                                '@keyframes pulse': {
                                                    '0%, 100%': { opacity: 1 },
                                                    '50%': { opacity: 0.3 },
                                                },
                                            }} />
                                            {hostJoined === null ? 'Checking host status...' : hostJoined ? 'Host is in the meeting' : 'Waiting for host to join...'}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            disabled={jitsiLoading || hostJoined !== true}
                                            startIcon={jitsiLoading ? <CircularProgress size={20} color="inherit" /> : <VideoCallIcon />}
                                            onClick={async () => {
                                                if (!currentLesson?.jitsi_room_name && !currentLesson?.jitsi_join_url) return;
                                                try {
                                                    setJitsiLoading(true);
                                                    const [res, logoUrl] = await Promise.all([
                                                        getJitsiConfig(currentLesson.jitsi_room_name || currentLesson.id),
                                                        getOrgLogoUrl(),
                                                    ]);
                                                    const { domain, roomName, jwt, displayName, isModerator } = res.data;
                                                    console.log('[STUDENT JITSI] API response:', { domain, roomName, hasJwt: !!jwt, displayName, isModerator });
                                                    console.log('[STUDENT JITSI] Full response data:', JSON.stringify(res.data, null, 2));
                                                    setOrgLogoUrl(logoUrl);
                                                    setJitsiConfig({
                                                        domain,
                                                        roomName,
                                                        jwt,
                                                        displayName: displayName || 'Student',
                                                        isModerator: isModerator || false,
                                                    });
                                                    setJitsiEmbedUrl(`${domain}/${roomName}`);
                                                } catch (err: unknown) {
                                                    const apiErr = err as { response?: { status?: number } };
                                                    console.error('Failed to get Jitsi config:', err);
                                                    // 425 = host not in room yet — reset to waiting state instead of error
                                                    if (apiErr?.response?.status === 425) {
                                                        setHostJoined(false);
                                                        setSnackbar({ open: true, message: 'The host has left the meeting. Waiting for them to rejoin.', severity: 'error' });
                                                    } else {
                                                        setSnackbar({ open: true, message: 'Failed to join meeting. Please try again.', severity: 'error' });
                                                    }
                                                } finally {
                                                    setJitsiLoading(false);
                                                }
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                px: 4,
                                                py: 1.5,
                                                fontSize: '1rem',
                                                bgcolor: hostJoined ? '#246FE0' : '#475569',
                                                '&:hover': { bgcolor: hostJoined ? '#1A5CD8' : '#475569' },
                                                '&.Mui-disabled': { bgcolor: '#334155', color: 'rgba(255,255,255,0.4)' },
                                            }}
                                        >
                                            {jitsiLoading ? 'Connecting...' : hostJoined ? 'Join Live Class' : 'Waiting for Host...'}
                                        </Button>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 2 }}>
                                            Meeting will load right here
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500, bgcolor: '#1a1a1a' }}>
                                        <Box sx={{ textAlign: 'center', color: '#fff' }}>
                                            <PlayIcon sx={{ fontSize: 80, opacity: 0.5 }} />
                                            <Typography variant="h6" sx={{ mt: 2 }}>Jitsi live class starting soon...</Typography>
                                        </Box>
                                    </Box>
                                )
                            ) : (
                                currentLesson?.zoom_join_url ? (
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: 500,
                                        bgcolor: '#1a1a1a',
                                        p: 4,
                                    }}>
                                        <VideoCallIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 2 }} />
                                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                                            Live Class in Progress
                                        </Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, textAlign: 'center' }}>
                                            {currentLesson?.title}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<VideoCallIcon />}
                                            onClick={() => {
                                                if (currentLesson?.zoom_join_url) {
                                                    window.open(currentLesson.zoom_join_url, '_blank');
                                                }
                                            }}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                px: 4,
                                                py: 1.5,
                                                fontSize: '1rem',
                                                bgcolor: theme.palette.primary.main,
                                                '&:hover': { bgcolor: theme.palette.primary.dark },
                                            }}
                                        >
                                            Join Meeting in Zoom
                                        </Button>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 2 }}>
                                            Opens in Zoom app or browser
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500, bgcolor: '#1a1a1a' }}>
                                        <Box sx={{ textAlign: 'center', color: '#fff' }}>
                                            <PlayIcon sx={{ fontSize: 80, opacity: 0.5 }} />
                                            <Typography variant="h6" sx={{ mt: 2 }}>Live class starting soon...</Typography>
                                        </Box>
                                    </Box>
                                )
                            )
                        ) : isQuizLesson ? (
                            <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
                                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                                    {quizLoading ? (
                                        <Box sx={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CircularProgress size={28} />
                                        </Box>
                                    ) : !activeQuizQuestion ? (
                                        <Typography sx={{ color: theme.palette.text.secondary }}>
                                            No quiz questions available.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                            {!quizSubmitted ? (
                                                <>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                                                            Question {quizCurrentIndex + 1} of {quizQuestions.length}
                                                        </Typography>
                                                    </Box>

                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                                                        {activeQuizQuestion.question_text}
                                                    </Typography>

                                                    {activeQuizQuestion.question_type === 'multiple_choice' && (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                            {activeQuizQuestion.options.map((option) => {
                                                                const selected = (quizAnswers[activeQuizQuestion.id] || '') === option.option_text;
                                                                return (
                                                                    <Button
                                                                        key={option.id}
                                                                        variant={selected ? 'contained' : 'outlined'}
                                                                        onClick={() => handleQuizAnswerChange(activeQuizQuestion.id, option.option_text)}
                                                                        sx={{ textTransform: 'none', justifyContent: 'flex-start', py: 1.25, borderRadius: 2 }}
                                                                    >
                                                                        {option.option_text}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </Box>
                                                    )}

                                                    {activeQuizQuestion.question_type === 'true_false' && (
                                                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                            {['true', 'false'].map((value) => {
                                                                const selected = (quizAnswers[activeQuizQuestion.id] || '').toLowerCase() === value;
                                                                return (
                                                                    <Button
                                                                        key={value}
                                                                        variant={selected ? 'contained' : 'outlined'}
                                                                        onClick={() => handleQuizAnswerChange(activeQuizQuestion.id, value)}
                                                                        sx={{ textTransform: 'none', minWidth: 140, py: 1.25, borderRadius: 2 }}
                                                                    >
                                                                        {value === 'true' ? 'True' : 'False'}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </Box>
                                                    )}

                                                    {activeQuizQuestion.question_type === 'short_answer' && (
                                                        <TextField
                                                            multiline
                                                            minRows={3}
                                                            fullWidth
                                                            value={quizAnswers[activeQuizQuestion.id] || ''}
                                                            onChange={(e) => handleQuizAnswerChange(activeQuizQuestion.id, e.target.value)}
                                                            placeholder="Type your answer. This question will be held for teacher review."
                                                        />
                                                    )}

                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, pt: 1 }}>
                                                        <Button
                                                            variant="outlined"
                                                            onClick={() => setQuizCurrentIndex((prev) => Math.max(0, prev - 1))}
                                                            disabled={quizCurrentIndex === 0}
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            Previous Question
                                                        </Button>

                                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                            {!isLastQuizQuestion && (
                                                                <Button
                                                                    variant="contained"
                                                                    onClick={() => setQuizCurrentIndex((prev) => Math.min(quizQuestions.length - 1, prev + 1))}
                                                                    sx={{ textTransform: 'none' }}
                                                                >
                                                                    Next Question
                                                                </Button>
                                                            )}
                                                            {isLastQuizQuestion && (
                                                                <Button
                                                                    variant="contained"
                                                                    onClick={handleSubmitQuiz}
                                                                    disabled={quizSubmitting}
                                                                    sx={{ textTransform: 'none', fontWeight: 700 }}
                                                                >
                                                                    {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </>
                                            ) : (
                                                <>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Typography variant="caption" sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main, fontWeight: 700 }}>
                                                                Submitted
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: alpha(theme.palette.info.main, 0.12), color: theme.palette.info.main, fontWeight: 700 }}>
                                                                Retake Disabled
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                            <Button
                                                                variant={quizPostSubmitView === 'report' ? 'contained' : 'outlined'}
                                                                onClick={() => setQuizPostSubmitView('report')}
                                                                sx={{ textTransform: 'none', fontWeight: 700 }}
                                                            >
                                                                Report
                                                            </Button>
                                                            <Button
                                                                variant={quizPostSubmitView === 'review' ? 'contained' : 'outlined'}
                                                                onClick={() => setQuizPostSubmitView('review')}
                                                                sx={{ textTransform: 'none', fontWeight: 700 }}
                                                            >
                                                                Check Answers
                                                            </Button>
                                                        </Box>
                                                    </Box>

                                                    {quizPostSubmitView === 'report' && quizChartData.length > 0 && (
                                                <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}` }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                                                        Quiz Result Summary
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: { xs: 'column', md: 'row' } }}>
                                                        <Box sx={{ width: 220, height: 220 }}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie data={quizChartData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={2}>
                                                                        {quizChartData.map((entry) => (
                                                                            <Cell key={entry.name} fill={entry.color} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 180 }}>
                                                            {quizChartData.map((item) => (
                                                                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                                        {item.name}: <Box component="span" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>{item.value}</Box>
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}

                                                    {quizPostSubmitView === 'review' && activeQuizQuestion && (
                                                        <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                                Answer Review
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
                                                                Question {quizCurrentIndex + 1} of {quizQuestions.length}
                                                            </Typography>

                                                            <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                                                                    {activeQuizQuestion.question_text}
                                                                </Typography>

                                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                                    Your Answer: <Box component="span" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>{(quizAnswers[activeQuizQuestion.id] || '').trim() || '-'}</Box>
                                                                </Typography>

                                                                {(() => {
                                                                    const result = quizResults[activeQuizQuestion.id];
                                                                    const isReview = result?.status === 'review';
                                                                    const isCorrect = result?.status === 'correct';
                                                                    return (
                                                                        <>
                                                                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: isReview ? '#b45309' : isCorrect ? theme.palette.success.main : theme.palette.error.main, fontWeight: 700 }}>
                                                                                {isReview ? 'Held For Review' : isCorrect ? 'Correct' : 'Wrong'}
                                                                            </Typography>
                                                                            {!isReview && (
                                                                                <Typography variant="body2" sx={{ mt: 0.75, color: theme.palette.text.secondary }}>
                                                                                    Correct Answer: {result?.correctAnswer || '-'}
                                                                                </Typography>
                                                                            )}
                                                                            {result?.explanation && (
                                                                                <Typography variant="body2" sx={{ mt: 0.75, color: theme.palette.text.secondary }}>
                                                                                    Explanation: {result.explanation}
                                                                                </Typography>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </Box>

                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    onClick={() => setQuizCurrentIndex((prev) => Math.max(0, prev - 1))}
                                                                    disabled={quizCurrentIndex === 0}
                                                                    sx={{ textTransform: 'none' }}
                                                                >
                                                                    Previous
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    onClick={() => setQuizCurrentIndex((prev) => Math.min(quizQuestions.length - 1, prev + 1))}
                                                                    disabled={quizCurrentIndex === quizQuestions.length - 1}
                                                                    sx={{ textTransform: 'none' }}
                                                                >
                                                                    Next
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    )}

                                                    {quizPostSubmitView === 'none' && (
                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                            Select Report or Check Answers.
                                                        </Typography>
                                                    )}
                                                </>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        ) : isAssignmentLesson ? (
                            <Box sx={{
                                height: '100%',
                                overflowY: 'auto',
                                bgcolor: theme.palette.background.default,
                                px: { xs: 2, md: 4 },
                                py: { xs: 2, md: 3 },
                            }}>
                                {assignmentLoading ? (
                                    <Box sx={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                ) : (
                                    <Grid container spacing={2.5} sx={{ maxWidth: 1100, mx: 'auto' }}>
                                        <Grid size={{ xs: 12, md: 8 }}>
                                            <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: '#64748b' }}>
                                                    Assignment Brief
                                                </Typography>
                                                <Typography variant="h5" sx={{ mt: 1, mb: 2, fontWeight: 800, lineHeight: 1.25, color: theme.palette.text.primary }}>
                                                    {currentLesson?.title}
                                                </Typography>

                                                <Box sx={{
                                                    fontSize: '1rem',
                                                    lineHeight: 1.9,
                                                    color: theme.palette.text.secondary,
                                                    '& p': { margin: 0, marginBottom: '1rem' },
                                                    '& h1, & h2, & h3, & h4': { color: theme.palette.text.primary, marginBottom: '0.75rem' },
                                                    '& ul, & ol': { margin: 0, marginBottom: '1rem', paddingLeft: '1.25rem' },
                                                    '& a': { color: theme.palette.primary.main },
                                                }}>
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: renderEditorJsToHtml(
                                                                currentLesson?.content_body,
                                                                'Submit your work as a PDF file using the action panel.'
                                                            ),
                                                        }}
                                                    />
                                                </Box>
                                            </Paper>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569' }}>
                                                    Your Submission
                                                </Typography>

                                                {!assignmentIsGraded && (
                                                    <>
                                                        <Button
                                                            component="label"
                                                            variant="outlined"
                                                            startIcon={<UploadFileIcon />}
                                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, justifyContent: 'flex-start' }}
                                                        >
                                                            Choose PDF File
                                                            <input
                                                                hidden
                                                                type="file"
                                                                accept="application/pdf,.pdf"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0] || null;
                                                                    setAssignmentSelectedFile(file);
                                                                }}
                                                            />
                                                        </Button>

                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, minHeight: 20 }}>
                                                            {assignmentSelectedFile ? assignmentSelectedFile.name : 'No file selected'}
                                                        </Typography>

                                                        <Button
                                                            variant="contained"
                                                            onClick={handleSubmitAssignment}
                                                            disabled={!assignmentSelectedFile || assignmentSubmitting}
                                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                                        >
                                                            {assignmentSubmitting ? 'Submitting...' : assignmentSubmission ? 'Replace Submission' : 'Submit Assignment'}
                                                        </Button>
                                                    </>
                                                )}

                                                {assignmentIsGraded && assignmentScore !== null && (
                                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase' }}>
                                                            Grade Summary
                                                        </Typography>
                                                        <Box sx={{ width: '100%', height: 200, mt: 1 }}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={assignmentScorePieData}
                                                                        dataKey="value"
                                                                        nameKey="name"
                                                                        innerRadius={54}
                                                                        outerRadius={74}
                                                                        paddingAngle={2}
                                                                    >
                                                                        {assignmentScorePieData.map((entry) => (
                                                                            <Cell key={entry.name} fill={entry.color} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                    <text
                                                                        x="50%"
                                                                        y="50%"
                                                                        textAnchor="middle"
                                                                        dominantBaseline="middle"
                                                                        fill={theme.palette.success.main}
                                                                        style={{ fontWeight: 800, fontSize: '18px' }}
                                                                    >
                                                                        {`${assignmentScore}/100`}
                                                                    </text>
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </Box>
                                                    </Box>
                                                )}

                                                {assignmentSubmission && (
                                                    <Box sx={{ mt: 0.5, p: 1.5, borderRadius: 2, bgcolor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}` }}>
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                            Last Submitted
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                                            {new Date(assignmentSubmission.submitted_at).toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.75 }}>
                                                            Status
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: assignmentSubmission.status === 'reviewed' ? theme.palette.success.main : assignmentSubmission.status === 'resubmit_required' ? theme.palette.error.main : theme.palette.warning.main }}>
                                                            {assignmentSubmission.status.replace('_', ' ')}
                                                        </Typography>

                                                        {assignmentSubmission.status === 'reviewed' && typeof assignmentSubmission.score === 'number' && (
                                                            <>
                                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.75 }}>
                                                                    Score
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                                                                    {assignmentSubmission.score}/100
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Box>
                                                )}

                                                {assignmentSubmission?.feedback && (
                                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.25)}` }}>
                                                        <Typography variant="caption" sx={{ color: theme.palette.info.main, fontWeight: 700, textTransform: 'uppercase' }}>
                                                            Teacher Feedback
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mt: 0.6, color: theme.palette.text.primary }}>
                                                            {assignmentRemarksPreview}
                                                        </Typography>
                                                        {assignmentRemarks.length > 0 && (
                                                            <Button
                                                                size="small"
                                                                onClick={() => setRemarksDialogOpen(true)}
                                                                sx={{ mt: 0.8, px: 0, textTransform: 'none', fontWeight: 700, minWidth: 0 }}
                                                            >
                                                                Read full remarks
                                                            </Button>
                                                        )}
                                                    </Box>
                                                )}
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                )}
                            </Box>
                        ) : currentLesson?.file_path ? (
                            <VideoPlayer
                                src={getVideoUrl(currentLesson.file_path) || ''}
                                title={currentLesson.title}
                                autoPlay={false}
                            />
                        ) : isReadingLesson ? (
                            <Box sx={{
                                height: '100%',
                                overflowY: 'auto',
                                bgcolor: theme.palette.background.default,
                                px: { xs: 2, md: 4 },
                                py: { xs: 2, md: 3 },
                            }}>
                                <Box sx={{ maxWidth: 980, mx: 'auto' }}>
                                    <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: '#64748b' }}>
                                            Text Lesson
                                        </Typography>
                                        <Typography variant="h5" sx={{ mt: 1, mb: 2, fontWeight: 800, lineHeight: 1.25, color: theme.palette.text.primary }}>
                                            {currentLesson?.title}
                                        </Typography>
                                        <Box sx={{
                                            fontSize: '1.05rem',
                                            lineHeight: 1.95,
                                            color: theme.palette.text.secondary,
                                            '& p': { margin: 0, marginBottom: '1rem' },
                                            '& h1, & h2, & h3, & h4': { color: theme.palette.text.primary, marginBottom: '0.75rem' },
                                            '& ul, & ol': { margin: 0, marginBottom: '1rem', paddingLeft: '1.25rem' },
                                            '& a': { color: theme.palette.primary.main },
                                            '& img': { maxWidth: '100%', borderRadius: 2 },
                                        }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: renderEditorJsToHtml(
                                                        currentLesson?.content_body,
                                                        'No content available for this lesson.'
                                                    ),
                                                }}
                                            />
                                        </Box>
                                    </Paper>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1e293b' }}>
                                <Box sx={{ textAlign: 'center', color: '#fff' }}>
                                    <PlayIcon sx={{ fontSize: 80, opacity: 0.5 }} />
                                    <Typography variant="h6" sx={{ mt: 2 }}>No video available</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* ─── Lesson Details ─── */}
                    <Box sx={{ px: 3, py: 4, flexGrow: 1, overflowY: 'auto' }}>
                        <Box sx={{ maxWidth: '1024px', mx: 'auto' }}>
                            {/* Title & Actions */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, fontSize: { xs: '1.5rem', lg: '1.875rem' } }}>
                                        {currentLesson?.title || 'Select a lesson'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <Box component="span" sx={{ mx: 1 }}>•</Box>
                                        {currentLesson?.duration ? `${Math.floor(currentLesson.duration / 60)}:${String(currentLesson.duration % 60).padStart(2, '0')}` : '0:00'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<BookmarkIcon />}
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            borderColor: theme.palette.divider,
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&:hover': { bgcolor: theme.palette.action.hover, borderColor: theme.palette.divider },
                                        }}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ShareIcon />}
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            borderColor: theme.palette.divider,
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&:hover': { bgcolor: theme.palette.action.hover, borderColor: theme.palette.divider },
                                        }}
                                    >
                                        Share
                                    </Button>
                                </Box>
                            </Box>

                            {/* Mark Complete Button */}
                            {currentLesson && !isQuizLesson && !isAssignmentLesson && (
                                <Box sx={{ mb: 4 }}>
                                    <Button
                                        variant={isCurrentCompleted ? 'outlined' : 'contained'}
                                        onClick={handleMarkComplete}
                                        disabled={completingLesson === currentLesson.id}
                                        startIcon={isCurrentCompleted ? <CheckIcon /> : <PlayIcon />}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            ...(isCurrentCompleted ? {
                                                borderColor: theme.palette.success.main,
                                                color: theme.palette.success.main,
                                                '&:hover': { borderColor: theme.palette.success.main, bgcolor: alpha(theme.palette.success.main, 0.1) },
                                            } : {
                                                bgcolor: theme.palette.primary.main,
                                                '&:hover': { bgcolor: theme.palette.primary.dark },
                                            }),
                                        }}
                                    >
                                        {completingLesson === currentLesson.id
                                            ? 'Updating...'
                                            : isCurrentCompleted
                                                ? 'Mark as Incomplete'
                                                : 'Mark as Complete'}
                                    </Button>
                                </Box>
                            )}

                            {/* Tabs: Overview / Resources / Discussion */}
                            <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 4, overflowX: 'auto' }}>
                                <Box sx={{ display: 'flex', gap: 4 }}>
                                    {lessonTabs.map((tab, index) => (
                                        <Button
                                            key={tab}
                                            onClick={() => setActiveTab(index)}
                                            sx={{
                                                pb: 2,
                                                px: 1,
                                                minWidth: 0,
                                                borderRadius: 0,
                                                borderBottom: 2,
                                                borderColor: activeTab === index ? theme.palette.primary.main : 'transparent',
                                                color: activeTab === index ? theme.palette.primary.main : theme.palette.text.secondary,
                                                fontWeight: activeTab === index ? 600 : 500,
                                                fontSize: '14px',
                                                textTransform: 'none',
                                                '&:hover': { color: activeTab === index ? theme.palette.primary.main : theme.palette.text.primary },
                                            }}
                                        >
                                            {tab}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>

                            {/* Tab Content: Overview */}
                            {!isReaderModeLesson && activeTab === 0 && (
                                <Grid container spacing={6}>
                                    <Grid size={{ xs: 12, xl: 8 }}>
                                        <Box sx={{
                                            fontSize: '1.125rem',
                                            lineHeight: 1.75,
                                            color: theme.palette.text.secondary,
                                            '& img': { maxWidth: '100%', borderRadius: 2 },
                                            '& a': { color: theme.palette.primary.main },
                                            '& h1, & h2, & h3, & h4': { color: theme.palette.text.primary },
                                        }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurify.sanitize(currentLesson?.content_body || 'No content available for this lesson.')
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}

                            {/* Tab Content: Resources */}
                            {activeTab === resourcesTabIndex && (
                                <Grid container spacing={6}>
                                    <Grid size={{ xs: 12, xl: 8 }}>
                                        <Box sx={{ bgcolor: theme.palette.action.hover, p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                                                    Lesson Resources
                                                </Typography>
                                                {currentLesson?.resources && currentLesson.resources.length > 1 && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<DownloadIcon />}
                                                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.dark } }}
                                                        onClick={() => {
                                                            currentLesson?.resources?.forEach((resource) => {
                                                                const link = document.createElement('a');
                                                                link.href = getResourceUrl(resource.file_path);
                                                                link.download = resource.title;
                                                                link.target = '_blank';
                                                                link.click();
                                                            });
                                                        }}
                                                    >
                                                        Download All
                                                    </Button>
                                                )}
                                            </Box>
                                            {currentLesson?.resources && currentLesson.resources.length > 0 ? (
                                                <Grid container spacing={2}>
                                                    {currentLesson.resources.map((resource) => (
                                                        <Grid size={{ xs: 12, sm: 6 }} key={resource.id}>
                                                            <Box
                                                                component="a"
                                                                href={getResourceUrl(resource.file_path)}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    p: 2,
                                                                    bgcolor: theme.palette.background.paper,
                                                                    borderRadius: 2,
                                                                    border: `1px solid ${theme.palette.action.hover}`,
                                                                    textDecoration: 'none',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    height: '100%',
                                                                    '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) },
                                                                }}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                                    <Box sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        bgcolor: getFileBgColor(resource.file_type, theme),
                                                                        color: getFileIconColor(resource.file_type, theme),
                                                                        borderRadius: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        mr: 2,
                                                                        flexShrink: 0,
                                                                    }}>
                                                                        {getFileIcon(resource.file_type)}
                                                                    </Box>
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {resource.title}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                                            {formatFileSize(resource.file_size)}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.text.disabled, ml: 1, flexShrink: 0 }}>
                                                                    <DownloadIcon />
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                    No resources available for this lesson.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}

                            {/* Tab Content: Discussion */}
                            {activeTab === discussionTabIndex && (
                                <Box sx={{ py: 4 }}>
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                        Discussion feature coming soon.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* ─── Right Column: Course Sidebar ─── */}
                <Box
                    component="aside"
                    sx={{
                        width: { xs: '100%', lg: '25%' },
                        borderLeft: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.background.paper,
                        display: 'flex',
                        flexDirection: 'column',
                        height: { lg: 'calc(100vh - 64px)' },
                        position: { lg: 'sticky' },
                        top: { lg: 64 },
                    }}
                >
                    {/* Sidebar Header */}
                    <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.action.hover}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem', color: theme.palette.text.primary }}>Course Content</Typography>
                            <Typography variant="caption" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, px: 1, py: 0.5, borderRadius: 9999, fontWeight: 700, fontSize: '10px' }}>
                                {progress?.progress_percentage || 0}% DONE
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 6, bgcolor: theme.palette.action.hover, borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ width: `${progress?.progress_percentage || 0}%`, height: '100%', bgcolor: theme.palette.primary.main, borderRadius: 3, transition: 'width 0.3s ease' }} />
                        </Box>
                    </Box>

                    {/* Section / Lesson List */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: theme.palette.divider, borderRadius: '10px' } }}>
                        {course.sections.map((section) => {
                            const isExpanded = expandedModules.includes(section.id);
                            return (
                                <Box key={section.id} sx={{ borderBottom: `1px solid ${theme.palette.action.hover}` }}>
                                    {/* Section Header */}
                                    <Button
                                        fullWidth
                                        onClick={() => toggleModule(section.id)}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            bgcolor: isExpanded ? alpha(theme.palette.primary.main, 0.05) : theme.palette.action.hover,
                                            color: isExpanded ? theme.palette.primary.main : theme.palette.text.primary,
                                            textTransform: 'none',
                                            textAlign: 'left',
                                            '&:hover': { bgcolor: isExpanded ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.08) },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                                {section.title}
                                            </Typography>
                                        </Box>
                                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </Button>

                                    {/* Lesson Items */}
                                    {isExpanded && (
                                        <Box sx={{ p: 0.5 }}>
                                            {section.lessons.map((lesson) => {
                                                const isCompleted = isLessonCompleted(lesson.id);
                                                const isCurrent = isCurrentLesson(lesson.id);

                                                return (
                                                    <Box
                                                        key={lesson.id}
                                                        onClick={() => handleLessonClick(lesson)}
                                                        sx={{
                                                            p: 1.5,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            borderRadius: 2,
                                                            cursor: 'pointer',
                                                            bgcolor: isCurrent ? alpha(theme.palette.primary.main, 0.1) : theme.palette.background.paper,
                                                            borderLeft: isCurrent ? `4px solid ${theme.palette.primary.main}` : 'none',
                                                            pl: isCurrent ? 1.5 : 2,
                                                            '&:hover': { bgcolor: isCurrent ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.08) },
                                                        }}
                                                    >
                                                        {/* Lesson Status Icon */}
                                                        <Box sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            bgcolor: isCurrent ? 'transparent' : (isCompleted ? alpha(theme.palette.success.main, 0.2) : theme.palette.action.hover),
                                                            color: isCurrent ? theme.palette.primary.main : (isCompleted ? theme.palette.success.main : theme.palette.text.disabled),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            mr: 1.5,
                                                            flexShrink: 0,
                                                        }}>
                                                            {isCurrent ? (
                                                                <PlayIcon sx={{ fontSize: 18 }} />
                                                            ) : isCompleted ? (
                                                                <CheckIcon sx={{ fontSize: 12 }} />
                                                            ) : (
                                                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '10px' }}>{lesson.order}</Typography>
                                                            )}
                                                        </Box>

                                                        {/* Lesson Title */}
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: isCurrent ? 700 : 500, fontSize: '0.75rem', color: isCurrent ? theme.palette.primary.main : theme.palette.text.secondary }}>
                                                                {lesson.title}
                                                            </Typography>
                                                        </Box>

                                                        {/* Duration */}
                                                        <Typography variant="caption" sx={{ color: isCurrent ? alpha(theme.palette.primary.main, 0.7) : theme.palette.text.disabled, fontSize: '10px', ml: 1 }}>
                                                            {lesson.duration ? `${Math.floor(lesson.duration / 60)}:${String(lesson.duration % 60).padStart(2, '0')}` : '0:00'}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>

                    {/* ─── Sidebar Footer: Next / Previous ─── */}
                    <Box sx={{ p: 2, bgcolor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}`, mt: 'auto', boxShadow: `0 -10px 15px -3px ${alpha(theme.palette.common.black, 0.05)}` }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {nextLesson && (
                                <Button
                                    fullWidth
                                    onClick={() => handleLessonClick(nextLesson)}
                                    sx={{
                                        bgcolor: theme.palette.primary.main,
                                        color: theme.palette.primary.contrastText,
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                                        '&:hover': { bgcolor: theme.palette.primary.dark },
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1,
                                    }}
                                >
                                    Next Lesson
                                    <PlayIcon />
                                </Button>
                            )}
                            {prevLesson && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => handleLessonClick(prevLesson)}
                                    sx={{
                                        borderColor: theme.palette.divider,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        py: 1,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        bgcolor: theme.palette.background.paper,
                                        '&:hover': { bgcolor: theme.palette.action.hover, borderColor: theme.palette.divider },
                                    }}
                                >
                                    Previous: {prevLesson.title.length > 30 ? prevLesson.title.substring(0, 30) + '...' : prevLesson.title}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ─── Snackbar ─── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog
                open={remarksDialogOpen}
                onClose={() => setRemarksDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Instructor Remarks</DialogTitle>
                <DialogContent sx={{ pt: 1.5 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}`, mb: 2 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Status</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: assignmentSubmission?.status === 'reviewed' ? theme.palette.success.main : assignmentSubmission?.status === 'resubmit_required' ? theme.palette.error.main : theme.palette.warning.main }}>
                            {(assignmentSubmission?.status || 'submitted').replace('_', ' ')}
                        </Typography>
                        {typeof assignmentScore === 'number' && (
                            <>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.6, display: 'block' }}>Score</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                                    {assignmentScore}/100
                                </Typography>
                            </>
                        )}
                    </Box>

                    <Paper sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', whiteSpace: 'pre-wrap' }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.75, color: theme.palette.text.primary }}>
                            {assignmentRemarks || 'No remarks available.'}
                        </Typography>
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setRemarksDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
