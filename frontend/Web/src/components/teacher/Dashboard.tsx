'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    useTheme,
    alpha,
} from '@mui/material';
import {
    School as SchoolIcon,
    Groups as GroupsIcon,
    Schedule as ScheduleIcon,
    Videocam as VideocamIcon,
} from '@mui/icons-material';
import { getCourses } from '@/services/courseService';
import { getLiveSessions } from '@/services/liveClassService';

interface CourseSummary {
    id: number;
    title: string;
    instructors?: { id: number }[] | string;
    total_enrollments?: number;
}

interface LiveSession {
    id: number;
    title: string;
    start_time: string;
    [key: string]: any;
}

const motivationalQuotes = [
    'Every class you teach lights a path for someone else.',
    'Small progress in every session adds up to big wins.',
    'Your consistency is the lesson students remember most.',
    'Great teaching is the art of turning effort into momentum.',
    'Show up with clarity, leave them with confidence.',
];

const TeacherDashboard: React.FC = () => {
    const theme = useTheme();
    const [assignedCoursesCount, setAssignedCoursesCount] = useState(0);
    const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
    const [upcomingLiveClasses, setUpcomingLiveClasses] = useState<LiveSession[]>([]);
    const [currentDate, setCurrentDate] = useState('');
    const [greeting, setGreeting] = useState('Good Morning');
    const [userName, setUserName] = useState('Professor Smith');
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        // Load user data
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Professor';
                setUserName(fullName);
            } catch (error) {
                console.error('Failed to parse user data:', error);
            }
        }

        // Set date and greeting
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
        setCurrentDate(dateStr);

        // Set greeting based on time
        const hour = now.getHours();
        if (hour < 12) {
            setGreeting('Good Morning');
        } else if (hour < 18) {
            setGreeting('Good Afternoon');
        } else {
            setGreeting('Good Evening');
        }

        // Load assigned courses
        const loadCourses = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) return;

                const user = JSON.parse(userStr);
                const userId = user.id;

                const response = await getCourses({ limit: 100 });
                if (response.data && response.data.courses) {
                    const courses: CourseSummary[] = response.data.courses;
                    const normalizedCourses = courses.map((course) => {
                        let instructors = course.instructors;
                        if (typeof instructors === 'string') {
                            try {
                                instructors = JSON.parse(instructors);
                            } catch {
                                instructors = [];
                            }
                        }
                        return { ...course, instructors };
                    });

                    // Filter courses where user is an instructor
                    const assignedCourses = normalizedCourses.filter((course) => {
                        if (!course.instructors || !Array.isArray(course.instructors)) {
                            return false;
                        }
                        return course.instructors.some((instructor) => Number(instructor.id) === Number(userId));
                    });

                    setAssignedCoursesCount(assignedCourses.length);

                    // Calculate total enrolled students from assigned courses
                    const totalStudents = assignedCourses.reduce((sum, course) => {
                        return sum + (course.total_enrollments || 0);
                    }, 0);
                    setTotalEnrolledStudents(totalStudents);
                }
            } catch (error) {
                console.error('Failed to load courses:', error);
            }
        };

        // Load upcoming live sessions
        const loadLiveSessions = async () => {
            try {
                const response = await getLiveSessions({ limit: 10 });
                if (response.data && Array.isArray(response.data)) {
                    const now = new Date();
                    const upcoming = response.data
                        .filter((session: LiveSession) => new Date(session.start_time) > now)
                        .sort((a: LiveSession, b: LiveSession) => {
                            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                        });
                    setUpcomingLiveClasses(upcoming);
                }
            } catch (error) {
                console.error('Failed to load live sessions:', error);
            }
        };

        loadCourses();
        loadLiveSessions();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayLiveClasses = upcomingLiveClasses.filter((session) => {
        const start = new Date(session.start_time);
        return start >= startOfDay && start <= endOfDay;
    });
    const todayLiveCount = todayLiveClasses.length;
    const liveClassLabel = todayLiveCount === 1 ? 'live class' : 'live classes';

    return (
        <Box
            sx={{
                flex: 1,
                overflowY: 'auto',
                p: { xs: 2, md: 4 },
                scrollBehavior: 'smooth',
            }}
        >
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Welcome Section */}
                <Card
                    sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: '#ffffff',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                        border: '1px solid #e7edf3',
                        borderRadius: 2,
                    }}
                >
                    {/* Abstract background pattern */}
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            opacity: 0.1,
                            pointerEvents: 'none',
                            backgroundImage: `radial-gradient(${theme.palette.primary.main} 1px, transparent 1px)`,
                            backgroundSize: '24px 24px',
                        }}
                    />

                    <CardContent
                        sx={{
                            position: 'relative',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            p: { xs: 3, md: 4 },
                        }}
                    >
                        <Box>
                            <Typography sx={{ color: '#4c739a', fontWeight: 500, mb: 1 }}>
                                {currentDate}
                            </Typography>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    color: '#0d141b',
                                    letterSpacing: '-0.025em',
                                    mb: 1,
                                }}
                            >
                                {greeting}, {userName} 👋
                            </Typography>
                            <Typography sx={{ color: '#4c739a', maxWidth: '672px' }}>
                                {todayLiveCount > 0
                                    ? `You have ${todayLiveCount} ${liveClassLabel} scheduled for today!`
                                    : "You're all set! No classes scheduled for today."}
                            </Typography>
                        </Box>

                        {/* Motivational Quote */}
                        <Box
                            sx={{
                                mt: { xs: 3, md: 0 },
                                p: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                borderRadius: 2,
                                borderLeft: `4px solid ${theme.palette.primary.main}`,
                                maxWidth: '400px',
                            }}
                        >
                            <Typography
                                sx={{
                                    color: '#0d141b',
                                    fontStyle: 'italic',
                                    fontSize: '14px',
                                    lineHeight: 1.6,
                                }}
                            >
                                "{motivationalQuotes[quoteIndex]}"
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <Grid container spacing={3}>
                    {/* Assigned Courses */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: '#ffffff', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid #e7edf3', borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        borderRadius: 2,
                                        color: theme.palette.primary.main,
                                    }}
                                >
                                    <SchoolIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#4c739a', fontSize: '12px' }}>
                                        Assigned Courses
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                        {assignedCoursesCount}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Total Students */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: '#ffffff', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid #e7edf3', borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                        borderRadius: 2,
                                        color: theme.palette.success.main,
                                    }}
                                >
                                    <GroupsIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#4c739a', fontSize: '12px' }}>
                                        Total Enrolled Students
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                        {totalEnrolledStudents}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Upcoming Classes Today */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: '#ffffff', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid #e7edf3', borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        bgcolor: alpha(theme.palette.info.main, 0.1),
                                        borderRadius: 2,
                                        color: theme.palette.info.main,
                                    }}
                                >
                                    <VideocamIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#4c739a', fontSize: '12px' }}>
                                        Classes Today
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                        {todayLiveCount}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Upcoming Sessions */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: '#ffffff', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid #e7edf3', borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                                        borderRadius: 2,
                                        color: theme.palette.warning.main,
                                    }}
                                >
                                    <ScheduleIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#4c739a', fontSize: '12px' }}>
                                        Upcoming Sessions
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                        {upcomingLiveClasses.length}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Upcoming Live Classes */}
                {upcomingLiveClasses.length > 0 && (
                    <Card sx={{ bgcolor: '#ffffff', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', border: '1px solid #e7edf3', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0d141b' }}>
                                Upcoming Live Classes
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {upcomingLiveClasses.slice(0, 5).map((session) => (
                                    <Box
                                        key={session.id}
                                        sx={{
                                            p: 2,
                                            bgcolor: '#f9fafb',
                                            borderRadius: 1,
                                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: '#0d141b' }}>
                                                    {session.courseTitle}
                                                </Typography>
                                                <Typography sx={{ fontSize: '12px', color: '#4c739a', mt: 0.5 }}>
                                                    {new Date(session.start_time).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
};

export default TeacherDashboard;
