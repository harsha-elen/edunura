import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    IconButton,
    Collapse,
    CircularProgress,
    Alert,
    Snackbar,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import {
    DragIndicator as DragIndicatorIcon,
    DragHandle as DragHandleIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    PlayCircleOutlined as PlayCircleIcon,
    DescriptionOutlined as DescriptionIcon,
    Quiz as QuizIcon,
    VideocamOutlined as VideocamIcon,
    AddCircle as AddCircleIcon,
    AddBox as AddBoxIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ReactSortable } from 'react-sortablejs';
import AddModuleModal from './AddModuleModal';
import AddLessonModal from './AddLessonModal';
import { courseService, Section, Lesson as APILesson, LessonResource } from '../../services/courseService';



interface Lesson {
    id: number;
    title: string;
    type: 'video' | 'document' | 'text' | 'quiz' | 'live';
    meta: string; // Used for display (e.g. "Video • 10 min")
    duration?: number;
    content_type: string;
    content_body?: string;
    is_free_preview?: boolean;
    file_path?: string;
    resources?: LessonResource[];
    start_time?: string;
    zoom_join_url?: string;
    zoom_meeting_id?: string;
}


interface Module {
    id: number;
    title: string;
    moduleNumber: string;
    expanded: boolean;
    lessons: Lesson[];
    order: number;
    is_published: boolean;
}

interface CurriculumSectionProps {
    courseId: number;
    onCourseIdChange?: (courseId: number) => void;
}

