import React, { useState } from 'react';
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
    VideocamOutlined as VideocamOutlinedIcon,
    Close as CloseIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import VideoLessonUpload from './VideoLessonUpload';
import TextMediaLessonUpload from './TextMediaLessonUpload';
import LiveClassLessonUpload from './LiveClassLessonUpload';
import SimpleLessonModal from './SimpleLessonModal';
import { LessonResource } from '../../services/courseService';

interface AddLessonModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (lessonData: {
        title: string;
        type: 'video' | 'document' | 'text' | 'quiz' | 'live';
        meta: string;
        videoFile?: File;
        resourceFiles?: File[];
        resourcesToDelete?: number[];
    }) => Promise<number | undefined>;
    uploadProgress: Record<number, number>;
    initialData?: {
        id: number;
        title: string;
        type: 'video' | 'document' | 'text' | 'quiz' | 'live';
        meta: string;
        duration?: number;
        is_free_preview?: boolean;
        file_path?: string;
        resources?: LessonResource[];
        start_time?: string;
    };
    courseId?: number; // Made optional with fallback
    sectionId?: number | null;
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({ open, onClose, onAdd, uploadProgress, initialData, courseId, sectionId }) => {
    const [isVideoUploadOpen, setIsVideoUploadOpen] = useState(false);
    const [isTextMediaUploadOpen, setIsTextMediaUploadOpen] = useState(false);
    const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
    const [isLiveClassUploadOpen, setIsLiveClassUploadOpen] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [showLessonTypeSelector, setShowLessonTypeSelector] = useState(true);
    const [activeLiveUploadId, setActiveLiveUploadId] = useState<number | null>(null);

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                // If editing, skip selector and go straight to the correct type
                setShowLessonTypeSelector(false);
                if (initialData.type === 'video') setIsVideoUploadOpen(true);
                else if (initialData.type === 'text') setIsTextMediaUploadOpen(true);
                else if (initialData.type === 'quiz') setIsQuizModalOpen(true); // Open Quiz modal for quiz type
                else if (initialData.type === 'live') setIsLiveClassUploadOpen(true); // Open Live Class modal for live type
            } else {
                // Reset all states when modal opens for creation
                setShowLessonTypeSelector(true);
                setIsVideoUploadOpen(false);
                setIsTextMediaUploadOpen(false);
                setIsSimpleModalOpen(false);
                setIsLiveClassUploadOpen(false); // Reset new state
                setIsQuizModalOpen(false); // Reset new state
            }
            setActiveLiveUploadId(null);
        }
    }, [open, initialData]);

    const lessonTypes = [
        {
            id: 'video',
            icon: PlayCircleOutlinedIcon,
            title: 'Video Lesson',
            description: 'Upload or embed video content from YouTube, Vimeo, or local files.',
            bgColor: '#dbeafe',
            iconColor: '#2b8cee',
        },
        {
            id: 'text',
            icon: DescriptionOutlinedIcon,
            title: 'Text & Media',
            description: 'Create rich text lessons with images, formatting, and embedded components.',
            bgColor: '#d1fae5',
            iconColor: '#10b981',
        },
        {
            id: 'quiz',
            icon: QuizIcon,
            title: 'Quiz & Assessment',
            description: 'Test student knowledge with multiple-choice, true/false, or open-ended questions.',
            bgColor: '#F3EEFE',
            iconColor: '#8B5CF6',
        },
        {
            id: 'live',
            icon: VideocamOutlinedIcon,
            title: 'Live Session',
            description: 'Schedule a real-time webinar or virtual classroom via Zoom or MS Teams.',
            bgColor: '#fee2e2',
            iconColor: '#dc2626',
        },
    ];

    const handleTypeSelect = (typeId: string) => {
        // If video lesson, open the video upload modal
        if (typeId === 'video') {
            setShowLessonTypeSelector(false);
            setIsVideoUploadOpen(true);
            return;
        }

        // If text & media lesson, open the text media upload modal
        if (typeId === 'text') {
            setShowLessonTypeSelector(false);
            setIsTextMediaUploadOpen(true);
            return;
        }

        // If quiz, open the QuizLessonModal
        if (typeId === 'quiz') {
            setShowLessonTypeSelector(false);
            setIsQuizModalOpen(true);
            return;
        }

        // If live, open the LiveClassLessonUpload modal
        if (typeId === 'live') {
            setShowLessonTypeSelector(false);
            setIsLiveClassUploadOpen(true);
            return;
        }

        // For other types, create lesson immediately (this part might become obsolete if all types have dedicated modals)
        const type = typeId as 'video' | 'document' | 'text' | 'quiz' | 'live';
        const typeLabel = lessonTypes.find(t => t.id === typeId)?.title || typeId;

        onAdd({
            title: typeLabel,
            type: type,
            meta: '',
        });

        handleClose();
    };

    const handleVideoLessonSave = async (lessonData: {
        title: string;
        description: string;
        videoType: 'upload' | 'url';
        videoUrl?: string;
        videoFile?: File;
        duration?: string;
        allowPreview: boolean;
        resources: Array<{ name: string; size: string; type: string }>;
        resourceFiles: File[];
        resourcesToDelete: number[];
    }) => {
        // Pass video lesson data to parent
        const createdId = await onAdd({
            title: lessonData.title,
            type: 'video',
            meta: JSON.stringify({
                description: lessonData.description,
                videoType: lessonData.videoType,
                videoUrl: lessonData.videoUrl,
                videoFileName: lessonData.videoFile?.name,
                duration: lessonData.duration,
                allowPreview: lessonData.allowPreview,
                resources: lessonData.resources,
            }),
            videoFile: lessonData.videoFile,
            resourceFiles: lessonData.resourceFiles,
            resourcesToDelete: lessonData.resourcesToDelete,
        });

        if (createdId && lessonData.videoType === 'upload' && lessonData.videoFile) {
            setActiveLiveUploadId(createdId);
            // Keep modal open to show upload progress
            // Modal will close when user clicks finish button after upload completes
        } else {
            setIsVideoUploadOpen(false);
            setShowLessonTypeSelector(true);
            onClose();
        }
    };

    const handleTextMediaLessonSave = (lessonData: {
        title: string;
        description: string;
        allowPreview: boolean;
        resources: Array<{ name: string; size: string; type: string }>;
        resourceFiles: File[];
        resourcesToDelete: number[];
    }) => {
        // Pass text media lesson data to parent
        onAdd({
            title: lessonData.title,
            type: 'text',
            meta: JSON.stringify({
                description: lessonData.description,
                allowPreview: lessonData.allowPreview,
                resources: lessonData.resources,
            }),
            resourceFiles: lessonData.resourceFiles,
            resourcesToDelete: lessonData.resourcesToDelete,
        });
        setIsTextMediaUploadOpen(false);
        setShowLessonTypeSelector(true);
        onClose();
    };

    const handleSimpleLessonSave = (lessonData: {
        title: string;
        type: 'quiz' | 'live';
        meta: string;
    }) => {
        onAdd({
            title: lessonData.title,
            type: lessonData.type,
            meta: lessonData.meta,
        });
        setIsSimpleModalOpen(false);
        setShowLessonTypeSelector(true);
        onClose();
    };

    const handleLessonCreated = () => {
        // This function will be called when a lesson is successfully created/saved from a sub-modal
        // Live lessons are already created by the backend API, so we don't call onAdd
        // Just trigger a reload by closing the modal
        setIsLiveClassUploadOpen(false); // Close Live Class modal
        setIsQuizModalOpen(false); // Close Quiz modal
        setShowLessonTypeSelector(true); // Go back to selector or close main modal
        onClose(); // Close the main AddLessonModal
    };

    const handleBackFromVideo = () => {
        setIsVideoUploadOpen(false);
        setShowLessonTypeSelector(true);
    };

    const handleBackFromTextMedia = () => {
        setIsTextMediaUploadOpen(false);
        setShowLessonTypeSelector(true);
    };

    const handleBackFromSimple = () => {
        setIsSimpleModalOpen(false);
        setShowLessonTypeSelector(true);
    };

    const handleBackFromQuiz = () => {
        setIsQuizModalOpen(false);
        setShowLessonTypeSelector(true);
    };

    const handleClose = () => {
        // Reset all states when closing
        setIsVideoUploadOpen(false);
        setIsTextMediaUploadOpen(false);
        setIsSimpleModalOpen(false);
        setIsLiveClassUploadOpen(false); // Reset new state
        setIsQuizModalOpen(false); // Reset new state
        setActiveLiveUploadId(null);
        setShowLessonTypeSelector(true);
        onClose();
    };

    return (
        <>
            <Dialog
                open={open && showLessonTypeSelector && !initialData}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '0.75rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0',
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 2.5,
                    borderBottom: '1px solid #e2e8f0',
                }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.125rem' }}>
                            Add New Lesson
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block', fontSize: '0.875rem' }}>
                            Select the type of content you want to create for this module.
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={handleClose}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#475569', bgcolor: 'rgba(226, 232, 240, 0.5)' } }}
                    >
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Box>

                {/* Lesson Types List */}
                <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#ffffff' }}>
                    {lessonTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                            <Paper
                                key={type.id}
                                onClick={() => handleTypeSelect(type.id)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 2,
                                    p: 2,
                                    m: 0,
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out',
                                    backgroundColor: '#ffffff',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        backgroundColor: type.bgColor,
                                    }
                                }}
                            >
                                {/* Icon Container */}
                                <Box
                                    sx={{
                                        flexShrink: 0,
                                        width: 48,
                                        height: 48,
                                        borderRadius: '0.5rem',
                                        backgroundColor: type.bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: type.iconColor,
                                    }}
                                >
                                    <Icon sx={{ fontSize: 24 }} />
                                </Box>

                                {/* Content */}
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
                </DialogContent>

                {/* Footer */}
                <DialogActions sx={{
                    px: 3,
                    py: 2,
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    gap: 1.5
                }}>
                    <Button
                        onClick={handleClose}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            color: '#64748b',
                            px: 1.5,
                            py: 0.75,
                            '&:hover': {
                                backgroundColor: '#e2e8f0',
                            }
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Live Class Upload */}
            {isLiveClassUploadOpen && courseId && (
                <LiveClassLessonUpload
                    courseId={String(courseId)}
                    sectionId={sectionId ? String(sectionId) : ''}
                    onSuccess={handleLessonCreated}
                    onCancel={handleClose}
                    initialData={initialData && initialData.type === 'live' ? {
                        id: initialData.id,
                        title: initialData.title,
                        duration: initialData.duration,
                        content_body: initialData.meta,
                        resources: initialData.resources,
                        start_time: initialData.start_time,
                    } : undefined}
                />
            )}

            {/* Placeholder for Quiz - To be implemented or linked */}
            {isQuizModalOpen && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography>Quiz Module Coming Soon</Typography>
                    <Button onClick={handleBackFromQuiz}>Back</Button>
                </Box>
            )}

            {/* Video Lesson Upload Modal */}
            <VideoLessonUpload
                open={isVideoUploadOpen}
                onClose={handleClose}
                onBack={initialData ? undefined : handleBackFromVideo}
                onSave={handleVideoLessonSave}
                uploadProgress={activeLiveUploadId ? uploadProgress[activeLiveUploadId] : undefined}
                initialData={initialData && initialData.type === 'video' ? (() => {
                    // Determine video type: file_path can contain either uploaded file path or external URL
                    const hasFilePath = !!initialData.file_path;
                    const isExternalUrl = hasFilePath && initialData.file_path && (initialData.file_path.startsWith('http://') || initialData.file_path.startsWith('https://'));
                    const isUploadedFile = hasFilePath && !isExternalUrl;

                    let parsedMeta: { allowPreview?: boolean; description?: string; videoUrl?: string } = {};
                    try {
                        parsedMeta = initialData.meta ? JSON.parse(initialData.meta) : {};
                    } catch {
                        parsedMeta = {};
                    }

                    const allowPreviewValue = initialData.is_free_preview ?? parsedMeta.allowPreview ?? false;
                    const resolvedVideoUrl = isExternalUrl ? (initialData.file_path || undefined) : (parsedMeta.videoUrl || undefined);

                    return {
                        title: initialData.title,
                        description: parsedMeta.description || '',
                        videoType: isExternalUrl ? 'url' : 'upload',
                        videoUrl: resolvedVideoUrl,
                        videoPath: isUploadedFile ? initialData.file_path : undefined,
                        duration: initialData.duration?.toString() || '',
                        allowPreview: allowPreviewValue,
                        resources: (initialData.resources || []).map(r => ({
                            id: r.id,
                            name: r.title,
                            size: r.file_size,
                            type: r.file_type,
                        })),
                    };
                })() : undefined}
            />

            {/* Text Media Lesson Upload Modal */}
            <TextMediaLessonUpload
                open={isTextMediaUploadOpen}
                onClose={() => {
                    setIsTextMediaUploadOpen(false);
                    setShowLessonTypeSelector(true);
                    onClose();
                }}
                onBack={handleBackFromTextMedia}
                onSave={handleTextMediaLessonSave}
                initialData={initialData && initialData.type === 'text' ? (() => {
                    const mappedResources = (initialData.resources || []).map(r => ({
                        id: r.id,
                        name: r.title,
                        size: r.file_size,
                        type: r.file_type,
                    }));

                    try {
                        const meta = JSON.parse(initialData.meta);
                        const isEditorJs = meta && Array.isArray(meta.blocks);
                        const resolvedDescription = isEditorJs ? initialData.meta : (meta.description || '');
                        const resolvedResources = (meta.resources && meta.resources.length > 0)
                            ? meta.resources
                            : mappedResources;

                        return {
                            lessonId: initialData.id,
                            title: initialData.title,
                            description: resolvedDescription,
                            allowPreview: meta.allowPreview || false,
                            resources: resolvedResources,
                        };
                    } catch (e) {
                        return {
                            lessonId: initialData.id,
                            title: initialData.title,
                            description: initialData.meta || '',
                            allowPreview: initialData.is_free_preview || false,
                            resources: mappedResources,
                        };
                    }
                })() : undefined}
            />

            {/* Simple Lesson Modal (Fallback) */}
            <SimpleLessonModal
                open={isSimpleModalOpen}
                onClose={() => {
                    setIsSimpleModalOpen(false);
                    setShowLessonTypeSelector(true);
                    onClose();
                }}
                onBack={handleBackFromSimple}
                type='quiz'
                onSave={handleSimpleLessonSave}
            />
        </>
    );
};

export default AddLessonModal;
