import React, { useState, useEffect } from 'react';
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
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import apiClient from '../../services/apiClient';
import { getZoomAccount } from '../../services/settings';
import { courseService } from '../../services/courseService';
import type { LessonResource } from '../../services/courseService';


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
            if (totalMinutes < 60) {
                return '0';
            }
            return String(Math.floor(totalMinutes / 60));
        }
        return '0';
    });
    const [minutes, setMinutes] = useState(() => {
        if (initialData?.duration) {
            const totalMinutes = initialData.duration;
            return String(totalMinutes % 60);
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
    const isEditMode = !!initialData;

    // Populate form with initial data when editing
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.content_body || '');
            
            // Parse duration
            if (initialData.duration) {
                const totalMinutes = initialData.duration;
                const hrs = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                setHours(String(hrs));
                setMinutes(String(mins));
            }

            // Parse start time
            if (initialData.start_time) {
                const date = new Date(initialData.start_time);
                if (!isNaN(date.getTime())) {
                    const offset = date.getTimezoneOffset() * 60000;
                    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
                    setStartTime(localISOTime);
                }
            }
            
            // Load existing resources
            if (initialData.resources && initialData.resources.length > 0) {
                setExistingResources(initialData.resources);
                // Display existing resources in the UI
                const resourcesDisplay = initialData.resources.map(r => ({
                    name: r.title,
                    size: r.file_size,
                }));
                setResources(resourcesDisplay);
            }
        }
    }, [initialData]);

    // Fetch Zoom account info on component mount
    useEffect(() => {
        const fetchZoomInfo = async () => {
            try {
                const response = await getZoomAccount();
                if (response.status === 'success' && response.data) {
                    setZoomAccountInfo(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch Zoom account info:', err);
            }
        };
        fetchZoomInfo();
    }, [initialData]);

    // Refresh Zoom account info
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

    const isFreeAccount = zoomAccountInfo === null || zoomAccountInfo?.type === 1;
    const maxDurationForFree = 40; // 40 minutes for free account

    const handleCreate = async () => {
        // Validation
        if (!courseId) {
            setError('Course ID is missing');
            return;
        }
        if (!title.trim()) {
            setError('Class title is required');
            return;
        }
        if (!startTime) {
            setError('Meeting date & time is required');
            return;
        }
        
        // Calculate total duration in minutes
        const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
        
        if (totalMinutes < 1) {
            setError('Duration must be at least 1 minute');
            return;
        }
        
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
                // Update existing live class
                response = await apiClient.put(`/live-classes/${initialData.id}`, {
                    title: title.trim(),
                    description: description.trim(),
                    start_time: startTime,
                    duration: totalMinutes,
                });
                lessonId = initialData.id;
            } else {
                // Create new live class
                response = await apiClient.post('/live-classes', {
                    course_id: parseInt(courseId),
                    section_id: sectionId ? parseInt(sectionId) : null,
                    title: title.trim(),
                    description: description.trim(),
                    start_time: startTime,
                    duration: totalMinutes,
                    agenda: '',
                });
                // Get lesson ID from response
                lessonId = response.data.data?.lesson?.id;
            }

            if (response.data.status === 'success') {
                // Handle resource deletions (for edit mode)
                if (resourcesToDelete.length > 0 && lessonId) {
                    for (const resourceId of resourcesToDelete) {
                        try {
                            await courseService.deleteLessonResource(resourceId);
                        } catch (err) {
                            console.error(`Failed to delete resource ${resourceId}`, err);
                        }
                    }
                }

                // Handle resource uploads
                if (resourceFiles.length > 0 && lessonId) {
                    for (const file of resourceFiles) {
                        try {
                            await courseService.uploadLessonResource(lessonId, file);
                        } catch (err) {
                            console.error('Failed to upload resource', err);
                        }
                    }
                }

                setSnackbar({
                    open: true,
                    message: isEditMode ? 'Live class updated successfully!' : 'Live class scheduled successfully!',
                    severity: 'success',
                });
                setTimeout(() => {
                    onSuccess(lessonId);
                }, 1500);
            } else {
                setError(response.data.message || (isEditMode ? 'Failed to update live class' : 'Failed to schedule live class'));
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to schedule live class';
            setError(errorMsg);
            console.error('Error scheduling live class:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onCancel();
    };

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
        // Check if it's an existing resource or a new file
        if (index < existingResources.length) {
            // It's an existing resource, mark for deletion
            const resourceToDelete = existingResources[index];
            setResourcesToDelete(prev => [...prev, resourceToDelete.id]);
            setExistingResources(prev => prev.filter((_, i) => i !== index));
        } else {
            // It's a new file, just remove from the list
            const fileIndex = index - existingResources.length;
            setResourceFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
        setResources(prev => prev.filter((_, i) => i !== index));
    };

    // Get minimum date-time (current time in local timezone)
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const minDateTimeDate = new Date(now.getTime() + 5 * 60000 - tzOffset);
    const minDateTime = minDateTimeDate.toISOString().slice(0, 16);

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
            {/* Modal Header */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            p: 1,
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <VideoCallIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                            {isEditMode ? 'Edit Zoom Live Class' : 'Schedule Zoom Live Class'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {isEditMode ? 'Update your live session configuration' : 'Configure your upcoming live session and materials'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    onClick={handleClose}
                    sx={{
                        color: '#94a3b8',
                        '&:hover': {
                            color: '#475569',
                            backgroundColor: alpha('#000', 0.04),
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Modal Content (Two Columns) */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Column (60%) - Content */}
                <Box
                    sx={{
                        width: '60%',
                        borderRight: `1px solid ${theme.palette.divider}`,
                        overflowY: 'auto',
                        p: 4,
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#cbd5e1',
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#94a3b8',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && (
                            <Alert severity="error" onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {/* Class Title */}
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 500,
                                    mb: 1,
                                    color: '#334155',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Class Title
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="e.g., Introduction to Advanced UI Design Principles"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={loading}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '0.5rem',
                                        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                                    },
                                }}
                            />
                        </Box>

                        {/* Session Description */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 500,
                                    mb: 1,
                                    color: '#334155',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Session Description
                            </Typography>
                            <Box sx={{
                                height: '420px',
                                '& .quill': {
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                },
                                '& .ql-container': {
                                    flex: 1,
                                    overflow: 'auto',
                                    fontSize: '0.875rem',
                                    borderBottomLeftRadius: '0.5rem',
                                    borderBottomRightRadius: '0.5rem',
                                },
                                '& .ql-toolbar': {
                                    borderTopLeftRadius: '0.5rem',
                                    borderTopRightRadius: '0.5rem',
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                                },
                                '& .ql-editor': {
                                    minHeight: '100px',
                                },
                                '& .ql-editor.ql-blank::before': {
                                    color: '#94a3b8',
                                    fontStyle: 'normal',
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
                                    placeholder="Describe the objectives and agenda for this live session..."
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
                    </Box>
                </Box>

                {/* Right Column (40%) - Logistics */}
                <Box
                    sx={{
                        width: '40%',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.2)' : '#f8fafc',
                        overflowY: 'auto',
                        p: 4,
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#cbd5e1',
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#94a3b8',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Meeting Details Card */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    color: '#94a3b8',
                                    fontSize: '0.75rem',
                                }}
                            >
                                Meeting Logistics
                            </Typography>

                            {/* Date & Time */}
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 500,
                                        mb: 1,
                                        color: '#334155',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    Meeting Date & Time
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    disabled={loading}
                                    inputProps={{ min: minDateTime }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '0.5rem',
                                            backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                                        },
                                    }}
                                />
                            </Box>

                            {/* Duration */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            color: '#334155',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        Duration
                                    </Typography>
                                    {isFreeAccount && !refreshingZoom && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: '#f97316',
                                                    fontSize: '0.75rem',
                                                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: '0.25rem'
                                                }}
                                            >
                                                40 minutes limit
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={handleRefreshZoomInfo}
                                                sx={{ 
                                                    color: '#94a3b8',
                                                    p: 0.5,
                                                    '&:hover': { color: theme.palette.primary.main }
                                                }}
                                            >
                                                <RefreshIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    )}
                                    {refreshingZoom && (
                                        <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Hours</InputLabel>
                                            <Select
                                                value={hours}
                                                onChange={(e) => setHours(e.target.value)}
                                                disabled={loading || isFreeAccount}
                                                label="Hours"
                                                sx={{
                                                    borderRadius: '0.5rem',
                                                    backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                                                }}
                                            >
                                                <MenuItem value="0">0 Hours</MenuItem>
                                                <MenuItem value="1">1 Hour</MenuItem>
                                                <MenuItem value="2">2 Hours</MenuItem>
                                                <MenuItem value="3">3 Hours</MenuItem>
                                                <MenuItem value="4">4 Hours</MenuItem>
                                                <MenuItem value="5">5 Hours</MenuItem>
                                                <MenuItem value="6">6 Hours</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Minutes</InputLabel>
                                            <Select
                                                value={minutes}
                                                onChange={(e) => setMinutes(e.target.value)}
                                                disabled={loading}
                                                label="Minutes"
                                                sx={{
                                                    borderRadius: '0.5rem',
                                                    backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                                                }}
                                            >
                                                {[0, 15, 30, 40, 45, 60].map(m => (
                                                    <MenuItem
                                                        key={m}
                                                        value={String(m)}
                                                        disabled={isFreeAccount && m > 40}
                                                    >
                                                        {m} {m === 1 ? 'minute' : 'minutes'}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Resources Section */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    color: '#94a3b8',
                                    fontSize: '0.75rem',
                                }}
                            >
                                Lesson Resources
                            </Typography>
                            <Box
                                component="label"
                                sx={{
                                    border: '2px dashed',
                                    borderColor: theme.palette.divider,
                                    borderRadius: '0.75rem',
                                    p: 3,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#fff',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: alpha(theme.palette.primary.main, 0.5),
                                        '& .upload-icon': {
                                            color: theme.palette.primary.main,
                                        },
                                    },
                                }}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleResourceUpload}
                                    style={{ display: 'none' }}
                                    accept=".pdf,.pptx,.mp4"
                                />
                                <CloudUploadIcon
                                    className="upload-icon"
                                    sx={{
                                        fontSize: 48,
                                        color: '#cbd5e1',
                                        transition: 'color 0.2s',
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        mt: 1,
                                        color: '#64748b',
                                        fontWeight: 500,
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    Drag & drop files or{' '}
                                    <Box component="span" sx={{ color: theme.palette.primary.main }}>
                                        browse
                                    </Box>
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#94a3b8',
                                        fontSize: '0.625rem',
                                        textTransform: 'uppercase',
                                        mt: 0.5,
                                        display: 'block',
                                    }}
                                >
                                    PDF, PPTX, MP4 (Max 100MB)
                                </Typography>
                            </Box>

                            {/* Uploaded Files List */}
                            {resources.map((resource, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        p: 1.5,
                                        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                                        borderRadius: '0.5rem',
                                        border: `1px solid ${theme.palette.divider}`,
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            backgroundColor: alpha('#ef4444', 0.1),
                                            p: 1,
                                            borderRadius: '0.375rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <DescriptionIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 500,
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.75rem',
                                            }}
                                        >
                                            {resource.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#94a3b8',
                                                fontSize: '0.625rem',
                                            }}
                                        >
                                            {resource.size}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveResource(index)}
                                        sx={{
                                            color: '#94a3b8',
                                            '&:hover': {
                                                color: '#ef4444',
                                            },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>

                        {/* Footer Toggle */}
                        <Box
                            sx={{
                                pt: 2,
                                borderTop: `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                    Allow Free Preview
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#94a3b8',
                                        fontSize: '0.6875rem',
                                    }}
                                >
                                    Let guest users view this session
                                </Typography>
                            </Box>
                            <Switch
                                checked={allowPreview}
                                onChange={(e) => setAllowPreview(e.target.checked)}
                                disabled={loading}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#fff',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: theme.palette.primary.main,
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Modal Footer (Action Bar) */}
            <Box
                sx={{
                    px: 4,
                    py: 2.5,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
                    <InfoIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.6875rem' }}>
                        Your session will be synced with the main course calendar.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                        sx={{
                            px: 3,
                            py: 1.25,
                            borderRadius: '0.5rem',
                            border: `1px solid ${theme.palette.divider}`,
                            color: '#64748b',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !title.trim() || !startTime || (!hours && !minutes)}
                        sx={{
                            px: 4,
                            py: 1.25,
                            borderRadius: '0.5rem',
                            backgroundColor: theme.palette.primary.main,
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            boxShadow: `0 10px 15px -3px ${alpha(theme.palette.primary.main, 0.2)}`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                            },
                            '&:disabled': {
                                backgroundColor: '#cbd5e1',
                                color: '#94a3b8',
                            },
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
                                {isEditMode ? 'Updating...' : 'Scheduling...'}
                            </>
                        ) : (
                            <>
                                {isEditMode ? 'Update Class' : 'Schedule Class'}
                                <ChevronRightIcon sx={{ fontSize: 18, ml: 0.5 }} />
                            </>
                        )}
                    </Button>
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default LiveClassLessonUpload;
