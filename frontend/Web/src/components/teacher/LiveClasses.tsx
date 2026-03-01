'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Schedule as ScheduleIcon,
    PlayCircle as PlayCircleIcon,
    CalendarMonth as CalendarMonthIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { getLiveSessions } from '@/services/liveClassService';

interface LiveSession {
    id: number;
    title: string;
    start_time: string;
    duration: number;
    course_id?: number;
    join_url?: string;
    start_url?: string;
    [key: string]: any;
}

const TeacherLiveClasses: React.FC = () => {
    const theme = useTheme();
    const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await getLiveSessions();
                if (response.data) {
                    // Filter and sort: Show upcoming and ongoing (end time > now)
                    const now = new Date();
                    const activeSessions = response.data
                        .filter((session: LiveSession) => {
                            const start = new Date(session.start_time);
                            const end = new Date(start.getTime() + session.duration * 60000);
                            return end > now;
                        })
                        .sort((a: LiveSession, b: LiveSession) =>
                            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                        );
                    setLiveSessions(activeSessions);
                }
            } catch (error) {
                console.error('Failed to fetch live sessions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const getSessionColor = (session: LiveSession, index: number, allSessions: LiveSession[]) => {
        const now = new Date();
        const start = new Date(session.start_time);
        const end = new Date(start.getTime() + session.duration * 60000);

        // Ongoing
        if (start <= now && now <= end) {
            return theme.palette.error.main; // RED
        }

        // Find the index of the first "future" session
        const firstFutureIndex = allSessions.findIndex(s => new Date(s.start_time) > now);

        // Next Session (Blue) - Use index matching
        if (index === firstFutureIndex) {
            return theme.palette.info.main; // BLUE
        }

        // All others (Orange)
        return theme.palette.warning.main; // ORANGE
    };

    const getStatusText = (session: LiveSession) => {
        const now = new Date();
        const start = new Date(session.start_time);
        if (start <= now) return 'LIVE NOW';
        return 'UPCOMING';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f6f7f8', minHeight: '100%', p: { xs: 2, md: 4 } }}>
            <Box sx={{ maxWidth: '1280px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Header */}
                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: '#0d141b',
                            mb: 0.5,
                            fontSize: { xs: '20px', md: '24px' },
                        }}
                    >
                        Live Classes
                    </Typography>
                    <Typography sx={{ color: '#4c739a', fontSize: '14px' }}>
                        Your upcoming and ongoing live sessions.
                    </Typography>
                </Box>

                {/* Legend */}
                {liveSessions.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1, flexWrap: 'wrap' }}>
                        {[
                            { label: 'LIVE NOW', color: theme.palette.error.main },
                            { label: 'Next Up', color: theme.palette.info.main },
                            { label: 'Upcoming', color: theme.palette.warning.main },
                        ].map((item) => (
                            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: item.color,
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#4c739a',
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Sessions List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {liveSessions.length === 0 ? (
                        <Paper
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                borderRadius: '16px',
                                bgcolor: '#ffffff',
                                border: '1px solid #e7edf3',
                            }}
                        >
                            <Typography sx={{ color: '#4c739a' }}>
                                No upcoming live classes scheduled.
                            </Typography>
                        </Paper>
                    ) : (
                        liveSessions.map((session, index) => {
                            const color = getSessionColor(session, index, liveSessions);
                            const statusText = getStatusText(session);
                            const startTime = new Date(session.start_time);
                            const endTime = new Date(startTime.getTime() + session.duration * 60000);

                            return (
                                <Paper
                                    key={session.id}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '16px',
                                        border: '1px solid #e7edf3',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        bgcolor: '#ffffff',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        },
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: { xs: 2, sm: 0 },
                                        alignItems: { xs: 'flex-start', sm: 'center' },
                                    }}
                                >
                                    {/* Left Content */}
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                                        {/* Icon */}
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                bgcolor: alpha(color, 0.1),
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: color,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <VideocamIcon />
                                        </Box>

                                        {/* Title & Details */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            {/* Status Badge */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        color: color,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                    }}
                                                >
                                                    {statusText}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        bgcolor: color,
                                                        animation: 'pulse 2s infinite',
                                                    }}
                                                />
                                            </Box>

                                            {/* Title */}
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    color: '#0d141b',
                                                    fontSize: '16px',
                                                    mb: 1,
                                                }}
                                            >
                                                {session.title}
                                            </Typography>

                                            {/* Details Row */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                {/* Course Name */}
                                                {session.course && (
                                                    <>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <SchoolIcon
                                                                sx={{
                                                                    fontSize: 16,
                                                                    color: '#4c739a',
                                                                }}
                                                            />
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '13px',
                                                                    color: '#4c739a',
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {session.course.title}
                                                            </Typography>
                                                        </Box>
                                                        <Box
                                                            sx={{
                                                                width: 4,
                                                                height: 4,
                                                                borderRadius: '50%',
                                                                bgcolor: '#e7edf3',
                                                            }}
                                                        />
                                                    </>
                                                )}

                                                {/* Time */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <ScheduleIcon
                                                        sx={{
                                                            fontSize: 16,
                                                            color: '#4c739a',
                                                        }}
                                                    />
                                                    <Typography
                                                        sx={{
                                                            fontSize: '13px',
                                                            color: '#4c739a',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {startTime.toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}{' '}
                                                        -{' '}
                                                        {endTime.toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </Typography>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        width: 4,
                                                        height: 4,
                                                        borderRadius: '50%',
                                                        bgcolor: '#e7edf3',
                                                    }}
                                                />

                                                {/* Date */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CalendarMonthIcon
                                                        sx={{
                                                            fontSize: 16,
                                                            color: '#4c739a',
                                                        }}
                                                    />
                                                    <Typography
                                                        sx={{
                                                            fontSize: '13px',
                                                            color: '#4c739a',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {startTime.toLocaleDateString('default', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Action Button */}
                                    <Button
                                        variant="contained"
                                        startIcon={<PlayCircleIcon />}
                                        component="a"
                                        href={session.start_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            bgcolor: color,
                                            borderRadius: '12px',
                                            fontWeight: 700,
                                            px: 4,
                                            py: 1.5,
                                            textTransform: 'none',
                                            boxShadow: `0 8px 16px -4px ${alpha(color, 0.25)}`,
                                            '&:hover': {
                                                bgcolor: alpha(color, 0.9),
                                            },
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}
                                    >
                                        Start Meeting
                                    </Button>
                                </Paper>
                            );
                        })
                    )}
                </Box>
            </Box>

            {/* Pulse animation styles */}
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.7; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.7; }
                }
                `}
            </style>
        </Box>
    );
};

export default TeacherLiveClasses;
