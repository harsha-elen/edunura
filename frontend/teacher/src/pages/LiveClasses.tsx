import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, alpha, Paper, useTheme, CircularProgress } from '@mui/material';
import {
    VideoCameraFront as VideoCameraFrontIcon,
    Schedule as ScheduleIcon,
    PlayCircle as PlayCircleIcon,
    CalendarMonth as CalendarMonthIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { getAllLiveClasses, LiveClassSession } from '../services/liveClassService';

const LiveClasses: React.FC = () => {
    const theme = useTheme();
    const [liveClasses, setLiveClasses] = useState<LiveClassSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await getAllLiveClasses();
                if (response.status === 'success') {
                    // Filter and sort: Show upcoming and ongoing (end time > now)
                    const now = new Date();
                    const activeClasses = response.data
                        .filter((c: LiveClassSession) => {
                            const start = new Date(c.start_time);
                            const end = new Date(start.getTime() + c.duration * 60000);
                            return end > now;
                        })
                        .sort((a: LiveClassSession, b: LiveClassSession) =>
                            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                        );
                    setLiveClasses(activeClasses);
                }
            } catch (error) {
                console.error('Failed to fetch live classes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const getSessionColor = (session: LiveClassSession, index: number, allSessions: LiveClassSession[]) => {
        const now = new Date();
        const start = new Date(session.start_time);
        const end = new Date(start.getTime() + session.duration * 60000);

        // Ongoing
        if (start <= now && now <= end) {
            return theme.palette.error.main; // RED
        }

        // Find the index of the first "future" class
        const firstFutureIndex = allSessions.findIndex(s => new Date(s.start_time) > now);

        // Next Class (Blue) - Use index matching
        if (index === firstFutureIndex) {
            return theme.palette.info.main; // BLUE
        }

        // All others (Orange)
        return theme.palette.warning.main; // ORANGE
    };

    const getStatusText = (session: LiveClassSession) => {
        const now = new Date();
        const start = new Date(session.start_time);
        if (start <= now) return 'LIVE NOW';
        return 'UPCOMING';
    };

    if (loading) {
        return (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Live Classes</Typography>
                <Typography color="text.secondary">
                    Your upcoming and ongoing live sessions.
                </Typography>
            </Box>

            {/* Legend */}
            {liveClasses.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
                    {[
                        { label: 'LIVE NOW', color: theme.palette.error.main },
                        { label: 'Next Up', color: theme.palette.info.main },
                        { label: 'Upcoming', color: theme.palette.warning.main }
                    ].map((item) => (
                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: theme.palette.text.secondary }}>
                                {item.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {liveClasses.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: theme.palette.background.paper }}>
                        <Typography color="text.secondary">No upcoming live classes scheduled.</Typography>
                    </Paper>
                ) : (
                    liveClasses.map((session, index) => {
                        const color = getSessionColor(session, index, liveClasses);
                        const statusText = getStatusText(session);
                        const startTime = new Date(session.start_time);
                        const endTime = new Date(startTime.getTime() + session.duration * 60000);

                        return (
                            <Paper key={session.id} sx={{
                                p: 2,
                                borderRadius: '16px',
                                border: `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: theme.shadows[1],
                                bgcolor: theme.palette.background.paper,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme.shadows[2]
                                }
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 48,
                                        height: 48,
                                        bgcolor: alpha(color, 0.1),
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: color
                                    }}>
                                        <VideoCameraFrontIcon />
                                    </Box>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {statusText}
                                            </Typography>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, animation: 'pulse 2s infinite' }} />
                                        </Box>

                                        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '16px' }}>{session.title}</Typography>

                                        {/* Updated Details Row */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                            {/* Course Name */}
                                            {session.course && (
                                                <>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <SchoolIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                                        <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, fontWeight: 500 }}>
                                                            {session.course.title}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: theme.palette.divider }} />
                                                </>
                                            )}

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                                <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, fontWeight: 500 }}>
                                                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: theme.palette.divider }} />

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarMonthIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                                <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, fontWeight: 500 }}>
                                                    {startTime.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<PlayCircleIcon />}
                                        component="a"
                                        href={session.start_url}
                                        target="_blank"
                                        sx={{
                                            bgcolor: color,
                                            borderRadius: '12px',
                                            fontWeight: 700,
                                            px: 4,
                                            py: 1.5,
                                            textTransform: 'none',
                                            boxShadow: `0 8px 16px -4px ${alpha(color, 0.25)}`,
                                            '&:hover': {
                                                bgcolor: alpha(color, 0.9), // Simple darken for dynamic colors
                                            }
                                        }}
                                    >
                                        Start Meeting
                                    </Button>
                                </Box>
                            </Paper>
                        );
                    })
                )}
            </Box>

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

export default LiveClasses;
