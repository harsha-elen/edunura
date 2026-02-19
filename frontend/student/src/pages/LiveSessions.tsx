import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Link,
    Avatar,
    Chip,
    Card,
    Button,
    Grid,
    CircularProgress,
    Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import apiClient from '../services/apiClient';
import enrollmentService from '../services/enrollmentService';

interface LiveClassSession {
    id: number;
    course_id: number;
    title: string;
    description?: string;
    start_time: string;
    duration: number;
    meeting_id?: string;
    start_url?: string;
    join_url?: string;
    password?: string;
    is_active?: boolean;
    course?: {
        title: string;
    };
    lesson?: {
        id: number;
        title: string;
    };
    instructor?: {
        first_name: string;
        last_name: string;
        avatar?: string;
    };
}

const LiveSessions: React.FC = () => {
    const navigate = useNavigate();
    const [liveClasses, setLiveClasses] = useState<LiveClassSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'this_week' | 'next_week'>('all');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [enrollmentsResponse, liveClassesResponse] = await Promise.all([
                    enrollmentService.getMyEnrollments(),
                    apiClient.get('/live-classes/all')
                ]);

                const enrolledCourseIds = enrollmentsResponse.map((e: any) => e.course_id);
                
                if (liveClassesResponse.data.status === 'success') {
                    const allClasses = liveClassesResponse.data.data;
                    const filteredClasses = allClasses.filter((cls: LiveClassSession) => 
                        enrolledCourseIds.includes(cls.course_id)
                    );
                    setLiveClasses(filteredClasses);
                }
            } catch (err: any) {
                console.error('Failed to fetch live classes:', err);
                setError(err.response?.data?.message || 'Failed to load live sessions');
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const { liveNow, upcoming, past } = useMemo(() => {
        const now = new Date();

        const sorted = [...liveClasses].sort((a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );

        const live = sorted.filter(c => {
            const start = new Date(c.start_time);
            const end = new Date(start.getTime() + c.duration * 60000);
            return start <= now && end >= now;
        });

        const upcomingList = sorted.filter(c => new Date(c.start_time) > now);

        const pastList = sorted.filter(c => {
            const start = new Date(c.start_time);
            const end = new Date(start.getTime() + c.duration * 60000);
            return end < now;
        });

        return { liveNow: live, upcoming: upcomingList, past: pastList };
    }, [liveClasses]);

    const filteredSessions = useMemo(() => {
        let sessions = filter === 'this_week'
            ? upcoming.filter(s => new Date(s.start_time) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
            : filter === 'next_week'
            ? upcoming.filter(s => new Date(s.start_time) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
            : upcoming;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            sessions = sessions.filter(s =>
                s.title.toLowerCase().includes(term) ||
                s.course?.title?.toLowerCase().includes(term) ||
                s.description?.toLowerCase().includes(term)
            );
        }
        return sessions;
    }, [upcoming, filter, searchTerm]);

    const getTimeUntil = (startTime: string) => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = start.getTime() - now.getTime();

        if (diff < 0) return 'Started';

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return 'Starts in ' + days + 'd ' + (hours % 24) + 'h';
        if (hours > 0) return 'Starts in ' + hours + 'h ' + (minutes % 60) + 'm';
        if (minutes > 0) return 'Starts in ' + minutes + 'm';
        return 'Starting soon';
    };

    const getSessionStatus = (startTime: string, duration: number) => {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);
        const now = new Date();

        if (end < now) return 'completed';
        if (start <= now && end >= now) return 'live';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionDate = new Date(start);
        sessionDate.setHours(0, 0, 0, 0);

        if (sessionDate.getTime() === today.getTime()) return 'today';
        return 'upcoming';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#ffffff' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f6f7f8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, px: { xs: 3, lg: 5 }, py: 4 }}>
                <Box sx={{ maxWidth: 1024, mx: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2, mb: 3 }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                                Upcoming Live Sessions
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500, color: '#64748b' }}>
                                All times are shown in your local timezone
                            </Typography>
                        </Box>
                        <TextField
                            size="small"
                            placeholder="Search sessions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                width: { xs: '100%', md: 260 },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: '#ffffff',
                                    '& fieldset': { borderColor: '#e2e8f0' },
                                }
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

                        {error && (
                            <Alert severity="error" onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {liveClasses.length === 0 && !loading && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 8,
                                textAlign: 'center'
                            }}>
                                <Box sx={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    bgcolor: alpha('#2b8cee', 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3
                                }}>
                                    <Typography sx={{ fontSize: 60, color: '#2b8cee' }}>V</Typography>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
                                    No Live Sessions
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 400, mb: 3 }}>
                                    There are no upcoming live sessions scheduled at the moment. Check back later!
                                </Typography>
                            </Box>
                        )}

                        {liveNow.length > 0 && (
                            <Box component="section">
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
                                    Happening Now
                                </Typography>
                                {liveNow.map((session) => (
                                    <Card
                                        key={session.id}
                                        sx={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderRadius: 4,
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            bgcolor: '#ffffff',
                                            mb: 2
                                        }}
                                    >
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 6, height: '100%', bgcolor: '#2b8cee' }} />
                                        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, ml: 1, bgcolor: 'transparent' }}>
                                            <Grid container spacing={4} alignItems="center">
                                                <Grid item xs={12} md={8.5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                        <Box sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            px: 1.5,
                                                            py: 0.5,
                                                            borderRadius: 10,
                                                            bgcolor: '#fef2f2',
                                                            border: '1px solid #fee2e2'
                                                        }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444', mr: 1 }} />
                                                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                                                                Live Now
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                            Started at {formatTime(session.start_time)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mb: 1.5 }}>
                                                        {session.title}
                                                    </Typography>
                                                    <Typography sx={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, mb: 3, maxWidth: 640 }}>
                                                        {session.description || 'Join this live session now.'}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar
                                                                src={session.instructor?.avatar ? '/api' + session.instructor.avatar : undefined}
                                                                sx={{ width: 32, height: 32 }}
                                                            >
                                                                {session.instructor?.first_name?.[0] || 'T'}
                                                            </Avatar>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                                                                {session.instructor?.first_name} {session.instructor?.last_name || 'Instructor'}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                                                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                                                            {session.course?.title || 'General'}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} md={3.5} sx={{ textAlign: { md: 'right' } }}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        onClick={() => navigate(session.lesson ? `/course/${session.course_id}/player/${session.lesson.id}` : `/course/${session.course_id}/learn`)}
                                                        sx={{
                                                            bgcolor: '#2b8cee',
                                                            color: '#ffffff',
                                                            fontWeight: 800,
                                                            py: 1.75,
                                                            borderRadius: 2.5,
                                                            textTransform: 'none',
                                                            fontSize: '1rem',
                                                            boxShadow: '0 10px 15px -3px rgba(43, 140, 238, 0.3)',
                                                            '&:hover': { bgcolor: '#2563eb' },
                                                        }}
                                                    >
                                                        Join via Zoom
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {filteredSessions.length > 0 && (
                            <Box component="section">
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        Coming Up
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip
                                            label="All"
                                            size="small"
                                            onClick={() => setFilter('all')}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: filter === 'all' ? '#0f172a' : '#e2e8f0',
                                                color: filter === 'all' ? '#ffffff' : '#0f172a',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <Chip
                                            label="This Week"
                                            size="small"
                                            onClick={() => setFilter('this_week')}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: filter === 'this_week' ? '#0f172a' : '#e2e8f0',
                                                color: filter === 'this_week' ? '#ffffff' : '#64748b',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <Chip
                                            label="Next Week"
                                            size="small"
                                            onClick={() => setFilter('next_week')}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: filter === 'next_week' ? '#0f172a' : '#e2e8f0',
                                                color: filter === 'next_week' ? '#ffffff' : '#64748b',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {filteredSessions.map((session) => {
                                        const status = getSessionStatus(session.start_time, session.duration);
                                        const isStartingSoon = status === 'today';

                                        return (
                                            <Paper
                                                key={session.id}
                                                variant="outlined"
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: 3.5,
                                                    borderColor: isStartingSoon ? '#2b8cee' : '#e2e8f0',
                                                    bgcolor: '#ffffff',
                                                    '&:hover': { borderColor: '#2b8cee', transition: 'all 0.2s' }
                                                }}
                                            >
                                                <Grid container spacing={3} alignItems="center">
                                                    <Grid item xs={12} md={1.8} sx={{ borderRight: { md: '1px solid #f1f5f9' } }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                                            {formatTime(session.start_time)}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                            {formatDate(session.start_time)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12} md={7.2}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                            <Box sx={{
                                                                px: 1,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                bgcolor: isStartingSoon ? '#fef9c3' : '#f1f5f9',
                                                                color: isStartingSoon ? '#854d0e' : '#64748b',
                                                                fontSize: 10,
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                            }}>
                                                                {getTimeUntil(session.start_time)}
                                                            </Box>
                                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>*</Typography>
                                                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                                {session.course?.title || 'General'}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="h6" sx={{
                                                            fontSize: '1.125rem',
                                                            fontWeight: 800,
                                                            color: '#0f172a',
                                                            mb: 1,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {session.title}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar
                                                                src={session.instructor?.avatar ? '/api' + session.instructor.avatar : undefined}
                                                                sx={{ width: 22, height: 22 }}
                                                            >
                                                                {session.instructor?.first_name?.[0] || 'T'}
                                                            </Avatar>
                                                            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                                                                {session.instructor?.first_name} {session.instructor?.last_name || 'Instructor'}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={12} md={3} sx={{ textAlign: { md: 'right' } }}>
                                                        {status === 'today' || status === 'upcoming' ? (
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                onClick={() => navigate(session.lesson ? `/course/${session.course_id}/player/${session.lesson.id}` : `/course/${session.course_id}/learn`)}
                                                                sx={{
                                                                    bgcolor: '#2b8cee',
                                                                    color: '#ffffff',
                                                                    fontWeight: 700,
                                                                    borderRadius: 2,
                                                                    textTransform: 'none',
                                                                    px: 3,
                                                                    py: 1,
                                                                    boxShadow: 'none',
                                                                    '&:hover': { bgcolor: '#2563eb' }
                                                                }}
                                                            >
                                                                Join Class
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                disabled
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    textTransform: 'none',
                                                                    px: 2,
                                                                    py: 1,
                                                                    border: '1px solid #e2e8f0',
                                                                    color: '#94a3b8',
                                                                }}
                                                            >
                                                                {getTimeUntil(session.start_time)}
                                                            </Button>
                                                        )}
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        {liveClasses.length > 0 && past.length > 0 && (
                            <Box component="section">
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#94a3b8', mb: 2 }}>
                                    Past Sessions
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.7 }}>
                                    {past.slice(0, 3).map((session) => (
                                        <Paper
                                            key={session.id}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                borderColor: '#e2e8f0',
                                                bgcolor: '#f8fafc',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 600, color: '#64748b' }}>
                                                        {session.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                        {formatDate(session.start_time)} * {formatTime(session.start_time)}
                                                    </Typography>
                                                </Box>
                                                <Chip label="Completed" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }} />
                                            </Box>
                                        </Paper>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ textAlign: 'center', pt: 4, pb: 8, borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
                            <Typography variant="body2">
                                {new Date().getFullYear()} LMS Portal. All rights reserved.
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1.5 }}>
                                <Link href="#" sx={{ color: '#2b8cee', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Technical Support</Link>
                                <Link href="#" sx={{ color: '#2b8cee', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Zoom Guide</Link>
                            </Box>
                        </Box>

                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default LiveSessions;
