'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface AssignmentLessonUploadProps {
    open: boolean;
    onClose: () => void;
    onBack?: () => void;
    onSave: (data: {
        title: string;
        description: string;
        allowPreview: boolean;
    }) => void;
    initialData?: {
        title?: string;
        description?: string;
        allowPreview?: boolean;
    };
}

const AssignmentLessonUpload: React.FC<AssignmentLessonUploadProps> = ({
    open,
    onClose,
    onBack,
    onSave,
    initialData,
}) => {
    const theme = useTheme();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [allowPreview, setAllowPreview] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setTitle(initialData?.title || '');
        setDescription(initialData?.description || '');
        setAllowPreview(Boolean(initialData?.allowPreview));
        setError('');
    }, [open, initialData]);

    const handleSave = () => {
        if (!title.trim()) {
            setError('Assignment title is required.');
            return;
        }

        onSave({
            title: title.trim(),
            description: description.trim(),
            allowPreview,
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    border: `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {onBack && (
                        <IconButton size="small" onClick={onBack} sx={{ color: '#64748b' }}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Box sx={{ width: 40, height: 40, borderRadius: '0.6rem', bgcolor: '#fff6d8', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AssignmentTurnedInIcon fontSize="small" />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                            Assignment Lesson
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Define the assignment brief and publishing options.
                        </Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Assignment Title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (error) setError('');
                    }}
                    error={Boolean(error)}
                    helperText={error || ' '}
                    fullWidth
                    size="small"
                    placeholder="e.g. Build a responsive landing page"
                />

                <TextField
                    label="Assignment Brief"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    minRows={5}
                    placeholder="Add requirements, submission guidelines, rubric, and due-date notes."
                />

                <FormControlLabel
                    control={<Switch checked={allowPreview} onChange={(e) => setAllowPreview(e.target.checked)} />}
                    label="Allow preview before enrollment"
                    sx={{ mt: 0.5 }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{ textTransform: 'none', fontWeight: 700, px: 3, borderRadius: '0.6rem' }}
                >
                    Save Assignment Lesson
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignmentLessonUpload;
