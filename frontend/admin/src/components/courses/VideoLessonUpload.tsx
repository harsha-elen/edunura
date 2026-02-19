import React, { useState } from 'react';
import {
    Dialog,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
    Switch,
    InputAdornment,
    LinearProgress,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Close as CloseIcon,
    Movie as MovieEditIcon,
    Attachment as AttachmentIcon,
    Link as LinkIcon,
    UploadFile as UploadFileIcon,

    Description as DescriptionIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import VideoPlayer from '../VideoPlayer';
import { STATIC_ASSETS_BASE_URL } from '../../services/apiClient';

interface VideoLessonUploadProps {
    open: boolean;
    onClose: () => void;
    onBack?: () => void;
    onSave: (lessonData: {
        title: string;
        description: string;
        videoType: 'upload' | 'url';
        videoUrl?: string;
        videoFile?: File;
        duration?: string;
        allowPreview: boolean;
        resources: Array<{ name: string; size: string; type: string }>; // For display/metadata if needed
        resourceFiles: File[];
        resourcesToDelete: number[];
    }) => void;
    uploadProgress?: number;
    uploadError?: string;
    initialData?: {
        title: string;
        description: string;
        videoType: 'upload' | 'url';
        videoUrl?: string;
        videoPath?: string; // Path to uploaded video file
        duration?: string;
        allowPreview: boolean;
        resources: Array<{ id?: number; name: string; size: string; type: string }>;
    };
}

interface UploadedFile {
    id?: number;
    name: string;
    size: string;
    type: string;
}

const VideoLessonUpload: React.FC<VideoLessonUploadProps> = ({ open, onClose, onBack, onSave, uploadProgress, uploadError, initialData }) => {
    const theme = useTheme();
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoSourceType, setVideoSourceType] = useState<'upload' | 'url'>(initialData?.videoType || 'upload');
    const [duration, setDuration] = useState(initialData?.duration || '');
    const [allowPreview, setAllowPreview] = useState(initialData?.allowPreview || false);
    const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(initialData?.videoPath || null);
    const [previousVideoPath, setPreviousVideoPath] = useState<string | null>(null); // For undo on replace

    // Existing resources from DB
    const [existingResources, setExistingResources] = useState<UploadedFile[]>([]);
    // New files to upload
    const [resourceFiles, setResourceFiles] = useState<File[]>([]);
    // IDs of resources to delete
    const [resourcesToDelete, setResourcesToDelete] = useState<number[]>([]);

    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ title?: string; video?: string }>({});
    const [uploadCancelDialog, setUploadCancelDialog] = useState<{ open: boolean; action: 'close' | 'back' | null }>({ open: false, action: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'warning' | 'success' });

    const showSnackbar = (message: string, severity: 'error' | 'warning' | 'success' = 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    React.useEffect(() => {
        if (open && initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setVideoUrl(initialData.videoUrl || '');
            setVideoSourceType(initialData.videoType || 'upload');
            setDuration(initialData.duration || '');
            setAllowPreview(initialData.allowPreview || false);
            setUploadedVideoPath(initialData.videoPath || null);
            setPreviousVideoPath(null);
            if (initialData.resources) {
                // Map initial resources
                setExistingResources(initialData.resources as UploadedFile[]);
            } else {
                setExistingResources([]);
            }
            setResourceFiles([]);
            setResourcesToDelete([]);
            setVideoFile(null);
            setErrors({});
        } else if (open && !initialData) {
            // Reset if opening for creation
            setTitle('');
            setDescription('');
            setVideoUrl('');
            setVideoFile(null);
            setVideoSourceType('upload');
            setDuration('');
            setAllowPreview(false);
            setUploadedVideoPath(null);
            setPreviousVideoPath(null);
            setExistingResources([]);
            setResourceFiles([]);
            setResourcesToDelete([]);
            setErrors({});
        }
    }, [open, initialData]);

    const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            
            // Validate file size (500MB limit)
            const maxSize = 500 * 1024 * 1024; // 500MB in bytes
            if (file.size > maxSize) {
                setErrors({ ...errors, video: 'Video file must be under 500MB. Please compress or choose a smaller file.' });
                // Restore previous video if replacement was cancelled due to size
                if (previousVideoPath) {
                    setUploadedVideoPath(previousVideoPath);
                    setPreviousVideoPath(null);
                }
                return;
            }
            
            // Clear previous errors and previous path (committed to new file)
            setErrors({ ...errors, video: undefined });
            setPreviousVideoPath(null);
            setVideoFile(file);
        } else if (previousVideoPath) {
            // User cancelled file selection, restore previous video
            setUploadedVideoPath(previousVideoPath);
            setPreviousVideoPath(null);
        }
    };

    React.useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setVideoPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setVideoPreviewUrl(null);
        }
    }, [videoFile]);

    const handleResourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            
            // Validate file size (50MB limit for resources)
            const maxSize = 50 * 1024 * 1024; // 50MB in bytes
            if (file.size > maxSize) {
                showSnackbar('Resource file must be under 50MB. Please choose a smaller file.', 'error');
                event.target.value = '';
                return;
            }
            
            setResourceFiles([...resourceFiles, file]);
        }
        // Reset input
        event.target.value = '';
    };

    const handleRemoveByFile = (index: number) => {
        setResourceFiles(resourceFiles.filter((_, i) => i !== index));
    };

    const handleRemoveExisting = (index: number) => {
        const resource = existingResources[index];
        if (resource.id !== undefined) {
            setResourcesToDelete([...resourcesToDelete, resource.id]);
        } else {
            console.warn('Attempted to delete resource without ID:', resource);
        }
        setExistingResources(existingResources.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        const newErrors: { title?: string; video?: string } = {};

        if (!title.trim()) {
            newErrors.title = 'Lesson title is required';
        }

        // Validate video source
        if (videoSourceType === 'upload') {
            if (!videoFile && !uploadedVideoPath) {
                newErrors.video = 'Please select a video file to upload';
            }
        } else if (videoSourceType === 'url') {
            if (!videoUrl.trim()) {
                newErrors.video = 'Please enter a valid video URL';
            } else {
                // Enhanced URL validation for YouTube and Vimeo
                const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+$/;
                const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/;
                const genericUrlRegex = /^https?:\/\/.+$/;
                
                if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl) && !genericUrlRegex.test(videoUrl)) {
                    newErrors.video = 'Please enter a valid video URL (YouTube, Vimeo, or direct video link)';
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100) {
            // Prevent save while uploading
            return;
        }

        onSave({
            title: title.trim(),
            description: description.trim(),
            videoType: videoSourceType,
            videoUrl: videoSourceType === 'url' ? videoUrl.trim() : undefined,
            videoFile: videoSourceType === 'upload' ? (videoFile || undefined) : undefined,
            duration: duration.trim(),
            allowPreview,
            resources: existingResources, // Pass remaining existing resources for meta if needed
            resourceFiles,
            resourcesToDelete,
        });

        // Only close if not uploading
        if (uploadProgress === undefined || uploadProgress >= 100) {
            handleClose();
        }
    };

    const handleClose = () => {
        if (uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100) {
            setUploadCancelDialog({ open: true, action: 'close' });
            return;
        }
        performClose();
    };

    const performClose = () => {
        setTitle('');
        setErrors({});
        setDescription('');
        setVideoUrl('');
        setVideoFile(null);
        setVideoSourceType('upload');
        setDuration('');
        setAllowPreview(false);
        setPreviousVideoPath(null);
        onClose();
    };

    const handleBackClick = () => {
        if (uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100) {
            setUploadCancelDialog({ open: true, action: 'back' });
            return;
        }
        performBack();
    };

    const performBack = () => {
        setTitle('');
        setErrors({});
        setDescription('');
        setVideoUrl('');
        setVideoFile(null);
        setVideoSourceType('upload');
        setDuration('');
        setAllowPreview(false);
        setPreviousVideoPath(null);
        if (onBack) {
            onBack();
        } else {
            handleClose();
        }
    };

    const confirmCancelUpload = () => {
        if (uploadCancelDialog.action === 'close') {
            performClose();
        } else if (uploadCancelDialog.action === 'back') {
            performBack();
        }
        setUploadCancelDialog({ open: false, action: null });
    };

    return (
        <>
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: {
                    maxWidth: '1152px',
                    height: '90vh',
                    borderRadius: '1rem',
                    bgcolor: 'background.paper',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }
            }}
        >
            <style>
                {`
                    .ql-container * {
                        max-width: 100% !important;
                        word-wrap: break-word !important;
                        overflow-wrap: break-word !important;
                        box-sizing: border-box !important;
                    }
                    .ql-editor p,
                    .ql-editor h1,
                    .ql-editor h2,
                    .ql-editor h3,
                    .ql-editor ol,
                    .ql-editor ul,
                    .ql-editor pre,
                    .ql-editor blockquote {
                        max-width: 100% !important;
                        word-wrap: break-word !important;
                        overflow-wrap: break-word !important;
                    }
                `}
            </style>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 4,
                py: 2.5,
                borderBottom: '1px solid #e2e8f0',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton onClick={handleBackClick} sx={{ color: '#64748b', '&:hover': { color: theme.palette.text.primary, bgcolor: 'rgba(226, 232, 240, 0.5)' } }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '0.5rem',
                        bgcolor: 'rgba(43, 140, 238, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.primary.main,
                    }}>
                        <MovieEditIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#0d141b' }}>
                            Video Lesson
                        </Typography>
                        {uploadProgress !== undefined && !uploadError && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: uploadProgress < 100 ? theme.palette.primary.main : '#10b981', fontWeight: 700 }}>
                                    {uploadProgress < 100 ? `UPLOADING ${uploadProgress}%` : 'UPLOAD COMPLETE ✓'}
                                </Typography>
                                {uploadProgress < 100 && (
                                    <LinearProgress
                                        variant="determinate"
                                        value={uploadProgress}
                                        sx={{ width: 100, height: 6, borderRadius: 3 }}
                                    />
                                )}
                            </Box>
                        )}
                        {uploadError && (
                            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                                UPLOAD FAILED ✗
                            </Typography>
                        )}
                    </Box>
                </Box>
                <IconButton
                    onClick={handleClose}
                    disabled={uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100}
                    sx={{ color: '#64748b', '&:hover': { color: theme.palette.text.primary, bgcolor: 'rgba(226, 232, 240, 0.5)' } }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Main Content */}
            <Box sx={{
                flex: 1,
                overflow: 'auto',
                px: 4,
                py: 4,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                    background: '#e2e8f0',
                    borderRadius: '10px'
                },
            }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '6fr 4fr' },
                    gap: 5,
                    minWidth: 0,
                    width: '100%',
                }}>
                    {/* Left Column */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, overflow: 'hidden' }}>
                        {/* Lesson Title */}
                        <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1, color: theme.palette.text.primary }}>
                                Lesson Title
                            </Typography>
                            <TextField
                                fullWidth
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (errors.title) setErrors({});
                                }}
                                error={!!errors.title}
                                helperText={errors.title}
                                placeholder="e.g. Advanced Performance Optimization"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '0.5rem',
                                        '& fieldset': { borderColor: errors.title ? theme.palette.error.main : '#e2e8f0' },
                                    }
                                }}
                            />
                        </Box>

                        {/* Lesson Description */}
                        <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1, color: theme.palette.text.primary }}>
                                Lesson Description
                            </Typography>
                            <Box sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                overflow: 'visible',
                                resize: 'vertical',
                                minHeight: '160px',
                                maxHeight: '500px',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'ns-resize',
                                    background: 'linear-gradient(135deg, transparent 50%, #94a3b8 50%)',
                                    borderBottomRightRadius: '0.5rem',
                                    pointerEvents: 'none',
                                },
                                '& .ql-toolbar': {
                                    bgcolor: '#f8fafc',
                                    borderBottom: '1px solid #e2e8f0',
                                    border: 'none',
                                    padding: '8px 12px',
                                    flexShrink: 0,
                                },
                                '& .ql-container': {
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    bgcolor: '#ffffff',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'auto',
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '100%',
                                },
                                '& .ql-editor': {
                                    minHeight: '120px',
                                    padding: '12px 16px',
                                    color: theme.palette.text.primary,
                                    flex: 1,
                                    width: '100%',
                                    maxWidth: '100%',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    boxSizing: 'border-box',
                                    overflowX: 'hidden',
                                },
                                '& .ql-editor.ql-blank::before': {
                                    color: '#94a3b8',
                                    fontStyle: 'normal',
                                },
                                '& .ql-tooltip': {
                                    zIndex: 9999,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.375rem',
                                    bgcolor: '#ffffff',
                                    '&.ql-editing': {
                                        left: '50% !important',
                                        transform: 'translateX(-50%)',
                                        top: '8px !important',
                                    },
                                },
                                '& .ql-tooltip input': {
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.25rem',
                                    padding: '6px 8px',
                                    fontSize: '0.875rem',
                                },
                                '& .ql-tooltip a.ql-action::after': {
                                    borderRight: '1px solid #e2e8f0',
                                    marginLeft: '8px',
                                    paddingRight: '8px',
                                },
                                '& .ql-stroke': {
                                    stroke: '#64748b',
                                },
                                '& .ql-fill': {
                                    fill: '#64748b',
                                },
                                '& .ql-picker-label': {
                                    color: '#64748b',
                                },
                                '& button:hover .ql-stroke': {
                                    stroke: theme.palette.primary.main,
                                },
                                '& button:hover .ql-fill': {
                                    fill: theme.palette.primary.main,
                                },
                                '& button.ql-active .ql-stroke': {
                                    stroke: theme.palette.primary.main,
                                },
                                '& button.ql-active .ql-fill': {
                                    fill: theme.palette.primary.main,
                                },
                            }}>
                                <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Enter lesson details and expectations..."
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline'],
                                            [{ 'list': 'bullet' }],
                                            ['link'],
                                        ],
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1.5, color: theme.palette.text.primary }}>
                                Lesson Resources
                            </Typography>
                            <Box
                                onClick={() => document.getElementById('resource-file-input')?.click()}
                                sx={{
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: '0.75rem',
                                    p: 3,
                                    textAlign: 'center',
                                    bgcolor: '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                    }
                                }}
                            >
                                <input
                                    id="resource-file-input"
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={handleResourceFileChange}
                                />
                                <Box sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: '#ffffff',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 1.5,
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #f1f5f9',
                                }}>
                                    <AttachmentIcon sx={{ color: theme.palette.primary.main }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5, color: theme.palette.text.primary }}>
                                    Click to upload or drag and drop resources
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    PDF, ZIP, DOCX, or supporting slide decks (Max 50MB per file)
                                </Typography>
                            </Box>

                            {/* Uploaded Files - Existing */}
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {existingResources.map((file, index) => (
                                    <Box
                                        key={`existing-${index}`}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            bgcolor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <DescriptionIcon sx={{ color: '#3b82f6' }} />
                                            <Box>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary }}>
                                                    {file.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.625rem', color: '#64748b' }}>
                                                    {file.size} • Existing
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveExisting(index)}
                                            sx={{
                                                color: '#94a3b8',
                                                '&:hover': { color: '#ef4444' }
                                            }}
                                        >
                                            <CloseIcon sx={{ fontSize: '1.125rem' }} />
                                        </IconButton>
                                    </Box>
                                ))}

                                {/* Uploaded Files - New */}
                                {resourceFiles.map((file, index) => (
                                    <Box
                                        key={`new-${index}`}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            bgcolor: '#f0f9ff',
                                            border: '1px solid #bae6fd',
                                            borderRadius: '0.5rem',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <DescriptionIcon sx={{ color: '#3b82f6' }} />
                                            <Box>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary }}>
                                                    {file.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.625rem', color: '#64748b' }}>
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB • New
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveByFile(index)}
                                            sx={{
                                                color: '#94a3b8',
                                                '&:hover': { color: '#ef4444' }
                                            }}
                                        >
                                            <CloseIcon sx={{ fontSize: '1.125rem' }} />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {/* Right Column */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Video Content */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                                    Video Content
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                    <Box
                                        onClick={() => uploadProgress === undefined && setVideoSourceType('upload')}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            cursor: uploadProgress !== undefined ? 'default' : 'pointer',
                                            color: videoSourceType === 'upload' ? theme.palette.primary.main : '#64748b',
                                            opacity: uploadProgress !== undefined && videoSourceType !== 'upload' ? 0.5 : 1
                                        }}
                                    >
                                        <Box sx={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            border: videoSourceType === 'upload' ? `5px solid ${theme.palette.primary.main}` : '2px solid #cbd5e1',
                                            boxSizing: 'border-box'
                                        }} />
                                        <Typography variant="caption" sx={{ fontWeight: videoSourceType === 'upload' ? 600 : 400 }}>
                                            Upload Video
                                        </Typography>
                                    </Box>
                                    <Box
                                        onClick={() => uploadProgress === undefined && setVideoSourceType('url')}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            cursor: uploadProgress !== undefined ? 'default' : 'pointer',
                                            color: videoSourceType === 'url' ? theme.palette.primary.main : '#64748b',
                                            opacity: uploadProgress !== undefined && videoSourceType !== 'url' ? 0.5 : 1
                                        }}
                                    >
                                        <Box sx={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            border: videoSourceType === 'url' ? `5px solid ${theme.palette.primary.main}` : '2px solid #cbd5e1',
                                            boxSizing: 'border-box'
                                        }} />
                                        <Typography variant="caption" sx={{ fontWeight: videoSourceType === 'url' ? 600 : 400 }}>
                                            External URL
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {videoSourceType === 'upload' ? (
                                <Box
                                    sx={{
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: '0.75rem',
                                        p: (videoFile || uploadProgress !== undefined) ? 2 : 4,
                                        textAlign: 'center',
                                        bgcolor: '#f8fafc',
                                        cursor: (videoFile || uploadProgress !== undefined) ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: (videoFile || uploadProgress !== undefined) ? '#f8fafc' : '#f1f5f9',
                                        },
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    onClick={(e) => {
                                        if (uploadProgress !== undefined) return;
                                        // Prevent clicking the box if clicking the video controls
                                        if ((e.target as HTMLElement).tagName !== 'VIDEO') {
                                            document.getElementById('video-upload-input')?.click();
                                        }
                                    }}
                                >
                                    <input
                                        id="video-upload-input"
                                        type="file"
                                        accept="video/*"
                                        style={{ display: 'none' }}
                                        onChange={handleVideoFileChange}
                                        disabled={uploadProgress !== undefined}
                                    />
                                    {uploadProgress !== undefined && uploadProgress < 100 ? (
                                        <Box sx={{ py: 2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                                                Uploading video...
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={uploadProgress}
                                                sx={{ height: 10, borderRadius: 5, mb: 1 }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                {uploadProgress}% complete
                                            </Typography>
                                        </Box>
                                    ) : videoFile ? (
                                        <Box sx={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden', bgcolor: '#000' }}>
                                            <VideoPlayer
                                                src={videoPreviewUrl || ''}
                                                autoPlay={false}
                                            />
                                            <Box sx={{ mt: 1, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.text.primary }} noWrap>
                                                    {videoFile.name}
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setVideoFile(null);
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : uploadedVideoPath ? (
                                        <Box sx={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden', bgcolor: '#000' }}>
                                            <VideoPlayer
                                                src={`${STATIC_ASSETS_BASE_URL}/${uploadedVideoPath}`}
                                                autoPlay={false}
                                            />
                                            <Box sx={{ mt: 1, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', borderRadius: '0.5rem' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MovieEditIcon sx={{ color: theme.palette.primary.main, fontSize: '1.25rem' }} />
                                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.text.primary }}>
                                                        Video uploaded
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {previousVideoPath && (
                                                        <Button
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUploadedVideoPath(previousVideoPath);
                                                                setPreviousVideoPath(null);
                                                            }}
                                                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                                        >
                                                            Undo
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviousVideoPath(uploadedVideoPath);
                                                            setUploadedVideoPath(null);
                                                            // Trigger file input
                                                            document.getElementById('video-upload-input')?.click();
                                                        }}
                                                        sx={{ textTransform: 'none' }}
                                                    >
                                                        Replace
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <>
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                bgcolor: '#ffffff',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mx: 'auto',
                                                mb: 1.5,
                                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                                transition: 'transform 0.2s',
                                                '&:hover': {
                                                    transform: 'scale(1.1)',
                                                }
                                            }}>
                                                <UploadFileIcon sx={{ color: theme.palette.primary.main }} />
                                            </Box>
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5, color: theme.palette.text.primary }}>
                                                Upload video file
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                MP4, WEBM (Max 500MB)
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            ) : (
                                <Box>
                                    <TextField
                                        fullWidth
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="Paste Video URL (YouTube, Vimeo...)"
                                        size="small"
                                        disabled={uploadProgress !== undefined}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LinkIcon sx={{ fontSize: '1.125rem', color: '#94a3b8' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '0.5rem',
                                                fontSize: '0.875rem',
                                                bgcolor: '#ffffff',
                                                opacity: uploadProgress !== undefined ? 0.7 : 1,
                                                '& fieldset': { borderColor: '#e2e8f0' },
                                                '&:hover fieldset': { borderColor: theme.palette.primary.main },
                                            }
                                        }}
                                    />
                                    {videoUrl.trim() && (
                                        <Box sx={{ mt: 2, borderRadius: '0.5rem', overflow: 'hidden', bgcolor: '#000' }}>
                                            <VideoPlayer src={videoUrl.trim()} autoPlay={false} />
                                        </Box>
                                    )}
                                </Box>
                            )}
                            {errors.video && (
                                <Typography sx={{ color: theme.palette.error.main, fontSize: '0.75rem', mt: 1, ml: 0.5 }}>
                                    {errors.video}
                                </Typography>
                            )}
                            {uploadError && (
                                <Box sx={{ 
                                    mt: 1, 
                                    p: 1.5, 
                                    bgcolor: '#fef2f2', 
                                    border: '1px solid #fecaca', 
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <Typography sx={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 500 }}>
                                        Upload failed: {uploadError}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Duration */}
                        <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1, color: theme.palette.text.primary }}>
                                Duration (Minutes)
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="0"
                                size="small"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>
                                                MIN
                                            </Typography>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                    }
                                }}
                            />
                        </Box>

                        {/* Allow Preview */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            borderRadius: '0.75rem',
                            bgcolor: '#f8fafc',
                            border: '1px solid #f1f5f9',
                        }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 0.25, color: theme.palette.text.primary }}>
                                    Allow Preview
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Watch without enrolling
                                </Typography>
                            </Box>
                            <Switch
                                checked={allowPreview}
                                onChange={(e) => setAllowPreview(e.target.checked)}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{
                px: 4,
                py: 2.5,
                bgcolor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 2,
                borderTop: '1px solid #e2e8f0',
            }}>
                <Button
                    onClick={handleClose}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#64748b',
                        px: 3,
                        py: 1.25,
                        borderRadius: '0.5rem',
                        '&:hover': {
                            bgcolor: '#e2e8f0',
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={uploadProgress === 100 ? handleClose : handleSubmit}
                    variant="contained"
                    startIcon={uploadProgress === 100 ? undefined : <SaveIcon />}
                    disabled={uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        bgcolor: uploadProgress === 100 ? '#10b981' : theme.palette.primary.main,
                        px: 3,
                        borderRadius: '0.5rem',
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: uploadProgress === 100 ? '#059669' : theme.palette.primary.dark,
                            boxShadow: 'none',
                        }
                    }}
                >
                    {uploadProgress !== undefined && uploadProgress < 100
                        ? 'Uploading...'
                        : uploadProgress === 100
                            ? 'Finish'
                            : 'Save Lesson'}
                </Button>
            </Box>
        </Dialog>

        {/* Upload Cancel Confirmation Dialog */}
        <Dialog
            open={uploadCancelDialog.open}
            onClose={() => setUploadCancelDialog({ open: false, action: null })}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ fontWeight: 600 }}>Cancel Upload?</DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    A video upload is in progress. {uploadCancelDialog.action === 'close' ? 'Closing' : 'Going back'} will cancel the upload. Are you sure?
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={() => setUploadCancelDialog({ open: false, action: null })}
                    sx={{ textTransform: 'none', color: '#64748b' }}
                >
                    Continue Upload
                </Button>
                <Button
                    onClick={confirmCancelUpload}
                    variant="contained"
                    color="error"
                    sx={{ textTransform: 'none' }}
                >
                    Cancel Upload
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
        </>
    );
};

export default VideoLessonUpload;
