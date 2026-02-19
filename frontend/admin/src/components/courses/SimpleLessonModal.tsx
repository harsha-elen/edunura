import React, { useState } from 'react';
import {
    Dialog,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Quiz as QuizIcon,
    VideocamOutlined as VideocamOutlinedIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface SimpleLessonModalProps {
    open: boolean;
    onClose: () => void;
    onBack: () => void;
    type: 'quiz' | 'live';
    onSave: (lessonData: {
        title: string;
        type: 'quiz' | 'live';
        meta: string;
    }) => void;
}

const SimpleLessonModal: React.FC<SimpleLessonModalProps> = ({ open, onClose, onBack, type, onSave }) => {
    const theme = useTheme();
    const [title, setTitle] = useState('');
    const [errors, setErrors] = useState<{ title?: string }>({});

    const isQuiz = type === 'quiz';
    const Icon = isQuiz ? QuizIcon : VideocamOutlinedIcon;
    const titleLabel = isQuiz ? 'Quiz & Assessment' : 'Live Session';
    const description = isQuiz
        ? 'Test student knowledge with multiple-choice or open-ended questions.'
        : 'Schedule a real-time webinar or virtual classroom.';

    const handleSubmit = () => {
        if (!title.trim()) {
            setErrors({ title: 'Lesson title is required' });
            return;
        }

        onSave({
            title: title.trim(),
            type: type,
            meta: '', // Basic placeholder meta
        });
        handleClose();
    };

    const handleClose = () => {
        setTitle('');
        setErrors({});
        onClose();
    };

    const handleBackClick = () => {
        setTitle('');
        setErrors({});
        onBack();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '1rem',
                    bgcolor: 'background.paper',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton onClick={handleBackClick} sx={{ color: '#64748b', '&:hover': { color: theme.palette.text.primary, bgcolor: 'rgba(226, 232, 240, 0.5)' } }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '0.5rem',
                        bgcolor: isQuiz ? 'rgba(139, 92, 246, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isQuiz ? '#8B5CF6' : '#dc2626',
                    }}>
                        <Icon />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#0d141b' }}>
                            {titleLabel}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                            {description}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#64748b', '&:hover': { color: theme.palette.text.primary, bgcolor: 'rgba(226, 232, 240, 0.5)' } }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
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
                    placeholder={isQuiz ? "e.g. Final Assessment" : "e.g. Live Q&A Session"}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '0.5rem',
                            '& fieldset': { borderColor: errors.title ? theme.palette.error.main : '#e2e8f0' },
                        }
                    }}
                />

                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
                        <strong>Note:</strong> Full {isQuiz ? 'quiz engine' : 'Zoom integration'} is currently being developed. For now, you can add this lesson type to your curriculum with a title.
                    </Typography>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{
                px: 3,
                py: 2,
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
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        bgcolor: theme.palette.primary.main,
                        px: 3,
                        borderRadius: '0.5rem',
                        boxShadow: 'none',
                    }}
                >
                    Save Lesson
                </Button>
            </Box>
        </Dialog>
    );
};

export default SimpleLessonModal;
