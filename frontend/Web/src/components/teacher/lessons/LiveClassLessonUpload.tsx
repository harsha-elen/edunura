'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Close as CloseIcon,
    Attachment as AttachmentIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { getZoomAccount } from '@/services/settings';
import { createLiveSession, updateLiveSession } from '@/services/liveClassService';
import { uploadLessonResource, deleteLessonResource } from '@/services/courseService';

interface LessonResource {
    id: number;
    title?: string;
    name?: string;
    file_path?: string;
    file_size?: string;
    file_type?: string;
}

export interface LiveClassLessonUploadProps {
    open: boolean;
    courseId: string | number;
    sectionId?: string | number | null;
    onSuccess: (lessonId?: number) => void;
    onCancel: () => void;
    onBack?: () => void;
    initialData?: {
        id: number;
        title: string;
        duration?: number;
        content_body?: string;
        start_time?: string | Date;
        resources?: LessonResource[];
    };
}

const LiveClassLessonUpload: React.FC<LiveClassLessonUploadProps> = ({
    open,
    courseId,
    sectionId,
    onSuccess,
    onCancel,
    onBack,
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
        if (initialData?.duration) return String(Math.floor(initialData.duration / 60));
        return '1';
    });
    const [minutes, setMinutes] = useState(() => {
        if (initialData?.duration) return String(initialData.duration % 60);
        return '30';
    });

    const [existingResources, setExistingResources] = useState<LessonResource[]>(initialData?.resources || []);
    const [resourceFiles, setResourceFiles] = useState<File[]>([]);
    const [resourcesToDelete, setResourcesToDelete] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [zoomAccountInfo, setZoomAccountInfo] = useState<any>(null);
    const hasInitializedRef = useRef(false);
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
            if (initialData.resources) setExistingResources(initialData.resources);
        }
    }, [initialData]);

    useEffect(() => {
        const fetchZoomInfo = async () => {
            try {
                const response = await getZoomAccount();
                if (response?.data) {
                    setZoomAccountInfo(response.data);
                    if (!hasInitializedRef.current && response.data.type === 1 && !initialData) {
                        setMinutes('40');
                        setHours('0');
                        hasInitializedRef.current = true;
                    }
                }
            } catch { /* zoom not configured */ }
        };
        fetchZoomInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isFreeAccount = zoomAccountInfo?.type === 1;
    const maxDurationForFree = 40;

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const minDateTime = new Date(now.getTime() + 5 * 60000 - tzOffset).toISOString().slice(0, 16);

    useEffect(() => {
        if (!isEditMode && !startTime) setStartTime(minDateTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

    const handleResourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            const valid = filesArray.filter(file => {
                if (file.size > 50 * 1024 * 1024) {
                    setSnackbar({ open: true, message: `File ${file.name} is too large (max 50MB)`, severity: 'error' });
                    return false;
                }
                return true;
            });
            setResourceFiles(prev => [...prev, ...valid]);
        }
        event.target.value = '';
    };

    const handleRemoveExistingResource = (id: number) => {
        setResourcesToDelete(prev => [...prev, id]);
        setExistingResources(prev => prev.filter(r => r.id !== id));
    };

    const handleRemoveNewResource = (index: number) => {
        setResourceFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!title.trim()) { setError('Please enter a class title'); return; }
        if (!startTime) { setError('Please select a start date and time'); return; }

        const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
        if (totalMinutes === 0) { setError('Please select a duration'); return; }
        if (isFreeAccount && totalMinutes > maxDurationForFree) {
            setError(`Free Zoom accounts are limited to ${maxDurationForFree} minutes.`); return;
        }

        setLoading(true);
        setError(null);

        try {
            let response: any;
            if (isEditMode) {
                response = await updateLiveSession(initialData!.id, {
                    title: title.trim(),
                    description,
                    start_time: startTime,
                    duration: totalMinutes,
                });
            } else {
                response = await createLiveSession({
                    course_id: Number(courseId),
                    section_id: sectionId ? Number(sectionId) : null,
                    title: title.trim(),
                    description,
                    start_time: startTime,
                    duration: totalMinutes,
                });
            }

            // Support both {status, data} and direct data shapes
            const isSuccess = response?.status === 'success' || response?.id || response?.lessonId;
            if (isSuccess) {
                const lessonId = response?.data?.lessonId || response?.data?.id || response?.lessonId || response?.id;

                if (resourceFiles.length > 0 && lessonId) {
                    for (const file of resourceFiles) {
                        try { await uploadLessonResource(lessonId, file); } catch { /* non-fatal */ }
                    }
                }
                if (resourcesToDelete.length > 0) {
                    for (const id of resourcesToDelete) {
                        try { await deleteLessonResource(id); } catch { /* non-fatal */ }
                    }
                }

                setSnackbar({ open: true, message: `Live class ${isEditMode ? 'updated' : 'scheduled'} successfully!`, severity: 'success' });
                setTimeout(() => onSuccess(lessonId), 1500);
            } else {
                throw new Error('Unexpected response from server');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save live class');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { borderRadius: '1rem', height: '90vh', display: 'flex', flexDirection: 'column' } }}
        >
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {onBack && (
                        <IconButton onClick={onBack} sx={{ color: '#64748b' }}>
                            <CloseIcon />
                        </IconButton>
                    )}
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: '0.75rem', display: 'flex' }}>
                        <VideocamIcon color="primary" />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {isEditMode ? 'Edit Live Class' : 'Schedule New Live Class'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Set up your Zoom session</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onCancel}><CloseIcon /></IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Column */}
                <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Class Title</Typography>
                            <TextField fullWidth placeholder="e.g. Weekly Q&A Session" value={title} onChange={e => setTitle(e.target.value)} disabled={loading} />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Description & Agenda</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe the objectives and agenda for this live session..."
                                disabled={loading}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', fontSize: '0.875rem', bgcolor: '#fff' } }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Right Column */}
                <Box sx={{ width: 400, bgcolor: '#f8fafc', p: 4, overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Logistics */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', display: 'block', mb: 2 }}>
                                Meeting Logistics
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Date & Time</Typography>
                                <TextField fullWidth type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={loading} inputProps={{ min: minDateTime }} />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Duration</Typography>
                                    {isFreeAccount && (
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#f97316', bgcolor: 'rgba(249, 115, 22, 0.1)', px: 1, borderRadius: '4px' }}>
                                            40 min limit
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Hours</InputLabel>
                                        <Select value={hours} label="Hours" onChange={e => setHours(e.target.value as string)} disabled={loading || isFreeAccount}>
                                            {[0, 1, 2, 3, 4, 5].map(h => (
                                                <MenuItem key={h} value={String(h)}>{h} hr</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Minutes</InputLabel>
                                        <Select value={minutes} label="Minutes" onChange={e => setMinutes(e.target.value as string)} disabled={loading}>
                                            {[0, 15, 30, 40, 45].map(m => (
                                                <MenuItem key={m} value={String(m)} disabled={isFreeAccount && m > 40}>{m} min</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        </Box>

                        {/* Resources */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>
                                    Session Resources
                                </Typography>
                                <Button component="label" size="small" startIcon={<AttachmentIcon sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    Attach
                                    <input type="file" hidden multiple onChange={handleResourceFileChange} />
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {existingResources.map(res => (
                                    <Paper key={res.id} variant="outlined" sx={{ p: 1.5, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <DescriptionIcon sx={{ fontSize: 20, color: '#64748b' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{res.title || res.name}</Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => handleRemoveExistingResource(res.id)}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                                    </Paper>
                                ))}
                                {resourceFiles.map((file, idx) => (
                                    <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: '0.75rem', bgcolor: alpha(theme.palette.primary.main, 0.05), borderStyle: 'dashed', borderColor: theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <DescriptionIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.primary.main }} noWrap>{file.name}</Typography>
                                        </Box>
                                        <IconButton size="small" color="primary" onClick={() => handleRemoveNewResource(idx)}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                                    </Paper>
                                ))}
                                {existingResources.length === 0 && resourceFiles.length === 0 && (
                                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2, fontStyle: 'italic' }}>No resources attached</Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={onCancel} disabled={loading} sx={{ fontWeight: 600 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={loading}
                    sx={{ px: 4, borderRadius: '0.75rem', fontWeight: 700, boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}` }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Update Class' : 'Schedule Class')}
                </Button>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '0.75rem' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Dialog>
    );
};

export default LiveClassLessonUpload;
