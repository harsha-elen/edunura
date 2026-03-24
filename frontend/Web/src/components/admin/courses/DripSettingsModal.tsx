'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    FormControl,
    Select,
    MenuItem,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon, LockClock as LockClockIcon } from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

interface LessonProp {
    id: number;
    title: string;
    release_date?: string | null;
    drip_days?: number | null;
    prerequisite_lesson_id?: number | null;
}

interface DripSettingsModalProps {
    open: boolean;
    onClose: () => void;
    lesson: LessonProp | null;
    allLessons: LessonProp[];
    onSave: (
        lessonId: number,
        data: { release_date: string | null; drip_days: number | null; prerequisite_lesson_id: number | null }
    ) => Promise<void>;
}

const DripSettingsModal: React.FC<DripSettingsModalProps> = ({ open, onClose, lesson, allLessons, onSave }) => {
    const theme = useTheme();
    const [releaseDate, setReleaseDate] = useState<string>('');
    const [dripDays, setDripDays] = useState<string>('');
    const [prerequisiteId, setPrerequisiteId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && lesson) {
            setReleaseDate(lesson.release_date ? new Date(lesson.release_date).toISOString().split('T')[0] : '');
            setDripDays(lesson.drip_days !== null && lesson.drip_days !== undefined ? String(lesson.drip_days) : '');
            setPrerequisiteId(lesson.prerequisite_lesson_id ? String(lesson.prerequisite_lesson_id) : '');
        } else if (!open) {
            setReleaseDate('');
            setDripDays('');
            setPrerequisiteId('');
            setIsSaving(false);
        }
    }, [open, lesson]);

    const handleSave = async () => {
        if (!lesson) return;
        setIsSaving(true);
        try {
            await onSave(lesson.id, {
                release_date: releaseDate || null,
                drip_days: dripDays ? parseInt(dripDays, 10) : null,
                prerequisite_lesson_id: prerequisiteId ? parseInt(prerequisiteId, 10) : null,
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const eligiblePrerequisites = allLessons.filter(l => l.id !== lesson?.id);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '1rem',
                    bgcolor: theme.palette.background.paper,
                    backgroundImage: 'none',
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
                borderBottom: `1px solid ${theme.palette.divider}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '0.5rem',
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.primary.main,
                    }}>
                        <LockClockIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: theme.palette.text.primary }}>
                            Drip Settings
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Configure access rules for: <b>{lesson?.title}</b>
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Body */}
            <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, bgcolor: theme.palette.background.paper }}>

                {/* Specific Date Release */}
                <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5, color: theme.palette.text.primary }}>
                        Specific Release Date
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, mb: 1.5 }}>
                        Unlock this lesson on a specific date.
                    </Typography>
                    <TextField
                        fullWidth
                        type="date"
                        size="small"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
                    />
                </Box>

                {/* Drip Days */}
                <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5, color: theme.palette.text.primary }}>
                        Days After Enrollment
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, mb: 1.5 }}>
                        Unlock this lesson X days after a student enrolls in the course.
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        placeholder="e.g. 7"
                        size="small"
                        value={dripDays}
                        onChange={(e) => setDripDays(e.target.value)}
                        slotProps={{ htmlInput: { min: 0 } }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
                    />
                </Box>

                {/* Prerequisite Lesson */}
                <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5, color: theme.palette.text.primary }}>
                        Prerequisite Lesson
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, mb: 1.5 }}>
                        Require completion of another lesson before unlocking this one.
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}>
                        <Select
                            displayEmpty
                            value={prerequisiteId}
                            onChange={(e) => setPrerequisiteId(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {eligiblePrerequisites.map(l => (
                                <MenuItem key={l.id} value={String(l.id)}>
                                    {l.title}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{
                px: 4,
                py: 2.5,
                bgcolor: theme.palette.action.hover,
                borderTop: `1px solid ${theme.palette.divider}`,
            }}>
                <Button
                    onClick={onClose}
                    sx={{ color: theme.palette.text.secondary, textTransform: 'none', fontWeight: 600 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="contained"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '0.5rem',
                        bgcolor: theme.palette.primary.main,
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DripSettingsModal;
