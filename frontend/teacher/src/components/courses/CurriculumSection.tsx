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
    zoom_meeting_id?: string;
    zoom_join_url?: string;
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
}

const CurriculumSection: React.FC<CurriculumSectionProps> = ({ courseId }) => {
    const theme = useTheme();
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });
    const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
    const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
    const [editModuleDialog, setEditModuleDialog] = useState<{ open: boolean, moduleId: number | null, currentTitle: string }>({
        open: false,
        moduleId: null,
        currentTitle: ''
    });
    const [editModuleTitle, setEditModuleTitle] = useState('');
    const [deleteModuleDialog, setDeleteModuleDialog] = useState<{ open: boolean, moduleId: number | null }>({
        open: false,
        moduleId: null
    });
    const [deleteLessonDialog, setDeleteLessonDialog] = useState<{ open: boolean, lessonId: number | null, moduleId: number | null }>({
        open: false,
        lessonId: null,
        moduleId: null
    });

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
        if (courseId) {
            loadSections();
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
                sectionsData.map(async (section, index) => {
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
                            zoom_meeting_id: lesson.zoom_meeting_id,
                            zoom_join_url: lesson.zoom_join_url,
                        }));

                        return {
                            id: section.id,
                            title: section.title,
                            moduleNumber: `Module ${String(index + 1).padStart(2, '0')}`,
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
                            moduleNumber: `Module ${String(index + 1).padStart(2, '0')}`,
                            expanded: true,
                            lessons: [],
                            order: section.order,
                            is_published: section.is_published,
                        };
                    }
                })
            );

            // Sort modules by order
            modulesWithLessons.sort((a, b) => a.order - b.order);

            // Sort lessons within modules by order
            modulesWithLessons.forEach(mod => {
                mod.lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            });

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

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
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
            const response = await courseService.createSection(courseId, {
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

    const handleOpenEditLesson = (moduleId: number, lesson: Lesson) => {
        setSelectedModuleId(moduleId);
        setEditingLesson(lesson);
        setIsAddLessonOpen(true);
    };

    const handleDeleteModule = async () => {
        if (!deleteModuleDialog.moduleId) return;

        try {
            await courseService.deleteSection(deleteModuleDialog.moduleId);

            // After deletion, reorder the remaining modules to close the gap in the DB
            const remainingModules = modulesRef.current.filter(m => m.id !== deleteModuleDialog.moduleId);
            const reorderData = remainingModules.map((mod, index) => ({
                id: mod.id,
                order: index + 1,
            }));

            if (reorderData.length > 0) {
                await courseService.reorderSections(courseId, reorderData);
            }

            showSnackbar('Module deleted successfully', 'success');
            loadSections();
            setDeleteModuleDialog({ open: false, moduleId: null });
        } catch (err: any) {
            console.error('Error deleting module:', err);
            showSnackbar(err.response?.data?.message || 'Failed to delete module', 'error');
        }
    };

    const handleDeleteLesson = async () => {
        if (!deleteLessonDialog.lessonId || !deleteLessonDialog.moduleId) return;

        try {
            await courseService.deleteLesson(deleteLessonDialog.lessonId);

            // After deletion, reorder the remaining lessons in that module in the DB
            const currentLessons = lessonsRef.current[deleteLessonDialog.moduleId] || [];
            const remainingLessons = currentLessons.filter(l => l.id !== deleteLessonDialog.lessonId);
            const reorderData = remainingLessons.map((l, index) => ({
                id: l.id,
                order: index + 1,
            }));

            if (reorderData.length > 0) {
                await courseService.reorderLessons(deleteLessonDialog.moduleId, reorderData);
            }

            showSnackbar('Lesson deleted successfully', 'success');
            loadSections();
            setDeleteLessonDialog({ open: false, lessonId: null, moduleId: null });
        } catch (err: any) {
            console.error('Error deleting lesson:', err);
            showSnackbar(err.response?.data?.message || 'Failed to delete lesson', 'error');
        }
    };

    const handleSaveLesson = async (lessonData: {
        title: string;
        type: 'video' | 'document' | 'text' | 'quiz' | 'live';
        meta: string;
        description?: string;
        videoType?: 'upload' | 'url';
        videoUrl?: string;
        videoFile?: File;
        duration?: string;
        allowPreview?: boolean;
        resourceFiles?: File[];
        resourcesToDelete?: number[];
    }) => {
        if (!selectedModuleId) return;

        try {
            // Create or update lesson via API
            const lessonPayload: any = {
                title: lessonData.title,
                content_type: lessonData.type,
                duration: lessonData.duration ? parseInt(lessonData.duration) : undefined,
                is_free_preview: lessonData.allowPreview || false,
                is_published: false,
            };

            if (lessonData.type === 'video' && lessonData.videoUrl) {
                lessonPayload.file_path = lessonData.videoUrl;
            } else if (lessonData.type === 'text') {
                lessonPayload.content_body = lessonData.description || '';
            }

            let lessonId: number;

            if (editingLesson) {
                await courseService.updateLesson(editingLesson.id, lessonPayload);
                lessonId = editingLesson.id;

                // Handle deletions of resources if needed (simplified for now as resourcesToDelete is passed)
                if (lessonData.resourcesToDelete && lessonData.resourcesToDelete.length > 0) {
                    for (const resourceId of lessonData.resourcesToDelete) {
                        try {
                            await courseService.deleteLessonResource(resourceId);
                        } catch (err) {
                            console.error(`Failed to delete resource ${resourceId}`, err);
                        }
                    }
                }
            } else {
                const response = await courseService.createLesson(selectedModuleId, lessonPayload);
                lessonId = response.data.id;
            }

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

            setUploadProgress(prev => {
                const newProg = { ...prev };
                delete newProg[lessonId];
                return newProg;
            });

            showSnackbar(editingLesson ? 'Lesson updated successfully' : 'Lesson created successfully', 'success');
            loadSections();
            setIsAddLessonOpen(false);
            setSelectedModuleId(null);
            setEditingLesson(null);
        } catch (err: any) {
            console.error('Error saving lesson:', err);
            showSnackbar(err.response?.data?.message || 'Failed to save lesson', 'error');
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

    // Mocks
    const handleAddModuleMock = () => {
        setIsAddModuleOpen(true);
    };

    const handleAddLessonMock = (moduleId: number) => {
        setSelectedModuleId(moduleId);
        setIsAddLessonOpen(true);
    };

    const handleEditModule = (module: Module) => {
        setEditModuleDialog({
            open: true,
            moduleId: module.id,
            currentTitle: module.title
        });
        setEditModuleTitle(module.title);
    };

    const handleDeleteModuleClick = (moduleId: number) => {
        setDeleteModuleDialog({ open: true, moduleId });
    };

    const handleDeleteLessonClick = (moduleId: number, lessonId: number) => {
        setDeleteLessonDialog({ open: true, lessonId, moduleId });
    };


    return (
        <Box sx={{ width: '100%', py: 1 }}>
            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && !loading && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Content */}
            {!loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                        mb: 1.5
                                    }}
                                >
                                    {/* Module Header */}
                                    <Box sx={{
                                        p: 2,
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditModule(module);
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' } }}
                                                onClick={() => handleDeleteModuleClick(module.id)}
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
                                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {module.lessons.length > 0 && (
                                                <ReactSortable
                                                    list={module.lessons}
                                                    setList={(reorderedLessons) => handleLessonsReorder(module.id, reorderedLessons)}
                                                    animation={150}
                                                    handle=".drag-handle"
                                                    onEnd={() => saveLessonsOrder(module.id)}
                                                >
                                                    {module.lessons.map((lesson, index) => (
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
                                                                        {String(index + 1).padStart(2, '0')}. {lesson.title}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                                                        {lesson.meta}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
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
                                                                    onClick={() => handleOpenEditLesson(module.id, lesson)}
                                                                >
                                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
                                                                    onClick={() => handleDeleteLessonClick(module.id, lesson.id)}
                                                                >
                                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </ReactSortable>
                                            )}

                                            {/* Add Lesson Button - Mocked */}
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<AddCircleIcon />}
                                                onClick={() => handleAddLessonMock(module.id)}
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
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                                No Modules Yet
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                Click "Add Module" to start building your curriculum.
                            </Typography>
                        </Box>
                    )}

                    {/* Add New Module Button - Always visible */}
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddBoxIcon />}
                        onClick={handleAddModuleMock}
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
                            mb: 4
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
                    setSelectedModuleId(null);
                    setEditingLesson(null);
                    loadSections();
                }}
                onAdd={handleSaveLesson}
                courseId={courseId}
                sectionId={selectedModuleId}
                uploadProgress={Object.values(uploadProgress)[0]} // Simplification for now
                initialData={editingLesson ? {
                    id: editingLesson.id,
                    title: editingLesson.title,
                    type: editingLesson.type,
                    description: editingLesson.content_body || '',
                    videoType: editingLesson.type === 'video' ? (editingLesson.file_path?.startsWith('http') ? 'url' : 'upload') : 'upload',
                    videoUrl: editingLesson.type === 'video' ? (editingLesson.file_path?.startsWith('http') ? editingLesson.file_path : '') : '',
                    videoPath: editingLesson.type === 'video' ? (!editingLesson.file_path?.startsWith('http') ? editingLesson.file_path : '') : '',
                    duration: editingLesson.duration?.toString() || '',
                    allowPreview: editingLesson.is_free_preview || false,
                    resources: (editingLesson.resources || []).map((r: any) => ({
                        id: r.id,
                        name: r.title,
                        size: r.file_size,
                        type: r.file_type
                    })),
                    start_time: editingLesson.start_time,
                } : null}
            />

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
