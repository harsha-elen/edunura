'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    IconButton,
} from '@mui/material';
import {
    PlayCircleOutlined as PlayCircleOutlinedIcon,
    DescriptionOutlined as DescriptionOutlinedIcon,
    Quiz as QuizIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    VideocamOutlined as VideocamOutlinedIcon,
    Close as CloseIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import VideoLessonUpload from '@/components/teacher/lessons/VideoLessonUpload';
import TextMediaLessonUpload from '@/components/teacher/lessons/TextMediaLessonUpload';
import LiveClassLessonUpload from '@/components/teacher/lessons/LiveClassLessonUpload';
import QuizLessonUpload from '@/components/shared/QuizLessonUpload';
import { getQuizQuestionsForTeacher } from '@/services/courseService';

interface AddLessonModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (lessonData: {
        title: string;
        type: 'video' | 'document' | 'text' | 'quiz' | 'live' | 'assignment';
        meta: string;
        description?: string;
        videoType?: 'upload' | 'url';
        videoUrl?: string;
        videoFile?: File;
        duration?: string;
        allowPreview?: boolean;
        resourceFiles?: File[];
        resourcesToDelete?: number[];
        quizQuestions?: Array<{
            id?: number;
            question_text: string;
            question_type: 'multiple_choice' | 'true_false' | 'short_answer';
            options?: string[];
            correct_answer: string;
            explanation?: string;
            order: number;
        }>;
    }) => void;
    uploadProgress?: number;
    uploadError?: string;
    initialData?: {
        id?: number;
        title: string;
        type: string;
        description?: string;
        videoType?: string;
        videoUrl?: string;
        videoPath?: string;
        duration?: string;
        allowPreview?: boolean;
        resources?: any[];
        start_time?: string;
    } | null;
    courseId?: number;
    sectionId?: number | null;
}

const LESSON_TYPES = [
    {
        id: 'video' as const,
        icon: PlayCircleOutlinedIcon,
        title: 'Video Lesson',
        description: 'Upload or embed video content from YouTube, Vimeo, or local files.',
        bgColor: '#dbeafe',
        iconColor: '#2b8cee',
    },
    {
        id: 'text' as const,
        icon: DescriptionOutlinedIcon,
        title: 'Text & Media',
        description: 'Create rich text lessons with images, formatting, and embedded components.',
        bgColor: '#d1fae5',
        iconColor: '#10b981',
    },
    {
        id: 'quiz' as const,
        icon: QuizIcon,
        title: 'Quiz & Assessment',
        description: 'Test student knowledge with multiple-choice, true/false, or open-ended questions.',
        bgColor: '#F3EEFE',
        iconColor: '#8B5CF6',
    },
    {
        id: 'assignment' as const,
        icon: AssignmentTurnedInIcon,
        title: 'Assignment',
        description: 'Create assignment briefs and collect student PDF submissions.',
        bgColor: '#fff6d8',
        iconColor: '#b45309',
    },
    {
        id: 'live' as const,
        icon: VideocamOutlinedIcon,
        title: 'Live Session',
        description: 'Schedule a real-time webinar or virtual classroom via Zoom or MS Teams.',
        bgColor: '#fee2e2',
        iconColor: '#dc2626',
    },
];

type Phase = 'type-selector' | 'video' | 'text' | 'quiz' | 'live' | 'assignment';

