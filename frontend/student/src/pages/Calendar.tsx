import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, alpha, Paper, useTheme, CircularProgress } from '@mui/material';
import {
    VideoCameraFront as VideoCameraFrontIcon,
    Schedule as ScheduleIcon,
    PlayCircle as PlayCircleIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
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
}

const Calendar: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [liveClasses, setLiveClasses] = useState<LiveClassSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
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
            } catch (error) {
                console.error('Failed to fetch live classes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

        const prevMonthLastDate = new Date(year, month, 0).getDate();
        const prevMonthDays = [];
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            prevMonthDays.push(prevMonthLastDate - i);
        }

        const nextMonthDays = [];
        const totalCells = 42;
        const remainingCells = totalCells - (prevMonthDays.length + daysInCurrentMonth);
        for (let i = 1; i <= remainingCells; i++) {
            nextMonthDays.push(i);
        }

        return { prevMonthDays, daysInCurrentMonth, nextMonthDays, year, month };
    }, [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const nextSession = useMemo(() => {
        const now = new Date();
        return liveClasses
            .filter(c => new Date(c.start_time) > now)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
    }, [liveClasses]);

    const getClassStatus = (startTime: string, duration: number) => {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessionDate = new Date(start);
        sessionDate.setHours(0, 0, 0, 0);

        if (end < now) return 'completed';
        if (sessionDate.getTime() === today.getTime()) return 'today';
        return 'upcoming';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return theme.palette.error.main;
            case 'today': return theme.palette.info.main;
            case 'upcoming': return theme.palette.warning.main;
            default: return theme.palette.primary.main;
        }
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) {
        return (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%', bgcolor: theme.palette.background.paper, p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {nextSession && (
                    <Paper sx={{
                        p: 2,
                        borderRadius: '16px',
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: theme.shadows[1],
                        bgcolor: theme.palette.background.paper
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.palette.primary.main
                            }}>
                                <VideoCameraFrontIcon />
                            </Box>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: '10px', fontWeight: 700, color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Next Session
                                    </Typography>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.primary.main, animation: 'pulse 2s infinite' }} />
                                </Box>
                                <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary }}>{nextSession.title}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: '2px' }}>
                                    <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                                    <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
                                        {new Date(nextSession.start_time).toLocaleDateString()} at {new Date(nextSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<PlayCircleIcon />}
                                onClick={() => navigate(nextSession.lesson ? `/course/${nextSession.course_id}/player/${nextSession.lesson.id}` : `/course/${nextSession.course_id}/learn`)}
                                sx={{
                                    bgcolor: theme.palette.primary.main,
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.5,
                                    textTransform: 'none',
                                    boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.25)}`,
                                    '&:hover': {
                                        bgcolor: theme.palette.primary.dark,
                                    }
                                }}
                            >
                                Join Meeting
                            </Button>
                        </Box>
                    </Paper>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[
                            { label: 'Completed', color: theme.palette.error.main },
                            { label: 'Today', color: theme.palette.info.main },
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, whiteSpace: 'nowrap' }}>
                            Showing <Typography component="span" sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.primary }}>{liveClasses.length} sessions</Typography> scheduled
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Button
                                variant="outlined"
                                onClick={handleToday}
                                sx={{
                                    mr: 1,
                                    textTransform: 'none',
                                    minWidth: 'auto',
                                    px: 1.5,
                                    py: 0.5,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderColor: theme.palette.divider,
                                    color: theme.palette.text.primary,
                                    '&:hover': { bgcolor: theme.palette.action.hover }
                                }}
                            >
                                Today
                            </Button>
                            <Button onClick={handlePrevMonth} size="small" sx={{ minWidth: 28, p: 0.5, color: theme.palette.text.secondary }}>
                                <ChevronLeftIcon fontSize="small" />
                            </Button>
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, minWidth: '100px', textAlign: 'center', color: theme.palette.text.primary }}>
                                {monthYear}
                            </Typography>
                            <Button onClick={handleNextMonth} size="small" sx={{ minWidth: 28, p: 0.5, color: theme.palette.text.secondary }}>
                                <ChevronRightIcon fontSize="small" />
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{
                    flex: 1,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: theme.shadows[1]
                }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : '#f8fafc' }}>
                        {weekDays.map(day => (
                            <Box key={day} sx={{
                                py: 1.5,
                                textAlign: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: theme.palette.text.secondary,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                borderRight: `1px solid ${theme.palette.divider}`,
                                borderBottom: `1px solid ${theme.palette.divider}`
                            }}>
                                {day}
                            </Box>
                        ))}
                    </Box>

                    <Box sx={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)'
                    }}>
                        {calendarData.prevMonthDays.map((day: number, idx: number) => (
                            <Box key={`prev-${idx}`} sx={{
                                p: 1.5,
                                minHeight: '120px',
                                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.3) : 'rgba(241, 245, 249, 0.3)',
                                borderRight: `1px solid ${theme.palette.divider}`,
                                borderBottom: `1px solid ${theme.palette.divider}`
                            }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.disabled }}>{day}</Typography>
                            </Box>
                        ))}

                        {Array.from({ length: calendarData.daysInCurrentMonth }).map((_, i) => {
                            const day = i + 1;
                            const date = new Date(calendarData.year, calendarData.month, day);

                            const dayClasses = liveClasses.filter((c: LiveClassSession) => {
                                const classDate = new Date(c.start_time);
                                return classDate.getFullYear() === date.getFullYear() &&
                                    classDate.getMonth() === date.getMonth() &&
                                    classDate.getDate() === date.getDate();
                            });

                            const today = new Date();
                            const isToday = today.getFullYear() === date.getFullYear() &&
                                today.getMonth() === date.getMonth() &&
                                today.getDate() === date.getDate();

                            return (
                                <Box key={day} sx={{
                                    p: 1.5,
                                    minHeight: '120px',
                                    borderRight: `1px solid ${theme.palette.divider}`,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    '&:nth-of-type(7n)': { borderRight: 'none' },
                                    position: 'relative',
                                    ...(isToday && { bgcolor: alpha(theme.palette.primary.main, 0.04) }),
                                    '&:hover': { bgcolor: theme.palette.action.hover }
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        width: 28,
                                        height: 28,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        ...(isToday && { bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.3)}` })
                                    }}>
                                        <Typography sx={{ fontSize: '12px', fontWeight: 700, ...(isToday ? { color: theme.palette.primary.contrastText } : { color: theme.palette.text.secondary }) }}>
                                            {day}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {dayClasses.map((cls: LiveClassSession, idx: number) => {
                                            const status = getClassStatus(cls.start_time, cls.duration);
                                            const color = getStatusColor(status);
                                            return (
                                                <Box key={idx} sx={{
                                                    p: '4px 8px',
                                                    borderRadius: '6px',
                                                    bgcolor: alpha(color, 0.1),
                                                    border: `1px solid ${alpha(color, 0.2)}`,
                                                    color: color,
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        bgcolor: alpha(color, 0.15),
                                                        filter: 'brightness(0.95)'
                                                    }
                                                }}>
                                                    {new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {cls.title}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            );
                        })}

                        {calendarData.nextMonthDays.map((day: number, idx: number) => (
                            <Box key={`next-${idx}`} sx={{
                                p: 1.5,
                                minHeight: '120px',
                                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.3) : 'rgba(241, 245, 249, 0.3)',
                                borderRight: `1px solid ${theme.palette.divider}`,
                                borderBottom: `1px solid ${theme.palette.divider}`
                            }}>
                                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.disabled }}>{day}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
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

export default Calendar;
