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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getZoomAccount } from '../../services/settings';
import { courseService, LessonResource } from '../../services/courseService';
import { createLiveClass, updateLiveClass } from '../../services/liveClassService';

interface LiveClassLessonUploadProps {
    courseId: string;
    sectionId?: string;
    onSuccess: (lessonId?: number) => void;
    onCancel: () => void;
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
            return String(Math.floor(initialData.duration / 60));
        }
        return '1';
    });
    const [minutes, setMinutes] = useState(() => {
        if (initialData?.duration) {
            return String(initialData.duration % 60);
        }
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

    // Populate form with initial data when editing
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.content_body || '');

            if (initialData.duration) {
                const totalMinutes = initialData.duration;
                const hrs = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                setHours(String(hrs));
                setMinutes(String(mins));
            }

            if (initialData.start_time) {
                const date = new Date(initialData.start_time);
                if (!isNaN(date.getTime())) {
                    const offset = date.getTimezoneOffset() * 60000;
                    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
                    setStartTime(localISOTime);
                }
            }

            if (initialData.resources) {
                setExistingResources(initialData.resources);
            }
        }
    }, [initialData]);

    useEffect(() => {
        const fetchZoomInfo = async () => {
            try {
                const response = await getZoomAccount();
                if (response.data) {
                    setZoomAccountInfo(response.data);
                    if (!hasInitializedRef.current && response.data.type === 1 && !initialData) {
                        setMinutes('40');
                        setHours('0');
                        hasInitializedRef.current = true;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch Zoom account info:', err);
            }
        };
        fetchZoomInfo();
    }, [initialData]);

    const isFreeAccount = zoomAccountInfo?.type === 1;
    const maxDurationForFree = 40;

    const handleResourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            const maxSize = 50 * 1024 * 1024;

            const validFiles = filesArray.filter(file => {
                if (file.size > maxSize) {
                    setSnackbar({ open: true, message: `File ${file.name} is too large (max 50MB)`, severity: 'error' });
                    return false;
                }
                return true;
            });

            setResourceFiles(prev => [...prev, ...validFiles]);
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
        try {
            if (!title.trim()) {
                setError('Please enter a class title');
                return;
            }

            if (!startTime) {
                setError('Please select a start date and time');
                return;
            }

            const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
            if (totalMinutes === 0) {
                setError('Please select a duration');
                return;
            }

            if (isFreeAccount && totalMinutes > maxDurationForFree) {
                setError(`Free Zoom accounts are limited to ${maxDurationForFree} minutes.`);
                return;
            }

            setLoading(true);
            setError(null);

            let response;
            if (isEditMode) {
                response = await updateLiveClass(initialData!.id, {
                    title: title.trim(),
                    description: description,
                    start_time: startTime,
                    duration: totalMinutes,
                });
            } else {
                response = await createLiveClass({
                    course_id: parseInt(courseId),
                    section_id: sectionId ? parseInt(sectionId) : null,
                    title: title.trim(),
                    description: description,
                    start_time: startTime,
                    duration: totalMinutes,
                });
            }

            if (response.status === 'success') {
                const lessonId = response.data.lessonId || response.data.id;

                // Upload new resources if any
                if (resourceFiles.length > 0) {
                    for (const file of resourceFiles) {
                        await courseService.uploadLessonResource(lessonId, file);
                    }
                }

                // Delete marked resources
                if (resourcesToDelete.length > 0) {
                    for (const id of resourcesToDelete) {
                        await courseService.deleteLessonResource(id);
                    }
                }

                setSnackbar({ open: true, message: `Live class ${isEditMode ? 'updated' : 'scheduled'} successfully!`, severity: 'success' });
                setTimeout(() => onSuccess(lessonId), 1500);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save live class');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date-time (current time) formatted for local browser time
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;

    // For minDateTime, we use current time + 5 mins
    const minDateTimeDate = new Date(now.getTime() + 5 * 60000 - tzOffset);
    const minDateTime = minDateTimeDate.toISOString().slice(0, 16);

    // Initialize startTime for new sessions if empty
    useEffect(() => {
        if (!isEditMode && !startTime) {
            setStartTime(minDateTime);
        }
    }, [isEditMode, startTime, minDateTime]);

    const handleClose = () => {
        onCancel();
    };

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '1rem', height: '90vh', display: 'flex', flexDirection: 'column' }
            }}
        >
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                <IconButton onClick={handleClose}><CloseIcon /></IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Column */}
                <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Class Title</Typography>
                            <TextField
                                fullWidth
                                placeholder="e.g. Weekly Q&A Session"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={loading}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>Description & Agenda</Typography>
                            <Box sx={{
                                height: '350px',
                                '& .quill': { height: '100%', display: 'flex', flexDirection: 'column' },
                                '& .ql-container': { flex: 1, overflow: 'auto', fontSize: '0.875rem', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' },
                                '& .ql-toolbar': { borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', bgcolor: '#f8fafc' }
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
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    disabled={loading}
                                    inputProps={{ min: minDateTime }}
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Duration</Typography>
                                    {isFreeAccount && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#f97316', bgcolor: 'rgba(249, 115, 22, 0.1)', px: 1, borderRadius: '4px' }}>
                                                40 min limit
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Hours</InputLabel>
                                        <Select
                                            value={hours}
                                            label="Hours"
                                            onChange={(e) => setHours(e.target.value)}
                                            disabled={loading || isFreeAccount}
                                        >
                                            {[0, 1, 2, 3, 4, 5].map(h => (
                                                <MenuItem key={h} value={String(h)}>{h} hr</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Minutes</InputLabel>
                                        <Select
                                            value={minutes}
                                            label="Minutes"
                                            onChange={(e) => setMinutes(e.target.value)}
                                            disabled={loading}
                                        >
                                            {[0, 15, 30, 40, 45].map(m => (
                                                <MenuItem
                                                    key={m}
                                                    value={String(m)}
                                                    disabled={isFreeAccount && m > 40}
                                                >
                                                    {m} min
                                                </MenuItem>
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
                                <Button
                                    component="label"
                                    size="small"
                                    startIcon={<AttachmentIcon sx={{ fontSize: 16 }} />}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Attach
                                    <input type="file" hidden multiple onChange={handleResourceFileChange} />
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {existingResources.map(res => (
                                    <Paper key={res.id} variant="outlined" sx={{ p: 1.5, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <DescriptionIcon sx={{ fontSize: 20, color: '#64748b' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{res.title}</Typography>
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
                                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                                        No resources attached
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={handleClose} disabled={loading} sx={{ fontWeight: 600 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={loading}
                    sx={{
                        px: 4,
                        borderRadius: '0.75rem',
                        fontWeight: 700,
                        boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}`
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Update Class' : 'Schedule Class')}
                </Button>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '0.75rem' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default LiveClassLessonUpload;
