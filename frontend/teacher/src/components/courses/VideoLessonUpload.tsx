import React, { useState } from 'react';
import {
    Dialog,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
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
        resources: Array<{ name: string; size: string; type: string }>;
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
        videoPath?: string;
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
    const [previousVideoPath, setPreviousVideoPath] = useState<string | null>(null);

    const [existingResources, setExistingResources] = useState<UploadedFile[]>([]);
    const [resourceFiles, setResourceFiles] = useState<File[]>([]);
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
            setExistingResources((initialData.resources || []) as UploadedFile[]);
            setResourceFiles([]);
            setResourcesToDelete([]);
            setVideoFile(null);
            setErrors({});
        } else if (open && !initialData) {
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
            const maxSize = 500 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors({ ...errors, video: 'Video file must be under 500MB. Please compress or choose a smaller file.' });
                if (previousVideoPath) {
                    setUploadedVideoPath(previousVideoPath);
                    setPreviousVideoPath(null);
                }
                return;
            }
            setErrors({ ...errors, video: undefined });
            setPreviousVideoPath(null);
            setVideoFile(file);
        } else if (previousVideoPath) {
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
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                showSnackbar('Resource file must be under 50MB. Please choose a smaller file.', 'error');
                event.target.value = '';
                return;
            }
            setResourceFiles([...resourceFiles, file]);
        }
        event.target.value = '';
    };

    const handleRemoveByFile = (index: number) => {
        setResourceFiles(resourceFiles.filter((_, i) => i !== index));
    };

    const handleRemoveExisting = (index: number) => {
        const resource = existingResources[index];
        if (resource.id !== undefined) {
            setResourcesToDelete([...resourcesToDelete, resource.id]);
        }
        setExistingResources(existingResources.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        const newErrors: { title?: string; video?: string } = {};
        if (!title.trim()) newErrors.title = 'Lesson title is required';

        if (videoSourceType === 'upload') {
            if (!videoFile && !uploadedVideoPath) newErrors.video = 'Please select a video file to upload';
        } else if (videoSourceType === 'url') {
            if (!videoUrl.trim()) {
                newErrors.video = 'Please enter a valid video URL';
            } else {
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

        if (uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100) return;

        onSave({
            title: title.trim(),
            description: description.trim(),
            videoType: videoSourceType,
            videoUrl: videoSourceType === 'url' ? videoUrl.trim() : undefined,
            videoFile: videoSourceType === 'upload' ? (videoFile || undefined) : undefined,
            duration: duration.trim(),
            allowPreview,
            resources: existingResources.map(r => ({ name: r.name, size: r.size, type: r.type })),
            resourceFiles,
            resourcesToDelete,
        });

        if (uploadProgress === undefined || uploadProgress >= 100) {
            performClose();
        }
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

    const handleClose = () => {
        if (uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100) {
            setUploadCancelDialog({ open: true, action: 'close' });
            return;
        }
        performClose();
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
        if (onBack) onBack();
        else handleClose();
    };

    const confirmCancelUpload = () => {
        if (uploadCancelDialog.action === 'close') performClose();
        else if (uploadCancelDialog.action === 'back') performBack();
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, py: 2.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconButton onClick={handleBackClick} sx={{ color: '#64748b', '&:hover': { color: theme.palette.text.primary, bgcolor: 'rgba(226, 232, 240, 0.5)' } }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box sx={{ width: 40, height: 40, borderRadius: '0.5rem', bgcolor: 'rgba(43, 140, 238, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.primary.main }}>
                            <MovieEditIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#0d141b' }}>Video Lesson</Typography>
                            {uploadProgress !== undefined && !uploadError && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: uploadProgress < 100 ? theme.palette.primary.main : '#10b981', fontWeight: 700 }}>
                                        {uploadProgress < 100 ? `UPLOADING ${uploadProgress}%` : 'UPLOAD COMPLETE ✓'}
                                    </Typography>
                                    {uploadProgress < 100 && <LinearProgress variant="determinate" value={uploadProgress} sx={{ width: 100, height: 6, borderRadius: 3 }} />}
                                </Box>
                            )}
                            {uploadError && <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>UPLOAD FAILED ✗</Typography>}
                        </Box>
                    </Box>
                    <IconButton onClick={handleClose} disabled={uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100} sx={{ color: '#64748b', '&:hover': { color: theme.palette.text.primary, bgcolor: 'rgba(226, 232, 240, 0.5)' } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Main Content */}
                <Box sx={{ flex: 1, overflow: 'auto', px: 4, py: 4, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: '10px' } }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '6fr 4fr' }, gap: 5, width: '100%' }}>
                        {/* Left Column */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Lesson Title</Typography>
                                <TextField fullWidth value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({}); }} error={!!errors.title} helperText={errors.title} placeholder="e.g. Advanced Performance Optimization" />
                            </Box>

                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Lesson Description</Typography>
                                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', minHeight: '160px', bgcolor: '#ffffff', '& .ql-toolbar': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', border: 'none' }, '& .ql-container': { border: 'none', fontSize: '0.875rem' }, '& .ql-editor': { minHeight: '120px' } }}>
                                    <ReactQuill theme="snow" value={description} onChange={setDescription} placeholder="Enter lesson details and expectations..." modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'bullet' }], ['link']] }} />
                                </Box>
                            </Box>

                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1.5 }}>Lesson Resources</Typography>
                                <Box onClick={() => document.getElementById('resource-file-input')?.click()} sx={{ border: '2px dashed #e2e8f0', borderRadius: '0.75rem', p: 3, textAlign: 'center', bgcolor: '#f8fafc', cursor: 'pointer', '&:hover': { borderColor: theme.palette.primary.main } }}>
                                    <input id="resource-file-input" type="file" style={{ display: 'none' }} onChange={handleResourceFileChange} />
                                    <Box sx={{ width: 40, height: 40, bgcolor: '#ffffff', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #f1f5f9' }}>
                                        <AttachmentIcon sx={{ color: theme.palette.primary.main }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}>Click to upload or drag and drop resources</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>PDF, ZIP, DOCX (Max 50MB per file)</Typography>
                                </Box>

                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {existingResources.map((file, index) => (
                                        <Box key={`existing-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <DescriptionIcon sx={{ color: '#3b82f6' }} />
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{file.name}</Typography>
                                                    <Typography sx={{ fontSize: '0.625rem', color: '#64748b' }}>{file.size} • Existing</Typography>
                                                </Box>
                                            </Box>
                                            <IconButton size="small" onClick={() => handleRemoveExisting(index)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}><CloseIcon sx={{ fontSize: '1.125rem' }} /></IconButton>
                                        </Box>
                                    ))}
                                    {resourceFiles.map((file, index) => (
                                        <Box key={`new-${index}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <DescriptionIcon sx={{ color: '#3b82f6' }} />
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{file.name}</Typography>
                                                    <Typography sx={{ fontSize: '0.625rem', color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB • New</Typography>
                                                </Box>
                                            </Box>
                                            <IconButton size="small" onClick={() => handleRemoveByFile(index)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}><CloseIcon sx={{ fontSize: '1.125rem' }} /></IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Right Column */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Video Content</Typography>
                                    <Box sx={{ display: 'flex', gap: 3 }}>
                                        <Box onClick={() => uploadProgress === undefined && setVideoSourceType('upload')} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', color: videoSourceType === 'upload' ? theme.palette.primary.main : '#64748b' }}>
                                            <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: videoSourceType === 'upload' ? `5px solid ${theme.palette.primary.main}` : '2px solid #cbd5e1' }} />
                                            <Typography variant="caption" sx={{ fontWeight: videoSourceType === 'upload' ? 600 : 400 }}>Upload Video</Typography>
                                        </Box>
                                        <Box onClick={() => uploadProgress === undefined && setVideoSourceType('url')} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', color: videoSourceType === 'url' ? theme.palette.primary.main : '#64748b' }}>
                                            <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: videoSourceType === 'url' ? `5px solid ${theme.palette.primary.main}` : '2px solid #cbd5e1' }} />
                                            <Typography variant="caption" sx={{ fontWeight: videoSourceType === 'url' ? 600 : 400 }}>External URL</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {videoSourceType === 'upload' ? (
                                    <Box sx={{ border: '2px dashed #e2e8f0', borderRadius: '0.75rem', p: (videoFile || uploadProgress !== undefined) ? 2 : 4, textAlign: 'center', bgcolor: '#f8fafc', cursor: (videoFile || uploadProgress !== undefined) ? 'default' : 'pointer', position: 'relative' }} onClick={() => uploadProgress === undefined && document.getElementById('video-upload-input')?.click()}>
                                        <input id="video-upload-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileChange} disabled={uploadProgress !== undefined} />
                                        {uploadProgress !== undefined && uploadProgress < 100 ? (
                                            <Box sx={{ py: 2 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>Uploading video...</Typography>
                                                <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
                                                <Typography variant="caption">{uploadProgress}% complete</Typography>
                                            </Box>
                                        ) : videoFile ? (
                                            <Box sx={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden', bgcolor: '#000' }}>
                                                <VideoPlayer src={videoPreviewUrl || ''} autoPlay={false} />
                                                <Box sx={{ mt: 1, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }} noWrap>{videoFile.name}</Typography>
                                                    <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}>Remove</Button>
                                                </Box>
                                            </Box>
                                        ) : uploadedVideoPath ? (
                                            <Box sx={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden', bgcolor: '#000' }}>
                                                <VideoPlayer src={`${STATIC_ASSETS_BASE_URL}/${uploadedVideoPath}`} autoPlay={false} />
                                                <Box sx={{ mt: 1, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', borderRadius: '0.5rem' }}>
                                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Video uploaded</Typography>
                                                    <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setPreviousVideoPath(uploadedVideoPath); setUploadedVideoPath(null); document.getElementById('video-upload-input')?.click(); }}>Replace</Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <>
                                                <Box sx={{ width: 48, height: 48, bgcolor: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                                                    <UploadFileIcon sx={{ color: theme.palette.primary.main }} />
                                                </Box>
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Upload video file</Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>MP4, WEBM (Max 500MB)</Typography>
                                            </>
                                        )}
                                    </Box>
                                ) : (
                                    <Box>
                                        <TextField fullWidth value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste Video URL (YouTube, Vimeo...)" size="small" InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: '1.125rem', color: '#94a3b8' }} /></InputAdornment> }} />
                                        {videoUrl.trim() && (
                                            <Box sx={{ mt: 2, borderRadius: '0.5rem', overflow: 'hidden', bgcolor: '#000' }}>
                                                <VideoPlayer src={videoUrl.trim()} autoPlay={false} />
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>

                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Duration (Minutes)</Typography>
                                <TextField fullWidth type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="0" size="small" InputProps={{ endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>MIN</Typography></InputAdornment> }} />
                            </Box>

                        </Box>
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ px: 4, py: 2.5, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
                    <Button onClick={uploadProgress === 100 ? handleClose : handleSubmit} variant="contained" startIcon={uploadProgress === 100 ? undefined : <SaveIcon />} disabled={uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100} sx={{ textTransform: 'none', bgcolor: uploadProgress === 100 ? '#10b981' : theme.palette.primary.main }}>
                        {uploadProgress !== undefined && uploadProgress < 100 ? 'Uploading...' : uploadProgress === 100 ? 'Finish' : 'Save Lesson'}
                    </Button>
                </Box>
            </Dialog>

            <Dialog open={uploadCancelDialog.open} onClose={() => setUploadCancelDialog({ open: false, action: null })} maxWidth="xs" fullWidth>
                <DialogTitle>Cancel Upload?</DialogTitle>
                <DialogContent><Typography variant="body2">A video upload is in progress. Closing will cancel it. Are you sure?</Typography></DialogContent>
                <DialogActions><Button onClick={() => setUploadCancelDialog({ open: false, action: null })}>Continue Upload</Button><Button onClick={confirmCancelUpload} variant="contained" color="error">Cancel Upload</Button></DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </>
    );
};

export default VideoLessonUpload;