const AddLessonModal: React.FC<AddLessonModalProps> = ({
    open,
    onClose,
    onAdd,
    uploadProgress,
    uploadError,
    initialData,
    courseId,
    sectionId,
}) => {
    const isEditMode = !!initialData;
    const [phase, setPhase] = useState<Phase>('type-selector');
    const [quizInitialQuestions, setQuizInitialQuestions] = useState<any[]>([]);

    // When modal opens, set initial phase based on mode
    useEffect(() => {
        if (open) {
            if (isEditMode && initialData) {
                const t = initialData.type;
                if (t === 'video' || t === 'text' || t === 'live') {
                    setPhase(t as Phase);
                } else if (t === 'assignment') {
                    setPhase('assignment');
                } else if (t === 'quiz' || t === 'document') {
                    setPhase('quiz');
                } else {
                    setPhase('type-selector');
                }
            } else {
                setPhase('type-selector');
            }
        }
    }, [open, isEditMode, initialData]);

    useEffect(() => {
        const loadQuizQuestions = async () => {
            if (!open || !isEditMode || !initialData || initialData.type !== 'quiz' || !initialData.id || !courseId) {
                setQuizInitialQuestions([]);
                return;
            }

            try {
                const response = await getQuizQuestionsForTeacher(courseId, initialData.id);
                setQuizInitialQuestions(response?.data || []);
            } catch {
                setQuizInitialQuestions([]);
            }
        };

        void loadQuizQuestions();
    }, [open, isEditMode, initialData, courseId]);

    const handleTypeSelect = (typeId: 'video' | 'document' | 'text' | 'quiz' | 'live' | 'assignment') => {
        if (typeId === 'quiz' || typeId === 'document') {
            setPhase('quiz');
        } else if (typeId === 'assignment') {
            setPhase('assignment');
        } else {
            setPhase(typeId as Phase);
        }
    };

    const goBackToSelector = () => setPhase('type-selector');

    // ── Video save bridge ───────────────────────────────────────────────────
    const handleVideoSave = (data: {
        title: string; description: string; videoType: 'upload' | 'url'; videoUrl?: string;
        videoFile?: File; duration?: string; allowPreview: boolean;
        resources: any[]; resourceFiles: File[]; resourcesToDelete: number[];
    }) => {
        onAdd({
            title: data.title,
            type: 'video',
            meta: data.description || '',
            description: data.description,
            videoType: data.videoType,
            videoUrl: data.videoUrl,
            videoFile: data.videoFile,
            duration: data.duration,
            allowPreview: data.allowPreview,
            resourceFiles: data.resourceFiles,
            resourcesToDelete: data.resourcesToDelete,
        });
    };

    // ── Text save bridge ────────────────────────────────────────────────────
    const handleTextSave = (data: {
        title: string; description: string; allowPreview: boolean;
        resources: any[]; resourceFiles: File[]; resourcesToDelete: number[];
    }, lessonType: 'text' | 'assignment' = 'text') => {
        onAdd({
            title: data.title,
            type: lessonType,
            meta: 'text',
            description: data.description,
            allowPreview: data.allowPreview,
            resourceFiles: data.resourceFiles,
            resourcesToDelete: data.resourcesToDelete,
        });
    };

    // ── Quiz save bridge ─────────────────────────────────────────────────────
    const handleQuizSave = (data: {
        title: string;
        questions: Array<{
            id?: number;
            question_text: string;
            question_type: 'multiple_choice' | 'true_false' | 'short_answer';
            options?: string[];
            correct_answer: string;
            explanation?: string;
            order: number;
        }>;
    }) => {
        onAdd({
            title: data.title,
            type: 'quiz',
            meta: JSON.stringify({
                questions: data.questions,
            }),
            quizQuestions: data.questions,
        });
    };

    // ── Live success ─────────────────────────────────────────────────────────
    const handleLiveSuccess = () => {
        onClose(); // CurriculumSection's onClose calls loadSections()
    };

    // ── Build initialData for sub-modals ─────────────────────────────────────
    const videoInitialData = isEditMode && initialData && (initialData.type === 'video' || initialData.type === 'document') ? {
        title: initialData.title,
        description: initialData.description || '',
        videoType: (initialData.videoType || 'url') as 'upload' | 'url',
        videoUrl: initialData.videoUrl,
        videoPath: initialData.videoPath,
        duration: initialData.duration,
        allowPreview: initialData.allowPreview || false,
        resources: initialData.resources || [],
    } : undefined;

    const textInitialData = isEditMode && initialData && initialData.type === 'text' ? {
        lessonId: initialData.id,
        title: initialData.title,
        description: initialData.description || '',
        allowPreview: initialData.allowPreview || false,
        resources: initialData.resources || [],
    } : undefined;

    const liveInitialData = isEditMode && initialData && initialData.type === 'live' ? {
        id: initialData.id!,
        title: initialData.title,
        content_body: initialData.description || '',
        start_time: initialData.start_time,
        resources: initialData.resources || [],
    } : undefined;

    // ── Sub-modals rendered directly (no nested open state needed) ───────────
    if (open && phase === 'video') {
        return (
            <VideoLessonUpload
                open={true}
                onClose={onClose}
                onBack={isEditMode ? undefined : goBackToSelector}
                onSave={handleVideoSave}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
                initialData={videoInitialData}
            />
        );
    }

    if (open && phase === 'text') {
        return (
            <TextMediaLessonUpload
                open={true}
                onClose={onClose}
                onBack={isEditMode ? onClose : goBackToSelector}
                onSave={handleTextSave}
                initialData={textInitialData}
            />
        );
    }

    if (open && phase === 'live') {
        return (
            <LiveClassLessonUpload
                open={true}
                courseId={courseId || 0}
                sectionId={sectionId}
                onSuccess={handleLiveSuccess}
                onCancel={onClose}
                onBack={isEditMode ? undefined : goBackToSelector}
                initialData={liveInitialData}
            />
        );
    }

    if (open && phase === 'quiz') {
        return (
            <QuizLessonUpload
                open={true}
                onClose={onClose}
                onBack={isEditMode ? undefined : goBackToSelector}
                onSave={handleQuizSave}
                initialData={{
                    title: initialData?.title || '',
                    questions: quizInitialQuestions,
                }}
            />
        );
    }

    if (open && phase === 'assignment') {
        const assignmentInitialData = isEditMode && initialData && initialData.type === 'assignment' ? {
            lessonId: initialData.id,
            title: initialData.title,
            description: initialData.description || '',
            allowPreview: initialData.allowPreview || false,
            resources: initialData.resources || [],
        } : undefined;

        return (
            <TextMediaLessonUpload
                open={true}
                onClose={onClose}
                onBack={isEditMode ? onClose : goBackToSelector}
                onSave={(data) => handleTextSave(data, 'assignment')}
                lessonKind="assignment"
                initialData={assignmentInitialData}
            />
        );
    }

    // ── Main dialog: type selector or quiz form ───────────────────────────────
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '0.75rem',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    border: '1px solid #e2e8f0',
                },
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', px: 3, py: 2.5, borderBottom: '1px solid #e2e8f0' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
                        Add New Lesson
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block', fontSize: '0.875rem' }}>
                        Select the type of content you want to create.
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#475569', bgcolor: 'rgba(226,232,240,0.5)' } }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* Content */}
            <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {LESSON_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <Paper
                                key={type.id}
                                onClick={() => handleTypeSelect(type.id)}
                                elevation={0}
                                sx={{
                                    display: 'flex', alignItems: 'flex-start', gap: 2, p: 2,
                                    borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid transparent',
                                    transition: 'all 0.15s ease-in-out', bgcolor: '#ffffff',
                                    '&:hover': { bgcolor: type.bgColor, borderColor: type.iconColor + '40' },
                                }}
                            >
                                <Box sx={{ flexShrink: 0, width: 48, height: 48, borderRadius: '0.5rem', bgcolor: type.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: type.iconColor }}>
                                    <Icon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9375rem' }}>
                                            {type.title}
                                        </Typography>
                                        <ChevronRightIcon sx={{ color: '#cbd5e1', fontSize: 20, ml: 2, flexShrink: 0 }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block', fontSize: '0.8125rem', lineHeight: 1.4 }}>
                                        {type.description}
                                    </Typography>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', color: '#64748b', px: 2, py: 0.75, '&:hover': { bgcolor: '#e2e8f0' } }}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddLessonModal;

