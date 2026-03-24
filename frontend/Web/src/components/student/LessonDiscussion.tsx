import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    Paper,
    Divider,
    CircularProgress,
    alpha,
    Snackbar,
    Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { getLessonDiscussions, createLessonDiscussion, LessonDiscussion as DiscussionType } from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';

interface LessonDiscussionProps {
    lessonId: number;
}

const LessonDiscussion: React.FC<LessonDiscussionProps> = ({ lessonId }) => {
    const { user } = useAuth();
    
    const [discussions, setDiscussions] = useState<DiscussionType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [newComment, setNewComment] = useState<string>('');
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    
    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    useEffect(() => {
        fetchDiscussions();
    }, [lessonId]);

    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            const response = await getLessonDiscussions(lessonId);
            if (response.status === 'success') {
                setDiscussions(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load discussions:', error);
            showSnackbar('Failed to load lesson discussions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const response = await createLessonDiscussion(lessonId, newComment);
            if (response.status === 'success') {
                setNewComment('');
                setDiscussions((prev) => [response.data, ...prev]);
                showSnackbar('Discussion posted successfully', 'success');
            }
        } catch (error: any) {
            console.error('Failed to post discussion:', error);
            showSnackbar(error.response?.data?.message || 'Failed to post discussion', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Lesson Discussions
            </Typography>

            {/* Post New Comment */}
            <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar 
                        src={user?.avatar || undefined} 
                        alt={user?.first_name} 
                        sx={{ bgcolor: 'primary.main', fontWeight: 600 }}
                    >
                        {user?.first_name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Ask a question or share your thoughts..."
                            variant="outlined"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            sx={{
                                mb: 1,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'background.paper',
                                }
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={<SendIcon sx={{ fontSize: 18 }} />}
                                disabled={!newComment.trim() || submitting}
                                onClick={handlePostComment}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                            >
                                {submitting ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Comments List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {discussions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <Typography variant="body1">No discussions yet.</Typography>
                        <Typography variant="body2">Be the first to start a conversation!</Typography>
                    </Box>
                ) : (
                    discussions.map((discussion) => (
                        <Box key={discussion.id}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Avatar 
                                    src={discussion.user?.avatar || undefined} 
                                    sx={{ 
                                        width: 40, height: 40, 
                                        bgcolor: discussion.user?.role === 'teacher' || discussion.user?.role === 'admin' 
                                            ? 'secondary.main' : 'primary.main' 
                                    }}
                                >
                                    {discussion.user?.first_name?.charAt(0) || 'U'}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {discussion.user?.first_name} {discussion.user?.last_name}
                                            </Typography>
                                            {(discussion.user?.role === 'teacher' || discussion.user?.role === 'admin') && (
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                                                        color: 'secondary.main',
                                                        px: 1, py: 0.2, borderRadius: 1,
                                                        fontWeight: 700, fontSize: '0.65rem'
                                                    }}
                                                >
                                                    Instructor
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {formatDate(discussion.created_at)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.6 }}>
                                        {discussion.content}
                                    </Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mt: 3, borderStyle: 'dashed' }} />
                        </Box>
                    ))
                )}
            </Box>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LessonDiscussion;
