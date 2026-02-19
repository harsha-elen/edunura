import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
    Box,
    Typography,
    IconButton,
    Button,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    Grid,
    CircularProgress,
    Snackbar,
    Alert,
    Breadcrumbs,
    Link,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    ArrowBack as ArrowBackIcon,
    PlayArrow as PlayIcon,
    Check as CheckIcon,
    Lock as LockIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    BookmarkBorder as BookmarkIcon,
    Share as ShareIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    Description as DocumentIcon,
    InsertDriveFile as FileIcon,
    VideoLibrary as VideoFileIcon,
    Videocam as VideoCallIcon,
} from '@mui/icons-material';
import courseService, { Course, CourseSection, Lesson, CourseProgress } from '../services/courseService';
import VideoPlayer from '../components/VideoPlayer';

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
    
    // Handle string format like "1.5 MB" or "500 KB"
    if (typeof size === 'string') {
        // Check if already has a unit
        if (size.includes('MB') || size.includes('KB') || size.includes('GB') || size.includes('B')) {
            return size;
        }
        // Otherwise try to parse as number
        const numSize = parseFloat(size);
        if (isNaN(numSize)) return size;
        if (numSize < 1024) return `${numSize} B`;
        if (numSize < 1024 * 1024) return `${(numSize / 1024).toFixed(2)} KB`;
        return `${(numSize / 1024 / 1024).toFixed(2)} MB`;
    }
    
    // Handle number (assume bytes)
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const getFileIconColor = (fileType: string | undefined) => {
    if (!fileType) return '#64748b';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '#ef4444';
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('webp')) return '#22c55e';
    if (type.includes('doc') || type.includes('docx') || type.includes('word') || type.includes('text')) return '#3b82f6';
    if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) return '#8b5cf6';
    return '#64748b';
};

const getFileBgColor = (fileType: string | undefined) => {
    if (!fileType) return '#f1f5f9';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '#fef2f2';
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('webp')) return '#f0fdf4';
    if (type.includes('doc') || type.includes('docx') || type.includes('word') || type.includes('text')) return '#eff6ff';
    if (type.includes('video') || type.includes('mp4') || type.includes('mov') || type.includes('avi')) return '#f5f3ff';
    return '#f1f5f9';
};

