'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Button,
    Dialog,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Snackbar,
    IconButton,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    VideoCall as VideoCallIcon,
    Close as CloseIcon,
    CloudUpload as CloudUploadIcon,
    Description as DescriptionIcon,
    Delete as DeleteIcon,
    ChevronRight as ChevronRightIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import apiClient from '@/services/apiClient';
import { getZoomAccount, getMeetingPlatform } from '@/services/settings';
import { uploadLessonResource, deleteLessonResource } from '@/services/courseService';
import type { LessonResource } from '@/services/courseService';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface LiveClassLessonUploadProps {
    courseId: string;
    sectionId?: string;
    onSuccess: (lessonId?: number) => void;
    onCancel: () => void;
    initialData?: {
        id: number;
        title: string;
        duration?: number;
        zoom_meeting_id?: string;
        zoom_join_url?: string;
        content_body?: string;
        resources?: LessonResource[];
        start_time?: string;
    };
}

interface UploadedResource {
    name: string;
    size: string;
}

const LiveClassLessonUpload: React.FC<LiveClassLessonUploadProps> = ({
    courseId,
    sectionId,
    onSuccess,
    onCancel,
    initialData,
}) => {
    const theme = useTheme();
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.content_body || '');
    const [startTime, setStartTime] = useState(() => {
        if (initialData?.start_time) {
            const date = new Date(initialData.start_time);
            if (!isNaN(date.getTime())) {
                const offset = date.getTimezoneOffset() * 60000;
                return new Date(date.getTime() - offset).toISOString().slice(0, 16);
            }
        }
        return '';
    });
    const [hours, setHours] = useState(() => {
        if (initialData?.duration) {
            const totalMinutes = initialData.duration;
            if (totalMinutes < 60) return '0';
            return String(Math.floor(totalMinutes / 60));
        }
        return '0';
    });
    const [minutes, setMinutes] = useState(() => {
        if (initialData?.duration) {
            return String(initialData.duration % 60);
        }
        return '30';
    });
    const [allowPreview, setAllowPreview] = useState(false);
    const [resources, setResources] = useState<UploadedResource[]>([]);
    const [resourceFiles, setResourceFiles] = useState<File[]>([]);
    const [existingResources, setExistingResources] = useState<LessonResource[]>(initialData?.resources || []);
    const [resourcesToDelete, setResourcesToDelete] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [zoomAccountInfo, setZoomAccountInfo] = useState<any>(null);
    const [refreshingZoom, setRefreshingZoom] = useState(false);
    const [meetingPlatform, setMeetingPlatform] = useState<'zoom' | 'jitsi'>('zoom');
    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.content_body || '');
            if (initialData.duration) {
                setHours(String(Math.floor(initialData.duration / 60)));
                setMinutes(String(initialData.duration % 60));
            }
            if (initialData.start_time) {
                const date = new Date(initialData.start_time);
                if (!isNaN(date.getTime())) {
                    const offset = date.getTimezoneOffset() * 60000;
                    setStartTime(new Date(date.getTime() - offset).toISOString().slice(0, 16));
                }
            }
            if (initialData.resources && initialData.resources.length > 0) {
                setExistingResources(initialData.resources);
                setResources(initialData.resources.map(r => ({ name: r.title, size: r.file_size })));
            }
        }
    }, [initialData]);

    useEffect(() => {
        const fetchPlatformAndInfo = async () => {
            try {
                const platform = await getMeetingPlatform();
                setMeetingPlatform(platform);
                if (platform === 'zoom') {
                    const response = await getZoomAccount();
                    if (response.status === 'success' && response.data) {
                        setZoomAccountInfo(response.data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch meeting platform info:', err);
            }
        };
        fetchPlatformAndInfo();
    }, [initialData]);

    const handleRefreshZoomInfo = async () => {
        try {
            setRefreshingZoom(true);
            const response = await getZoomAccount();
            if (response.status === 'success' && response.data) {
                setZoomAccountInfo(response.data);
            }
        } catch (err) {
            console.error('Failed to refresh Zoom account info:', err);
        } finally {
            setRefreshingZoom(false);
        }
    };

    const isFreeAccount = meetingPlatform === 'zoom' && (zoomAccountInfo === null || zoomAccountInfo?.type === 1);
    const maxDurationForFree = 40;

    const handleCreate = async () => {
        if (!courseId) { setError('Course ID is missing'); return; }
        if (!title.trim()) { setError('Class title is required'); return; }
        if (!startTime) { setError('Meeting date & time is required'); return; }

        const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
        if (totalMinutes < 1) { setError('Duration must be at least 1 minute'); return; }
        if (isFreeAccount && totalMinutes > maxDurationForFree) {
            setError(`Your free Zoom account allows maximum ${maxDurationForFree} minutes per meeting`);
            return;
        }
        if (!isFreeAccount && totalMinutes > 420) {
            setError('Duration cannot exceed 7 hours (420 minutes)');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let response;
            let lessonId: number | undefined;

            if (isEditMode && initialData) {
                response = await apiClient.put(`/live-classes/${initialData.id}`, {
                    title: title.trim(),
                    description: description.trim(),
                    start_time: startTime,
                    duration: totalMinutes,
                });
                lessonId = initialData.id;
            } else {
                response = await apiClient.post('/live-classes', {
                    course_id: parseInt(courseId),
                    section_id: sectionId ? parseInt(sectionId) : null,
                    title: title.trim(),
                    description: description.trim(),
                    start_time: startTime,
                    duration: totalMinutes,
                    agenda: '',
                });
                lessonId = response.data.data?.lesson?.id;
            }

            if (response.data.status === 'success') {
                if (resourcesToDelete.length > 0 && lessonId) {
                    for (const resourceId of resourcesToDelete) {
                        try { await deleteLessonResource(resourceId); } catch (err) { console.error(`Failed to delete resource ${resourceId}`, err); }
                    }
                }
                if (resourceFiles.length > 0 && lessonId) {
                    for (const file of resourceFiles) {
                        try { await uploadLessonResource(lessonId, file); } catch (err) { console.error('Failed to upload resource', err); }
                    }
                }
                setSnackbar({ open: true, message: isEditMode ? 'Live class updated successfully!' : 'Live class scheduled successfully!', severity: 'success' });
                setTimeout(() => { onSuccess(lessonId); }, 1500);
            } else {
                setError(response.data.message || (isEditMode ? 'Failed to update live class' : 'Failed to schedule live class'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to schedule live class');
            console.error('Error scheduling live class:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => { onCancel(); };

    const handleResourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const filesArray = Array.from(files);
            const newResources: UploadedResource[] = filesArray.map(file => ({
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            }));
            setResources(prev => [...prev, ...newResources]);
            setResourceFiles(prev => [...prev, ...filesArray]);
        }
    };

    const handleRemoveResource = (index: number) => {
        if (index < existingResources.length) {
            const resourceToDelete = existingResources[index];
            setResourcesToDelete(prev => [...prev, resourceToDelete.id]);
            setExistingResources(prev => prev.filter((_, i) => i !== index));
        } else {
            const fileIndex = index - existingResources.length;
            setResourceFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
        setResources(prev => prev.filter((_, i) => i !== index));
    };

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const minDateTime = new Date(now.getTime() + 5 * 60000 - tzOffset).toISOString().slice(0, 16);

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '0.75rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    maxHeight: '850px',
                    height: '90vh',
                },
            }}
        >
            {/* Header */}
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <VideoCallIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                            {isEditMode ? `Edit ${meetingPlatform === 'jitsi' ? 'Jitsi' : 'Zoom'} Live Class` : `Schedule ${meetingPlatform === 'jitsi' ? 'Jitsi' : 'Zoom'} Live Class`}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {isEditMode ? `Update your ${meetingPlatform === 'jitsi' ? 'Jitsi' : 'Zoom'} session configuration` : `Set up your ${meetingPlatform === 'jitsi' ? 'Jitsi' : 'Zoom'} session and materials`}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#94a3b8', '&:hover': { color: '#475569', backgroundColor: alpha('#000', 0.04) } }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Two Columns */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Column - Content */}
                <Box sx={{ width: '60%', borderRight: `1px solid ${theme.palette.divider}`, overflowY: 'auto', p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#334155', fontSize: '0.875rem' }}>Class Title</Typography>
                            <TextField
                                fullWidth
                                placeholder="e.g., Introduction to Advanced UI Design Principles"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={loading}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff' } }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#334155', fontSize: '0.875rem' }}>Session Description</Typography>
                            <Box sx={{
                                height: '420px',
                                '& .quill': { height: '100%', display: 'flex', flexDirection: 'column' },
                                '& .ql-container': { flex: 1, overflow: 'auto', fontSize: '0.875rem', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' },
                                '& .ql-toolbar': { borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc' },
                                '& .ql-editor': { minHeight: '100px' },
                                '& .ql-editor.ql-blank::before': { color: '#94a3b8', fontStyle: 'normal' },
                                '& button:hover .ql-stroke': { stroke: theme.palette.primary.main },
                                '& button:hover .ql-fill': { fill: theme.palette.primary.main },
                                '& button.ql-active .ql-stroke': { stroke: theme.palette.primary.main },
                                '& button.ql-active .ql-fill': { fill: theme.palette.primary.main },
                            }}>
                                <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Describe the objectives and agenda for this live session..."
                                    modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'bullet' }], ['link']] }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Right Column - Logistics */}
                <Box sx={{ width: '40%', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.2)' : '#f8fafc', overflowY: 'auto', p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Meeting Details */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontSize: '0.75rem' }}>
                                Meeting Logistics
                            </Typography>

                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#334155', fontSize: '0.875rem' }}>Meeting Date & Time</Typography>
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    disabled={loading}
                                    slotProps={{ htmlInput: { min: minDateTime } }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff' } }}
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155', fontSize: '0.875rem' }}>Duration</Typography>
                                    {isFreeAccount && !refreshingZoom && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#f97316', fontSize: '0.75rem', backgroundColor: 'rgba(249, 115, 22, 0.1)', px: 1, py: 0.5, borderRadius: '0.25rem' }}>
                                                40 minutes limit
                                            </Typography>
                                            <IconButton size="small" onClick={handleRefreshZoomInfo} sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                                                <RefreshIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    )}
                                    {refreshingZoom && <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Hours</InputLabel>
                                        <Select value={hours} onChange={(e) => setHours(e.target.value)} disabled={loading || isFreeAccount} label="Hours" sx={{ borderRadius: '0.5rem', backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff' }}>
                                            <MenuItem value="0">0 Hours</MenuItem>
                                            <MenuItem value="1">1 Hour</MenuItem>
                                            <MenuItem value="2">2 Hours</MenuItem>
                                            <MenuItem value="3">3 Hours</MenuItem>
                                            <MenuItem value="4">4 Hours</MenuItem>
                                            <MenuItem value="5">5 Hours</MenuItem>
                                            <MenuItem value="6">6 Hours</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth>
                                        <InputLabel>Minutes</InputLabel>
                                        <Select value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={loading} label="Minutes" sx={{ borderRadius: '0.5rem', backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff' }}>
                                            {[0, 15, 30, 40, 45, 60].map(m => (
                                                <MenuItem key={m} value={String(m)} disabled={isFreeAccount && m > 40}>
                                                    {m} {m === 1 ? 'minute' : 'minutes'}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        </Box>

                        {/* Resources */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontSize: '0.75rem' }}>
                                Lesson Resources
                            </Typography>
                            <Box
                                component="label"
                                sx={{
                                    border: '2px dashed', borderColor: theme.palette.divider, borderRadius: '0.75rem',
                                    p: 3, textAlign: 'center', cursor: 'pointer',
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#fff',
                                    transition: 'all 0.2s',
                                    '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.5), '& .upload-icon': { color: theme.palette.primary.main } },
                                }}
                            >
                                <input type="file" multiple onChange={handleResourceUpload} style={{ display: 'none' }} accept=".pdf,.pptx,.mp4" />
                                <CloudUploadIcon className="upload-icon" sx={{ fontSize: 48, color: '#cbd5e1', transition: 'color 0.2s' }} />
                                <Typography variant="body2" sx={{ mt: 1, color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>
                                    Drag & drop files or{' '}<Box component="span" sx={{ color: theme.palette.primary.main }}>browse</Box>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.625rem', textTransform: 'uppercase', mt: 0.5, display: 'block' }}>
                                    PDF, PPTX, MP4 (Max 100MB)
                                </Typography>
                            </Box>

                            {resources.map((resource, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff', borderRadius: '0.5rem', border: `1px solid ${theme.palette.divider}`, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                                    <Box sx={{ backgroundColor: alpha('#ef4444', 0.1), p: 1, borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <DescriptionIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{resource.name}</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.625rem' }}>{resource.size}</Typography>
                                    </Box>
                                    <IconButton size="small" onClick={() => handleRemoveResource(index)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>

                        {/* Allow Preview Toggle */}
                        <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Allow Free Preview</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Let guest users view this session</Typography>
                            </Box>
                            <Switch checked={allowPreview} onChange={(e) => setAllowPreview(e.target.checked)} disabled={loading} />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ px: 4, py: 2.5, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
                    <InfoIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.6875rem' }}>Your session will be synced with the main course calendar.</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button onClick={handleClose} disabled={loading} sx={{ px: 3, py: 1.25, borderRadius: '0.5rem', border: `1px solid ${theme.palette.divider}`, color: '#64748b', textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc' } }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !title.trim() || !startTime || (!hours && !minutes)}
                        sx={{
                            px: 4, py: 1.25, borderRadius: '0.5rem', backgroundColor: theme.palette.primary.main,
                            color: '#fff', textTransform: 'none', fontWeight: 500, fontSize: '0.875rem',
                            boxShadow: `0 10px 15px -3px ${alpha(theme.palette.primary.main, 0.2)}`,
                            '&:hover': { backgroundColor: theme.palette.primary.dark },
                            '&:disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8' },
                        }}
                    >
                        {loading ? (
                            <><CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />{isEditMode ? 'Updating...' : 'Scheduling...'}</>
                        ) : (
                            <>{isEditMode ? 'Update Class' : 'Schedule Class'}<ChevronRightIcon sx={{ fontSize: 18, ml: 0.5 }} /></>
                        )}
                    </Button>
                </Box>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Dialog>
    );
};

export default LiveClassLessonUpload;
