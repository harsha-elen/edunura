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
    VideocamOutlined as VideocamOutlinedIcon,
    Close as CloseIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import VideoLessonUpload from './VideoLessonUpload';
import TextMediaLessonUpload from './TextMediaLessonUpload';
import LiveClassLessonUpload from './LiveClassLessonUpload';

interface AddLessonModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (lessonData: {
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
    }) => void;
    uploadProgress?: number;
    uploadError?: string;
    initialData?: any; // For future edit support
    courseId?: number;
    sectionId?: number | null;
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({ open, onClose, onAdd, uploadProgress, uploadError, initialData, courseId, sectionId }) => {
    const [isVideoUploadOpen, setIsVideoUploadOpen] = useState(
        initialData?.type === 'video'
    );
    const [isTextMediaUploadOpen, setIsTextMediaUploadOpen] = useState(
        initialData?.type === 'text'
    );
    const [isLiveClassUploadOpen, setIsLiveClassUploadOpen] = useState(
        initialData?.type === 'live'
    );
    const [showLessonTypeSelector, setShowLessonTypeSelector] = useState(
        !initialData
    );

    // Reset state when open/initialData changes
    useEffect(() => {
        if (open) {
            if (initialData) {
                setShowLessonTypeSelector(false);
                setIsVideoUploadOpen(initialData.type === 'video');
                setIsTextMediaUploadOpen(initialData.type === 'text');
                setIsLiveClassUploadOpen(initialData.type === 'live');
            } else {
                setShowLessonTypeSelector(true);
                setIsVideoUploadOpen(false);
                setIsTextMediaUploadOpen(false);
                setIsLiveClassUploadOpen(false);
            }
        } else {
            // Reset all states when modal closes to prevent stale renders
            setShowLessonTypeSelector(true);
            setIsVideoUploadOpen(false);
            setIsTextMediaUploadOpen(false);
            setIsLiveClassUploadOpen(false);
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
        if (typeId === 'video') {
            setShowLessonTypeSelector(false);
            setIsVideoUploadOpen(true);
            return;
        }

        if (typeId === 'text') {
            setShowLessonTypeSelector(false);
            setIsTextMediaUploadOpen(true);
            return;
        }

        if (typeId === 'live') {
            setShowLessonTypeSelector(false);
            setIsLiveClassUploadOpen(true);
            return;
        }

        // For other types, still use the mock-like notification for now but pass type
        onAdd({
            title: 'New ' + (lessonTypes.find(t => t.id === typeId)?.title || typeId),
            type: typeId as any,
            meta: (lessonTypes.find(t => t.id === typeId)?.title || typeId)
        });
        onClose();
    };

    const handleVideoSave = (videoData: any) => {
        onAdd({
            ...videoData,
            type: 'video',
            meta: videoData.duration ? `Video • ${videoData.duration} min` : 'Video Lesson'
        });
    };

    const handleTextMediaSave = (textMediaData: any) => {
        onAdd({
            ...textMediaData,
            type: 'text',
            meta: 'Text & Media'
        });
    };

    if (isVideoUploadOpen) {
        return (
            <VideoLessonUpload
                open={open}
                onClose={onClose}
                onBack={() => {
                    setIsVideoUploadOpen(false);
                    setShowLessonTypeSelector(true);
                }}
                onSave={handleVideoSave}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
                initialData={initialData}
            />
        );
    }

    if (isTextMediaUploadOpen) {
        return (
            <TextMediaLessonUpload
                open={open}
                onClose={onClose}
                onBack={() => {
                    setIsTextMediaUploadOpen(false);
                    setShowLessonTypeSelector(true);
                }}
                onSave={handleTextMediaSave}
                initialData={initialData ? {
                    lessonId: initialData.id,
                    title: initialData.title,
                    description: initialData.description,
                    allowPreview: initialData.allowPreview,
                    resources: initialData.resources
                } : undefined}
            />
        );
    }
    if (isLiveClassUploadOpen) {
        if (!courseId) {
            console.error('AddLessonModal: courseId is missing for Live Class');
            // Fallback to avoid double modal, or show error
            return null;
        }
        return (
            <LiveClassLessonUpload
                courseId={String(courseId)}
                sectionId={sectionId ? String(sectionId) : undefined}
                onSuccess={() => {
                    setIsLiveClassUploadOpen(false);
                    onClose();
                }}
                onCancel={() => {
                    if (initialData) {
                        setIsLiveClassUploadOpen(false);
                        onClose();
                    } else {
                        setIsLiveClassUploadOpen(false);
                        setShowLessonTypeSelector(true);
                    }
                }}
                initialData={initialData && initialData.type === 'live' ? {
                    id: initialData.id,
                    title: initialData.title,
                    duration: initialData.duration ? Number(initialData.duration) : undefined,
                    content_body: initialData.description,
                    resources: initialData.resources,
                    start_time: initialData.start_time
                } : undefined}
            />
        );
    }

    return (
        <Dialog
            open={open && showLessonTypeSelector && !initialData}
            onClose={onClose}
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
                        {initialData ? 'Edit Lesson' : 'Add New Lesson'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block', fontSize: '0.875rem' }}>
                        {initialData ? 'Update the content and settings for this lesson.' : 'Select the type of content you want to create for this module.'}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={onClose}
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
                    onClick={onClose}
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
    );
};

export default AddLessonModal;