const CoursePlayer: React.FC = () => {
    const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [progress, setProgress] = useState<CourseProgress | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedModules, setExpandedModules] = useState<number[]>([]);
    const [completingLesson, setCompletingLesson] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const courseIdNum = courseId ? parseInt(courseId) : 0;

    useEffect(() => {
        if (courseId) {
            fetchCourseData();
        }
    }, [courseId]);

    useEffect(() => {
        if (course && lessonId) {
            const lesson = findLessonById(parseInt(lessonId));
            if (lesson) {
                setCurrentLesson(lesson);
            }
        } else if (course && course.sections.length > 0) {
            const firstLesson = course.sections[0].lessons[0];
            if (firstLesson) {
                setCurrentLesson(firstLesson);
                navigate(`/course/${courseId}/player/${firstLesson.id}`, { replace: true });
            }
        }
    }, [course, lessonId]);

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
                courseService.getCourseWithCurriculum(courseIdNum),
                courseService.getCourseProgress(courseIdNum),
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
        } catch (error: any) {
            console.error('Error loading course:', error);
            setError(error.response?.data?.message || 'Failed to load course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLessonClick = (lesson: Lesson) => {
        setCurrentLesson(lesson);
        navigate(`/course/${courseId}/player/${lesson.id}`);
    };

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
                await courseService.markLessonIncomplete(courseIdNum, currentLesson.id);
            } else {
                await courseService.markLessonComplete(courseIdNum, currentLesson.id);
            }

            const newProgress = await courseService.getCourseProgress(courseIdNum);
            if (newProgress.status === 'success' && newProgress.data) {
                setProgress(newProgress.data);
            }

            setSnackbar({
                open: true,
                message: isCompleted ? 'Lesson marked as incomplete' : 'Lesson marked as complete!',
                severity: 'success',
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to update progress',
                severity: 'error',
            });
        } finally {
            setCompletingLesson(null);
        }
    };

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

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                bgcolor: 'background.default',
                flexDirection: 'column',
                gap: 2
            }}>
                <CircularProgress sx={{ color: 'primary.main' }} />
                <Typography color="text.secondary">Loading course...</Typography>
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
                bgcolor: 'background.default',
                flexDirection: 'column',
                gap: 2,
                p: 3
            }}>
                <Typography variant="h6" color="error">{error}</Typography>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/my-courses')}
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
                bgcolor: 'background.default',
                flexDirection: 'column',
                gap: 2
            }}>
                <Typography color="text.secondary">Course not found</Typography>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/my-courses')}
                >
                    Back to My Courses
                </Button>
            </Box>
        );
    }

    const nextLesson = getNextLesson();
    const prevLesson = getPrevLesson();
    const isCurrentCompleted = currentLesson ? isLessonCompleted(currentLesson.id) : false;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', fontFamily: '"Lexend", sans-serif' }}>
            {/* Header */}
            <Box
                component="header"
                sx={{
                    height: 64,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
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
                        onClick={() => navigate('/my-courses')}
                        color="inherit"
                        underline="none"
                        sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    >
                        <ArrowBackIcon sx={{ fontSize: 24 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, ml: 1, display: { xs: 'none', md: 'block' } }}>
                            Back to Dashboard
                        </Typography>
                    </Link>
                    <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', display: { xs: 'none', md: 'block' } }} />
                    <Breadcrumbs separator="/" aria-label="breadcrumb">
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>My Courses</Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500, fontSize: '12px' }}>
                            {course.title}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.05em', fontSize: '10px' }}>
                            Overall Progress
                        </Typography>
                        <Box sx={{ width: 128, height: 6, bgcolor: 'action.hover', borderRadius: 3, mt: 0.5, overflow: 'hidden' }}>
                            <Box sx={{ width: `${progress?.progress_percentage || 0}%`, height: '100%', bgcolor: 'primary.main' }} />
                        </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', display: { xs: 'none', sm: 'block' } }}>
                        {progress?.progress_percentage || 0}%
                    </Typography>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flexGrow: 1 }}>
                {/* Left Column: Video & Content */}
                <Box sx={{ width: { xs: '100%', lg: '75%' }, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', minWidth: 0 }}>
                    {/* Video Player / Zoom Meeting */}
                    <Box sx={{ width: '100%', aspectRatio: currentLesson?.content_type === 'live' ? 'auto' : '16/9', minHeight: currentLesson?.content_type === 'live' ? 500 : 0, bgcolor: 'black', position: 'relative', overflow: 'hidden' }}>
                        {currentLesson?.content_type === 'live' ? (
                            currentLesson?.zoom_join_url ? (
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    minHeight: 500, 
                                    bgcolor: '#1a1a1a',
                                    p: 4
                                }}>
                                    <VideoCallIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 2 }} />
                                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
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
                                            '&:hover': { bgcolor: theme.palette.primary.dark }
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
                                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                                        <PlayIcon sx={{ fontSize: 80, opacity: 0.5 }} />
                                        <Typography variant="h6" sx={{ mt: 2 }}>Live class starting soon...</Typography>
                                    </Box>
                                </Box>
                            )
                        ) : currentLesson?.file_path ? (
                            <VideoPlayer
                                src={courseService.getVideoUrl(currentLesson.file_path) || ''}
                                title={currentLesson.title}
                                autoPlay={false}
                            />
                        ) : (
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1e293b' }}>
                                <Box sx={{ textAlign: 'center', color: 'white' }}>
                                    <PlayIcon sx={{ fontSize: 80, opacity: 0.5 }} />
                                    <Typography variant="h6" sx={{ mt: 2 }}>No video available</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* Lesson Details */}
                    <Box sx={{ px: 3, py: 4, flexGrow: 1, overflowY: 'auto' }}>
                        <Box sx={{ maxWidth: '1024px', mx: 'auto' }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', lg: '1.875rem' } }}>
                                        {currentLesson?.title || 'Select a lesson'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <Box component="span" sx={{ mx: 1 }}>•</Box>
                                        {currentLesson?.duration ? `${Math.floor(currentLesson.duration / 60)}:${String(currentLesson.duration % 60).padStart(2, '0')}` : '0:00'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<BookmarkIcon />}
                                        sx={{
                                            color: 'text.secondary',
                                            borderColor: 'divider',
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' },
                                        }}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ShareIcon />}
                                        sx={{
                                            color: 'text.secondary',
                                            borderColor: 'divider',
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' },
                                        }}
                                    >
                                        Share
                                    </Button>
                                </Box>
                            </Box>

                            {/* Mark Complete Button */}
                            {currentLesson && (
                                <Box sx={{ mb: 4 }}>
                                    <Button
                                        variant={isCurrentCompleted ? "outlined" : "contained"}
                                        onClick={handleMarkComplete}
                                        disabled={completingLesson === currentLesson.id}
                                        startIcon={isCurrentCompleted ? <CheckIcon /> : <PlayIcon />}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            ...(isCurrentCompleted ? {
                                                borderColor: 'success.main',
                                                color: 'success.main',
                                                '&:hover': { borderColor: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.1) },
                                            } : {
                                                bgcolor: 'primary.main',
                                                '&:hover': { bgcolor: 'primary.dark' },
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

                            {/* Tabs */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, overflowX: 'auto' }}>
                                <Box sx={{ display: 'flex', gap: 4 }}>
                                    {['Overview', 'Resources', 'Discussion'].map((tab, index) => (
                                        <Button
                                            key={tab}
                                            onClick={() => setActiveTab(index)}
                                            sx={{
                                                pb: 2,
                                                px: 1,
                                                minWidth: 0,
                                                borderRadius: 0,
                                                borderBottom: 2,
                                                borderColor: activeTab === index ? 'primary.main' : 'transparent',
                                                color: activeTab === index ? 'primary.main' : 'text.secondary',
                                                fontWeight: activeTab === index ? 600 : 500,
                                                fontSize: '14px',
                                                textTransform: 'none',
                                                '&:hover': { color: activeTab === index ? 'primary.main' : 'text.primary' },
                                            }}
                                        >
                                            {tab}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>

                            {/* Tab Content */}
                            {activeTab === 0 && (
                                <Grid container spacing={6}>
                                    <Grid item xs={12} xl={8}>
                                        <Box sx={{ fontSize: '1.125rem', lineHeight: 1.75, color: 'text.secondary' }}>
                                            <div 
                                                dangerouslySetInnerHTML={{ 
                                                    __html: DOMPurify.sanitize(currentLesson?.content_body || 'No content available for this lesson.') 
                                                }} 
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}

                            {activeTab === 1 && (
                                <Grid container spacing={6}>
                                    <Grid item xs={12} xl={8}>
                                        <Box sx={{ bgcolor: 'action.hover', p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                    Lesson Resources
                                                </Typography>
                                                {currentLesson?.resources && currentLesson.resources.length > 1 && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<DownloadIcon />}
                                                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                                                        onClick={() => {
                                                            currentLesson?.resources?.forEach((resource) => {
                                                                const link = document.createElement('a');
                                                                link.href = courseService.getResourceUrl(resource.file_path);
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
                                                        <Grid item xs={12} sm={6} key={resource.id}>
                                                            <Box
                                                                component="a"
                                                                href={courseService.getResourceUrl(resource.file_path)}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    p: 2,
                                                                    bgcolor: 'background.paper',
                                                                    borderRadius: 2,
                                                                    border: 1,
                                                                    borderColor: 'action.hover',
                                                                    textDecoration: 'none',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    height: '100%',
                                                                    '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) },
                                                                }}
                                                            >
                                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                                    <Box sx={{ 
                                                                        width: 40, 
                                                                        height: 40, 
                                                                        bgcolor: getFileBgColor(resource.file_type), 
                                                                        color: getFileIconColor(resource.file_type), 
                                                                        borderRadius: 1, 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        justifyContent: 'center', 
                                                                        mr: 2,
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {getFileIcon(resource.file_type)}
                                                                    </Box>
                                                                    <Box sx={{ minWidth: 0 }}>
                                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {resource.title}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                            {formatFileSize(resource.file_size)}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled', ml: 1, flexShrink: 0 }}>
                                                                    <DownloadIcon />
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    No resources available for this lesson.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}

                            {activeTab === 2 && (
                                <Box sx={{ py: 4 }}>
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                        Discussion feature coming soon.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Right Column: Sidebar */}
                <Box
                    component="aside"
                    sx={{
                        width: { xs: '100%', lg: '25%' },
                        borderLeft: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        height: { lg: 'calc(100vh - 64px)' },
                        position: { lg: 'sticky' },
                        top: { lg: 64 },
                    }}
                >
                    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>Course Content</Typography>
                            <Typography variant="caption" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 1, py: 0.5, borderRadius: 9999, fontWeight: 700, fontSize: '10px' }}>
                                {progress?.progress_percentage || 0}% DONE
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ width: `${progress?.progress_percentage || 0}%`, height: '100%', bgcolor: 'primary.main' }} />
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '10px' } }}>
                        {course.sections.map((section) => {
                            const isExpanded = expandedModules.includes(section.id);
                            return (
                                <Box key={section.id} sx={{ borderBottom: 1, borderColor: 'action.hover' }}>
                                    <Button
                                        fullWidth
                                        onClick={() => toggleModule(section.id)}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            bgcolor: isExpanded ? alpha(theme.palette.primary.main, 0.05) : 'action.hover',
                                            color: isExpanded ? 'primary.main' : 'text.primary',
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
                                                            bgcolor: isCurrent ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                                                            borderLeft: isCurrent ? `4px solid ${theme.palette.primary.main}` : 'none',
                                                            pl: isCurrent ? 1.5 : 2,
                                            '&:hover': { bgcolor: isCurrent ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.08) },
                                                        }}
                                                    >
                                                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: isCurrent ? 'transparent' : (isCompleted ? alpha(theme.palette.success.main, 0.2) : 'action.hover'), color: isCurrent ? 'primary.main' : (isCompleted ? 'success.main' : 'text.disabled'), display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
                                                            {isCurrent ? (
                                                                <PlayIcon sx={{ fontSize: 18 }} />
                                                            ) : isCompleted ? (
                                                                <CheckIcon sx={{ fontSize: 12 }} />
                                                            ) : (
                                                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '10px' }}>{lesson.order}</Typography>
                                                            )}
                                                        </Box>

                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: isCurrent ? 700 : 500, fontSize: '0.75rem', color: isCurrent ? 'primary.main' : 'text.secondary' }}>
                                                                {lesson.title}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: isCurrent ? alpha(theme.palette.primary.main, 0.7) : 'text.disabled', fontSize: '10px', ml: 1 }}>
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

                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', mt: 'auto', boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {nextLesson && (
                                <Button
                                    fullWidth
                                    onClick={() => handleLessonClick(nextLesson)}
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        boxShadow: alpha(theme.palette.primary.main, 0.3),
                                        '&:hover': { bgcolor: 'primary.dark' },
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
                                        borderColor: 'divider',
                                        color: 'text.secondary',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        py: 1,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' },
                                    }}
                                >
                                    Previous: {prevLesson.title.length > 30 ? prevLesson.title.substring(0, 30) + '...' : prevLesson.title}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Snackbar */}
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
        </Box>
    );
};

export default CoursePlayer;