const CurriculumSection: React.FC<CurriculumSectionProps> = ({ courseId, onCourseIdChange }) => {
    const theme = useTheme();
    const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
    const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [uploadProgress, setUploadProgress] = useState<{ [lessonId: number]: number }>({});

    // Dialog states
    const [deleteModuleDialog, setDeleteModuleDialog] = useState<{ open: boolean; moduleId: number | null }>({ open: false, moduleId: null });
    const [deleteLessonDialog, setDeleteLessonDialog] = useState<{ open: boolean; lessonId: number | null; moduleId: number | null }>({ open: false, lessonId: null, moduleId: null });
    const [editModuleDialog, setEditModuleDialog] = useState<{ open: boolean; moduleId: number | null; currentTitle: string }>({ open: false, moduleId: null, currentTitle: '' });
    const [editModuleTitle, setEditModuleTitle] = useState('');

    // Use refs to store the latest state for drag-and-drop operations
    const modulesRef = useRef<Module[]>(modules);
    const lessonsRef = useRef<{ [moduleId: number]: Lesson[] }>({});

    // Keep refs in sync with state
    useEffect(() => {
        modulesRef.current = modules;
        const lessonsMap: { [moduleId: number]: Lesson[] } = {};
        modules.forEach(mod => {
            lessonsMap[mod.id] = mod.lessons;
        });
        lessonsRef.current = lessonsMap;
    }, [modules]);

    // Load sections from API
    useEffect(() => {
        if (courseId && courseId > 0) {
            loadSections();
        } else {
            setLoading(false);
        }
    }, [courseId]);

    const loadSections = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await courseService.getSections(courseId);

            // Transform API data to component format
            const sectionsData: Section[] = response.data || [];

            // Load lessons for each section
            const modulesWithLessons = await Promise.all(
                sectionsData.map(async (section) => {
                    try {
                        const lessonsResponse = await courseService.getLessons(section.id);
                        const lessonsData: APILesson[] = lessonsResponse.data || [];

                        // Transform lessons to component format
                        const transformedLessons: Lesson[] = lessonsData.map((lesson: any) => ({
                            id: lesson.id,
                            title: lesson.title,
                            type: lesson.content_type,
                            content_type: lesson.content_type,
                            meta: generateLessonMeta(lesson),
                            duration: lesson.duration,
                            content_body: lesson.content_body,
                            is_free_preview: lesson.is_free_preview,
                            file_path: lesson.file_path,
                            resources: lesson.resources || [],
                            start_time: lesson.start_time,
                            zoom_join_url: lesson.zoom_join_url,
                            zoom_meeting_id: lesson.zoom_meeting_id,
                        }));

                        return {
                            id: section.id,
                            title: section.title,
                            moduleNumber: `Module ${String(section.order).padStart(2, '0')}`,
                            expanded: true,
                            lessons: transformedLessons,
                            order: section.order,
                            is_published: section.is_published,
                        };
                    } catch (err) {
                        console.error(`Error loading lessons for section ${section.id}:`, err);
                        // Return section without lessons if lesson loading fails
                        return {
                            id: section.id,
                            title: section.title,
                            moduleNumber: `Module ${String(section.order).padStart(2, '0')}`,
                            expanded: true,
                            lessons: [],
                            order: section.order,
                            is_published: section.is_published,
                        };
                    }
                })
            );

            setModules(modulesWithLessons);
        } catch (err: any) {
            console.error('Error loading sections:', err);
            setError(err.response?.data?.message || 'Failed to load sections');
            showSnackbar('Failed to load sections', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to generate lesson meta text
    const generateLessonMeta = (lesson: APILesson): string => {
        const typeLabel = lesson.content_type.charAt(0).toUpperCase() + lesson.content_type.slice(1);

        // Handle live lessons specially to show start time
        if (lesson.content_type === 'live') {
            const startTime = lesson.start_time ? new Date(lesson.start_time) : null;
            const dateStr = startTime ? startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            const timeStr = startTime ? startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
            const durationStr = lesson.duration ? `${lesson.duration} min` : '';
            if (startTime) {
                return `${typeLabel} • ${dateStr} • ${timeStr}${durationStr ? ` • ${durationStr}` : ''}`;
            }
            return `${typeLabel} • ${durationStr || 'Live Session'}`;
        }

        if (lesson.duration) {
            return `${typeLabel} • ${lesson.duration} min`;
        }
        switch (lesson.content_type) {
            case 'video':
                return `${typeLabel} • Video Lesson`;
            case 'document':
                return `${typeLabel} • Document`;
            case 'text':
                return `${typeLabel} • Reading Material`;
            case 'quiz':
                return `${typeLabel} • Assessment`;
            default:
                return typeLabel;
        }
    };

    // Helper function to check if a live lesson is completed (meeting time has passed)
    const isLessonCompleted = (lesson: Lesson): boolean => {
        if (lesson.type !== 'live' || !lesson.start_time) {
            return false;
        }
        const meetingTime = new Date(lesson.start_time).getTime();
        const now = new Date().getTime();
        return now > meetingTime;
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const toggleModule = (id: number) => {
        setModules(modules.map(mod =>
            mod.id === id ? { ...mod, expanded: !mod.expanded } : mod
        ));
    };

    const handleAddModule = async (moduleData: {
        title: string;
        description: string;
        sequenceNumber: number;
    }) => {
        try {
            let currentCourseId = courseId;
            
            // If no courseId, create a draft course first
            if (!currentCourseId && onCourseIdChange) {
                try {
                    const draftCourse = await courseService.createCourse({
                        title: 'Untitled Course',
                        description: 'Draft course',
                        short_description: '',
                        category: '',
                        level: 'beginner',
                        status: 'draft',
                        outcomes: [],
                        prerequisites: [],
                        price: 0,
                        is_free: true,
                        validity_period: null,
                        instructors: [],
                        enable_discussion_forum: true,
                        show_course_rating: false,
                        enable_certificate: true,
                        visibility: 'draft',
                        meta_title: '',
                        meta_description: '',
                    });
                    currentCourseId = draftCourse.data.id;
                    onCourseIdChange(currentCourseId);
                } catch (err) {
                    console.error('Error creating draft course:', err);
                    showSnackbar('Failed to create course', 'error');
                    return;
                }
            }

            const response = await courseService.createSection(currentCourseId, {
                title: moduleData.title,
                order: moduleData.sequenceNumber,
                is_published: false,
            });

            // Add new module to state
            const newSection: Section = response.data;
            const newModule: Module = {
                id: newSection.id,
                title: newSection.title,
                moduleNumber: `Module ${String(newSection.order).padStart(2, '0')}`,
                expanded: true,
                lessons: [],
                order: newSection.order,
                is_published: newSection.is_published,
            };

            setModules([...modules, newModule]);
            showSnackbar('Module created successfully', 'success');
        } catch (err: any) {
            console.error('Error creating module:', err);
            showSnackbar(err.response?.data?.message || 'Failed to create module', 'error');
        }
    };

    const handleModulesReorder = (reorderedModules: Module[]) => {
        // Update module numbers based on new order locally for immediate UI feedback
        const updatedModules = reorderedModules.map((mod, index) => ({
            ...mod,
            moduleNumber: `Module ${String(index + 1).padStart(2, '0')}`,
            order: index + 1,
        }));
        setModules(updatedModules);
        // Update ref immediately so saveModulesOrder has the latest data
        modulesRef.current = updatedModules;
    };

    const saveModulesOrder = async () => {
        // Send reorder request to API after drag ends
        try {
            // Use ref to get the most up-to-date order
            const reorderData = modulesRef.current.map((mod, index) => ({
                id: mod.id,
                order: index + 1,
            }));

            await courseService.reorderSections(courseId, reorderData);
            showSnackbar('Modules reordered successfully', 'success');
        } catch (err: any) {
            console.error('Error reordering modules:', err);
            showSnackbar(err.response?.data?.message || 'Failed to reorder modules', 'error');
            // Reload sections on error to restore correct order
            loadSections();
        }
    };

    const handleDeleteModule = async () => {
        if (!deleteModuleDialog.moduleId) return;

        try {
            await courseService.deleteSection(deleteModuleDialog.moduleId);
            setModules(modules.filter(mod => mod.id !== deleteModuleDialog.moduleId));
            showSnackbar('Module deleted successfully', 'success');
        } catch (err: any) {
            console.error('Error deleting module:', err);
            showSnackbar(err.response?.data?.message || 'Failed to delete module', 'error');
        } finally {
            setDeleteModuleDialog({ open: false, moduleId: null });
        }
    };

    const handleUpdateModule = async () => {
        if (!editModuleDialog.moduleId || !editModuleTitle.trim()) return;

        try {
            await courseService.updateSection(editModuleDialog.moduleId, { title: editModuleTitle.trim() });
            setModules(modules.map(mod =>
                mod.id === editModuleDialog.moduleId ? { ...mod, title: editModuleTitle.trim() } : mod
            ));
            showSnackbar('Module updated successfully', 'success');
        } catch (err: any) {
            console.error('Error updating module:', err);
            showSnackbar(err.response?.data?.message || 'Failed to update module', 'error');
        } finally {
            setEditModuleDialog({ open: false, moduleId: null, currentTitle: '' });
            setEditModuleTitle('');
        }
    };

    const handleLessonsReorder = (moduleId: number, reorderedLessons: Lesson[]) => {
        // Update UI immediately for better UX
        const updatedModules = modules.map(mod =>
            mod.id === moduleId ? { ...mod, lessons: reorderedLessons } : mod
        );
        setModules(updatedModules);
        // Update ref immediately
        lessonsRef.current[moduleId] = reorderedLessons;
    };

    const saveLessonsOrder = async (moduleId: number) => {
        // Send reorder request to API after drag ends
        try {
            // Use ref to get the most up-to-date order
            const lessons = lessonsRef.current[moduleId];
            if (!lessons) return;

            const reorderData = lessons.map((lesson, index) => ({
                id: lesson.id,
                order: index + 1,
            }));

            await courseService.reorderLessons(moduleId, reorderData);
            showSnackbar('Lessons reordered successfully', 'success');
        } catch (err: any) {
            console.error('Error reordering lessons:', err);
            showSnackbar(err.response?.data?.message || 'Failed to reorder lessons', 'error');
            // Reload sections on error to restore correct order
            loadSections();
        }
    };

    const handleAddLesson = async (lessonData: {
        title: string;
        type: 'video' | 'document' | 'text' | 'quiz' | 'live';
        meta: string;
        videoFile?: File;
        resourceFiles?: File[];
    }): Promise<number | undefined> => {
        if (!selectedModuleId) return;

        try {
            // Parse metadata if present
            let metadata: any = {};
            try {
                if (lessonData.meta) {
                    metadata = JSON.parse(lessonData.meta);
                }
            } catch (e) {
                console.error('Error parsing lesson meta:', e);
            }

            // Create lesson via API with full metadata
            // For video type: store external URL in file_path, not content_body
            // For text/document type: store content in content_body
            const lessonPayload: any = {
                title: lessonData.title,
                content_type: lessonData.type,
                duration: metadata.duration ? parseInt(metadata.duration) : undefined,
                is_free_preview: metadata.allowPreview || false,
                is_published: false,
            };

            // Store video URL in file_path for video lessons
            if (lessonData.type === 'video' && metadata.videoUrl) {
                lessonPayload.file_path = metadata.videoUrl;
            } else if (lessonData.type === 'text' || lessonData.type === 'document') {
                // Store text/document content in content_body
                lessonPayload.content_body = metadata.description || '';
            }

            const response = await courseService.createLesson(selectedModuleId, lessonPayload);

            const newLesson: APILesson = response.data;
            const lessonId = newLesson.id;

            // Handle video upload if present
            if (lessonData.type === 'video' && lessonData.videoFile) {
                try {
                    const uploadResult = await courseService.uploadLessonVideo(
                        lessonId,
                        lessonData.videoFile,
                        (progress) => {
                            setUploadProgress(prev => ({
                                ...prev,
                                [lessonId]: progress
                            }));
                        }
                    );

                    // Store the uploaded video file path
                    if (uploadResult.data?.file_path) {
                        await courseService.updateLesson(lessonId, {
                            file_path: uploadResult.data.file_path
                        });
                    }
                } catch (err: any) {
                    console.error('Error uploading video:', err);
                    showSnackbar('Video upload failed', 'error');
                }
            }

            // Handle resource uploads
            if (lessonData.resourceFiles && lessonData.resourceFiles.length > 0) {
                try {
                    for (const file of lessonData.resourceFiles) {
                        await courseService.uploadLessonResource(lessonId, file);
                    }
                } catch (err: any) {
                    console.error('Error uploading resources:', err);
                    showSnackbar('Resource upload failed', 'error');
                }
            }

            // Clear progress
            setUploadProgress(prev => {
                const newProg = { ...prev };
                delete newProg[lessonId];
                return newProg;
            });

            showSnackbar('Lesson created successfully', 'success');
            loadSections(); // Reload to get full data including resources
            setSelectedModuleId(null);
            return lessonId;

        } catch (err: any) {
            console.error('Error creating lesson:', err);
            showSnackbar(err.response?.data?.message || 'Failed to create lesson', 'error');
            return undefined;
        }
    };

    const handleSaveLesson = async (lessonData: {
        title: string;
        type: 'video' | 'document' | 'text' | 'quiz' | 'live';
        meta: string;
        videoFile?: File;
        resourceFiles?: File[];
        resourcesToDelete?: number[];
    }): Promise<number | undefined> => {
        if (editingLesson) {
            // Update existing lesson
            try {
                // Parse metadata
                let metadata: any = {};
                try {
                    metadata = JSON.parse(lessonData.meta);
                } catch (e) {
                    // If parsing fails, construct basic metadata
                    metadata = {
                        videoUrl: lessonData.type === 'video' ? lessonData.meta : undefined,
                        description: (lessonData.type === 'document' || lessonData.type === 'text') ? lessonData.meta : undefined,
                        duration: undefined,
                        allowPreview: false,
                    };
                }

                // For video type: store external URL in file_path, not content_body
                // For text/document type: store content in content_body
                const updatePayload: any = {
                    title: lessonData.title,
                    content_type: lessonData.type,
                    duration: metadata.duration ? parseInt(metadata.duration) : undefined,
                    is_free_preview: metadata.allowPreview || false,
                };

                // Store video URL in file_path for video lessons
                if (lessonData.type === 'video' && metadata.videoUrl) {
                    updatePayload.file_path = metadata.videoUrl;
                } else if (lessonData.type === 'text' || lessonData.type === 'document') {
                    // Store text/document content in content_body
                    updatePayload.content_body = metadata.description || '';
                }

                await courseService.updateLesson(editingLesson.id, updatePayload);

                // Handle deletions first
                if (lessonData.resourcesToDelete && lessonData.resourcesToDelete.length > 0) {
                    for (const resourceId of lessonData.resourcesToDelete) {
                        try {
                            await courseService.deleteLessonResource(resourceId);
                        } catch (err) {
                            console.error(`Failed to delete resource ${resourceId}`, err);
                        }
                    }
                }

                // Handle resource uploads
                if (lessonData.resourceFiles && lessonData.resourceFiles.length > 0) {
                    for (const file of lessonData.resourceFiles) {
                        try {
                            await courseService.uploadLessonResource(editingLesson.id, file);
                        } catch (err) {
                            console.error('Failed to upload resource', err);
                        }
                    }
                }

                // Handle video upload if new file provided
                if (lessonData.type === 'video' && lessonData.videoFile) {
                    try {
                        const uploadResult = await courseService.uploadLessonVideo(
                            editingLesson.id,
                            lessonData.videoFile,
                            (progress) => {
                                setUploadProgress(prev => ({
                                    ...prev,
                                    [editingLesson.id]: progress
                                }));
                            }
                        );

                        // Update lesson with new video path
                        if (uploadResult.data?.file_path) {
                            await courseService.updateLesson(editingLesson.id, {
                                file_path: uploadResult.data.file_path
                            });
                        }

                        setUploadProgress(prev => {
                            const newProg = { ...prev };
                            delete newProg[editingLesson.id];
                            return newProg;
                        });
                    } catch (err) {
                        setUploadProgress(prev => {
                            const newProg = { ...prev };
                            delete newProg[editingLesson.id];
                            return newProg;
                        });
                        showSnackbar('Video upload failed', 'error');
                    }
                }

                showSnackbar('Lesson updated successfully', 'success');
                loadSections(); // Reload to get updated data
                setEditingLesson(null);
                return editingLesson.id;
            } catch (err: any) {
                showSnackbar(err.response?.data?.message || 'Failed to update lesson', 'error');
                return undefined;
            }
        } else {
            return handleAddLesson(lessonData);
        }
    };

    const handleDeleteLesson = async () => {
        if (!deleteLessonDialog.lessonId || !deleteLessonDialog.moduleId) return;

        try {
            await courseService.deleteLesson(deleteLessonDialog.lessonId);

            // Update UI
            const updatedModules = modules.map(mod =>
                mod.id === deleteLessonDialog.moduleId
                    ? { ...mod, lessons: mod.lessons.filter(lesson => lesson.id !== deleteLessonDialog.lessonId) }
                    : mod
            );
            setModules(updatedModules);
            showSnackbar('Lesson deleted successfully', 'success');
        } catch (err: any) {
            console.error('Error deleting lesson:', err);
            showSnackbar(err.response?.data?.message || 'Failed to delete lesson', 'error');
        } finally {
            setDeleteLessonDialog({ open: false, lessonId: null, moduleId: null });
        }
    };

    const getIcon = (type: Lesson['type']) => {
        switch (type) {
            case 'video': return <PlayCircleIcon sx={{ color: '#2b8cee' }} />;
            case 'document': return <DescriptionIcon sx={{ color: '#10b981' }} />;
            case 'text': return <DescriptionIcon sx={{ color: '#10b981' }} />;
            case 'quiz': return <QuizIcon sx={{ color: '#8B5CF6' }} />;
            case 'live': return <VideocamIcon sx={{ color: '#dc2626' }} />;
        }
    };

    const getIconBg = (type: Lesson['type']) => {
        switch (type) {
            case 'video': return '#dbeafe';
            case 'document': return '#d1fae5';
            case 'text': return '#d1fae5';
            case 'quiz': return '#F3EEFE';
            case 'live': return '#fee2e2';
        }
    };

    return (
        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 4, px: 3 }}>
            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && !loading && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Content */}
            {!loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {modules.length > 0 ? (
                        <ReactSortable
                            list={modules}
                            setList={handleModulesReorder}
                            animation={150}
                            onEnd={saveModulesOrder}
                        >
                            {modules.map((module) => (
                                <Paper
                                    key={module.id}
                                    sx={{
                                        borderRadius: 3,
                                        border: '1px solid #e7edf3',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        mb: 2
                                    }}
                                >
                                    {/* Module Header */}
                                    <Box sx={{
                                        p: 2.5,
                                        borderBottom: module.expanded ? '1px solid #e7edf3' : 'none',
                                        bgcolor: 'rgba(248, 250, 252, 0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <DragIndicatorIcon sx={{ color: '#94a3b8', cursor: 'grab' }} />
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                    {module.moduleNumber}
                                                </Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                                    {module.title}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#64748b', border: '1px solid transparent', '&:hover': { border: '1px solid #e7edf3', bgcolor: '#ffffff' } }}
                                                onClick={() => {
                                                    setEditModuleDialog({ open: true, moduleId: module.id, currentTitle: module.title });
                                                    setEditModuleTitle(module.title);
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' } }}
                                                onClick={() => setDeleteModuleDialog({ open: true, moduleId: module.id })}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => toggleModule(module.id)} sx={{ color: '#64748b' }}>
                                                {module.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Lessons List */}
                                    <Collapse in={module.expanded}>
                                        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {module.lessons.length > 0 && (
                                                <ReactSortable
                                                    list={module.lessons}
                                                    setList={(reorderedLessons) => handleLessonsReorder(module.id, reorderedLessons)}
                                                    animation={150}
                                                    handle=".drag-handle"
                                                    onEnd={() => saveLessonsOrder(module.id)}
                                                >
                                                    {module.lessons.map((lesson) => (
                                                        <Box
                                                            key={lesson.id}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                p: 1.5,
                                                                border: '1px solid #e7edf3',
                                                                borderRadius: 2,
                                                                bgcolor: '#ffffff',
                                                                mb: 0.75,
                                                                opacity: isLessonCompleted(lesson) ? 0.5 : 1,
                                                                filter: isLessonCompleted(lesson) ? 'grayscale(100%)' : 'none',
                                                                pointerEvents: isLessonCompleted(lesson) ? 'none' : 'auto',
                                                                transition: 'all 0.2s ease-in-out',
                                                                '&:hover': {
                                                                    '& .lesson-actions': { opacity: 1 }
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <DragHandleIcon className="drag-handle" sx={{ color: 'rgba(148, 163, 184, 0.5)', fontSize: 18, cursor: 'grab', '&:active': { cursor: 'grabbing' }, '&:hover': { color: '#94a3b8' } }} />
                                                                <Box sx={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    borderRadius: 1.5,
                                                                    bgcolor: getIconBg(lesson.type),
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    {getIcon(lesson.type)}
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d141b' }}>
                                                                        {lesson.title}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                                                        {lesson.meta}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            {uploadProgress[lesson.id] !== undefined ? (
                                                                <Box sx={{ width: '120px', mr: 2 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                                        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.625rem' }}>
                                                                            UPLOADING...
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.625rem' }}>
                                                                            {uploadProgress[lesson.id]}%
                                                                        </Typography>
                                                                    </Box>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={uploadProgress[lesson.id]}
                                                                        sx={{
                                                                            height: 4,
                                                                            borderRadius: 2,
                                                                            bgcolor: 'rgba(43, 140, 238, 0.1)',
                                                                            '& .MuiLinearProgress-bar': {
                                                                                borderRadius: 2,
                                                                            }
                                                                        }}
                                                                    />
                                                                </Box>
                                                            ) : (
                                                                <Box className="lesson-actions" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
                                                                    {lesson.type === 'live' && lesson.zoom_join_url && (
                                                                        <Button
                                                                            variant="outlined"
                                                                            size="small"
                                                                            startIcon={<VideocamIcon />}
                                                                            disabled={isLessonCompleted(lesson)}
                                                                            sx={{
                                                                                mr: 1,
                                                                                borderColor: 'rgba(220, 38, 38, 0.5)',
                                                                                color: '#dc2626',
                                                                                '&:hover': {
                                                                                    borderColor: '#dc2626',
                                                                                    bgcolor: 'rgba(220, 38, 38, 0.05)'
                                                                                }
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (lesson.zoom_meeting_id) {
                                                                                    window.open(`/meeting/${lesson.zoom_meeting_id}`, '_blank');
                                                                                } else {
                                                                                    window.open(lesson.zoom_join_url, '_blank');
                                                                                }
                                                                            }}
                                                                        >
                                                                            Start
                                                                        </Button>
                                                                    )}
                                                                    <IconButton
                                                                        size="small"
                                                                        disabled={isLessonCompleted(lesson)}
                                                                        sx={{ color: '#64748b', '&:hover': { color: theme.palette.primary.main }, '&:disabled': { color: '#cbd5e1', cursor: 'not-allowed' } }}
                                                                        onClick={() => {
                                                                            setEditingLesson(lesson);
                                                                            setIsAddLessonOpen(true);
                                                                        }}
                                                                    >
                                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
                                                                        onClick={() => setDeleteLessonDialog({ open: true, lessonId: lesson.id, moduleId: module.id })}
                                                                    >
                                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </ReactSortable>
                                            )}

                                            {/* Add Lesson Button */}
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<AddCircleIcon />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSelectedModuleId(module.id);
                                                    setIsAddLessonOpen(true);
                                                }}
                                                sx={{
                                                    mt: 1,
                                                    py: 1.5,
                                                    borderStyle: 'dashed',
                                                    borderWidth: 2,
                                                    color: '#64748b',
                                                    borderColor: '#e7edf3',
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        color: theme.palette.primary.main,
                                                        bgcolor: 'rgba(43, 140, 238, 0.05)',
                                                        borderStyle: 'dashed',
                                                    }
                                                }}
                                            >
                                                Add Lesson
                                            </Button>
                                        </Box>
                                    </Collapse>
                                </Paper>
                            ))}
                        </ReactSortable>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                                No modules yet. Add your first module to get started!
                            </Typography>
                        </Box>
                    )}

                    {/* Add New Module Button - Always visible */}
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddBoxIcon />}
                        onClick={() => setIsAddModuleOpen(true)}
                        sx={{
                            mt: 1,
                            py: 2,
                            borderRadius: 3,
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            color: theme.palette.primary.main,
                            borderColor: 'rgba(43, 140, 238, 0.3)',
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 700,
                            '&:hover': {
                                borderColor: theme.palette.primary.main,
                                bgcolor: 'rgba(43, 140, 238, 0.05)',
                                borderStyle: 'solid',
                            },
                            mb: 6
                        }}
                    >
                        Add New Module
                    </Button>
                </Box>
            )}

            {/* Add Module Modal */}
            <AddModuleModal
                open={isAddModuleOpen}
                onClose={() => setIsAddModuleOpen(false)}
                onAdd={handleAddModule}
                totalModules={modules.length}
            />

            {/* Add Lesson Modal */}
            <AddLessonModal
                open={isAddLessonOpen}
                onClose={() => {
                    setIsAddLessonOpen(false);
                    setEditingLesson(null);
                    loadSections(); // Reload sections to show newly created lessons
                }}
                onAdd={handleSaveLesson}
                uploadProgress={uploadProgress}
                courseId={courseId}
                sectionId={selectedModuleId}
                initialData={editingLesson ? {
                    id: editingLesson.id,
                    title: editingLesson.title,
                    type: editingLesson.type,
                    meta: editingLesson.content_body || '',
                    duration: editingLesson.duration,
                    is_free_preview: editingLesson.is_free_preview,
                    file_path: editingLesson.file_path,
                    resources: editingLesson.resources || [],
                    start_time: editingLesson.start_time,
                } : undefined}
            />

            {/* Delete Module Confirmation Dialog */}
            <Dialog
                open={deleteModuleDialog.open}
                onClose={() => setDeleteModuleDialog({ open: false, moduleId: null })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Delete Module?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Are you sure you want to delete this module? All lessons within this module will also be deleted. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteModuleDialog({ open: false, moduleId: null })}
                        sx={{ textTransform: 'none', color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteModule}
                        variant="contained"
                        color="error"
                        sx={{ textTransform: 'none' }}
                    >
                        Delete Module
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Lesson Confirmation Dialog */}
            <Dialog
                open={deleteLessonDialog.open}
                onClose={() => setDeleteLessonDialog({ open: false, lessonId: null, moduleId: null })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Delete Lesson?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Are you sure you want to delete this lesson? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteLessonDialog({ open: false, lessonId: null, moduleId: null })}
                        sx={{ textTransform: 'none', color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteLesson}
                        variant="contained"
                        color="error"
                        sx={{ textTransform: 'none' }}
                    >
                        Delete Lesson
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Module Title Dialog */}
            <Dialog
                open={editModuleDialog.open}
                onClose={() => {
                    setEditModuleDialog({ open: false, moduleId: null, currentTitle: '' });
                    setEditModuleTitle('');
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Edit Module Title</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Module Title"
                        value={editModuleTitle}
                        onChange={(e) => setEditModuleTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUpdateModule();
                            }
                        }}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setEditModuleDialog({ open: false, moduleId: null, currentTitle: '' });
                            setEditModuleTitle('');
                        }}
                        sx={{ textTransform: 'none', color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateModule}
                        variant="contained"
                        disabled={!editModuleTitle.trim()}
                        sx={{ textTransform: 'none' }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
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

export default CurriculumSection;
