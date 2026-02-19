import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

interface AddModuleModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (moduleData: {
        title: string;
        description: string;
        sequenceNumber: number;
    }) => void;
    totalModules: number;
}

const AddModuleModal: React.FC<AddModuleModalProps> = ({
    open,
    onClose,
    onAdd,
    totalModules,
}) => {
    const theme = useTheme();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!title.trim()) {
            newErrors.title = 'Module title is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAdd = () => {
        if (validateForm()) {
            onAdd({
                title: title.trim(),
                description: description.trim(),
                sequenceNumber: totalModules + 1,
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setErrors({});
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                }
            }}
        >
            {/* Dialog Header */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{
                    p: 3,
                    borderBottom: '1px solid #e7edf3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                            Create New Module
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                            Module #{totalModules + 1}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            color: '#64748b',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' }
                        }}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* Dialog Content */}
            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Module Title Input */}
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#0d141b' }}>
                        Module Title <span style={{ color: '#dc2626' }}>*</span>
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        placeholder="e.g., Introduction to React, Advanced Patterns"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (errors.title) {
                                setErrors({ ...errors, title: '' });
                            }
                        }}
                        error={!!errors.title}
                        helperText={errors.title}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#f6f7f8',
                                borderRadius: 1.5,
                                '& fieldset': { borderColor: '#e7edf3' },
                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                            },
                            '& .MuiOutlinedInput-input::placeholder': {
                                color: 'rgba(74, 115, 154, 0.5)',
                                opacity: 1,
                            },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            Max 100 characters
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {title.length} / 100
                        </Typography>
                    </Box>
                </Box>

                {/* Module Description Input */}
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#0d141b' }}>
                        Description <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Optional)</span>
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Describe what students will learn in this module..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#f6f7f8',
                                borderRadius: 1.5,
                                '& fieldset': { borderColor: '#e7edf3' },
                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                            },
                            '& .MuiOutlinedInput-input::placeholder': {
                                color: 'rgba(74, 115, 154, 0.5)',
                                opacity: 1,
                            },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            Max 500 characters (recommended 200-250)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {description.length} / 500
                        </Typography>
                    </Box>
                </Box>

                {/* Help Text */}
                <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.8rem' }}>
                        <strong>💡 Tip:</strong> Module titles should be descriptive and clear. They help students understand the course structure at a glance.
                    </Typography>
                </Box>
            </DialogContent>

            {/* Dialog Actions */}
            <DialogActions sx={{ p: 3, borderTop: '1px solid #e7edf3', gap: 1.5 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: '#e7edf3',
                        color: '#64748b',
                        '&:hover': {
                            borderColor: '#cbd5e1',
                            bgcolor: '#f8fafc',
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleAdd}
                    variant="contained"
                    disabled={!title.trim()}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        bgcolor: theme.palette.primary.main,
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                        '&.Mui-disabled': {
                            bgcolor: alpha(theme.palette.primary.main, 0.5),
                            color: 'rgba(255, 255, 255, 0.7)',
                        }
                    }}
                >
                    Create Module
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddModuleModal;
