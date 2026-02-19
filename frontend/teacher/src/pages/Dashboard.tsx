import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    School as SchoolIcon,
    Groups as GroupsIcon,
    Schedule as ScheduleIcon,
    Science as ScienceIcon,
    Person as PersonIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { getCourses } from '../services/courseService';
import { getLiveClassesByCourse, LiveClassSession } from '../services/liveClassService';

interface CourseSummary {
    id: number;
    title: string;
    instructors?: { id: number }[] | string;
    total_enrollments?: number;
}

interface LiveClassItem extends LiveClassSession {
    courseTitle?: string;
}

const motivationalQuotes = [
    'Every class you teach lights a path for someone else.',
    'Small progress in every session adds up to big wins.',
    'Your consistency is the lesson students remember most.',
    'Great teaching is the art of turning effort into momentum.',
    'Show up with clarity, leave them with confidence.',
];

const Dashboard: React.FC = () => {
    const theme = useTheme();
    const [assignedCoursesCount, setAssignedCoursesCount] = useState(0);
    const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
    const [upcomingLiveClasses, setUpcomingLiveClasses] = useState<LiveClassItem[]>([]);
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

        // Load settings for timezone
        const loadSettings = async () => {
            try {
                // Note: Timezone setting is available via getSettings() if needed for specific timezone formatting
                // For now, using browser's local time which is typically what users expect
                
                // Format date using browser's local time
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
            } catch (error) {
                console.error('Failed to load settings:', error);
                // Fallback to current date
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                });
                setCurrentDate(dateStr);
            }
        };

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

                    // Load upcoming live classes across assigned courses
                    const liveClassResults = await Promise.allSettled(
                        assignedCourses.map((course) => getLiveClassesByCourse(course.id))
                    );

                    const now = new Date();
                    const upcomingClasses: LiveClassItem[] = liveClassResults.flatMap((result, index) => {
                        if (result.status !== 'fulfilled') return [];
                        const payload = result.value;
                        const sessions: LiveClassSession[] = payload?.data || [];
                        const course = assignedCourses[index];

                        return sessions
                            .filter((session) => new Date(session.start_time) > now)
                            .map((session) => ({
                                ...session,
                                courseTitle: course?.title || 'Course',
                            }));
                    });

                    upcomingClasses.sort((a, b) => {
                        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                    });

                    setUpcomingLiveClasses(upcomingClasses);
                }
            } catch (error) {
                console.error('Failed to load courses:', error);
            }
        };

        loadSettings();
        loadCourses();
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
        <>
            {/* Scrollable Dashboard Content */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: { xs: 2, md: 4 },
                    scrollBehavior: 'smooth',
                }}
            >
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Hero / Welcome Section */}
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            bgcolor: '#ffffff',
                            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                            border: '1px solid #e7edf3',
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
                        ></Box>
                        <Box
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box component="p" sx={{ color: '#4c739a', fontWeight: 500, m: 0 }}>
                                    {currentDate}
                                </Box>
                                <Box
                                    component="h2"
                                    sx={{
                                        fontSize: { xs: '30px', md: '36px' },
                                        fontWeight: 700,
                                        color: '#0d141b',
                                        letterSpacing: '-0.025em',
                                        m: 0,
                                    }}
                                >
                                    {greeting}, {userName} 👋
                                </Box>
                                <Box component="p" sx={{ color: '#4c739a', mt: 1, maxWidth: '672px', m: 0 }}>
                                    {todayLiveCount > 0 ? (
                                        <>
                                            You have <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>{todayLiveCount} {liveClassLabel}</Box> and{' '}
                                            let's make it a productive day!
                                        </>
                                    ) : (
                                        <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                            {motivationalQuotes[quoteIndex]}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                {/* Decorative Illustration Placeholder */}
                                <Box
                                    sx={{
                                        height: '96px',
                                        width: '96px',
                                        background: `linear-gradient(to top right, ${alpha(theme.palette.primary.main, 0.2)}, #bfdbfe)`,
                                        borderRadius: '50%',
                                        filter: 'blur(48px)',
                                        position: 'absolute',
                                        right: '32px',
                                        top: '32px',
                                    }}
                                ></Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Stats Grid */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                            gap: { xs: 2, md: 3 },
                        }}
                    >
                        {/* Card 1 */}
                        <Box
                            sx={{
                                bgcolor: '#ffffff',
                                p: 3,
                                borderRadius: '16px',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                border: '1px solid #e7edf3',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: '12px', color: theme.palette.primary.main }}>
                                    <SchoolIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#059669',
                                        bgcolor: '#ecfdf5',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: '9999px',
                                    }}
                                >
                                    +1 New
                                </Box>
                            </Box>
                            <Box>
                                <Box component="p" sx={{ color: '#4c739a', fontSize: '14px', fontWeight: 500, m: 0 }}>
                                    Assigned Courses
                                </Box>
                                <Box component="h3" sx={{ fontSize: '30px', fontWeight: 700, color: '#0d141b', mt: 0.5, m: 0 }}>
                                    {assignedCoursesCount}
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    right: '-24px',
                                    bottom: '-24px',
                                    width: '96px',
                                    height: '96px',
                                    bgcolor: '#eff6ff',
                                    borderRadius: '50%',
                                    transition: 'transform 0.2s',
                                }}
                            ></Box>
                        </Box>

                        {/* Card 2 */}
                        <Box
                            sx={{
                                bgcolor: '#ffffff',
                                p: 3,
                                borderRadius: '16px',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                border: '1px solid #e7edf3',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ p: 1.5, bgcolor: '#eef2ff', borderRadius: '12px', color: '#6366f1' }}>
                                    <GroupsIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#059669',
                                        bgcolor: '#ecfdf5',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: '9999px',
                                    }}
                                >
                                    +12%
                                </Box>
                            </Box>
                            <Box>
                                <Box component="p" sx={{ color: '#4c739a', fontSize: '14px', fontWeight: 500, m: 0 }}>
                                    Total Students
                                </Box>
                                <Box component="h3" sx={{ fontSize: '30px', fontWeight: 700, color: '#0d141b', mt: 0.5, m: 0 }}>
                                    {totalEnrolledStudents}
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    right: '-24px',
                                    bottom: '-24px',
                                    width: '96px',
                                    height: '96px',
                                    bgcolor: '#eef2ff',
                                    borderRadius: '50%',
                                    transition: 'transform 0.2s',
                                }}
                            ></Box>
                        </Box>

                        {/* Card 3 */}
                        <Box
                            sx={{
                                bgcolor: '#ffffff',
                                p: 3,
                                borderRadius: '16px',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                border: '1px solid #e7edf3',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ p: 1.5, bgcolor: '#faf5ff', borderRadius: '12px', color: '#a855f7' }}>
                                    <ScheduleIcon sx={{ fontSize: 24 }} />
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#059669',
                                        bgcolor: '#ecfdf5',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: '9999px',
                                    }}
                                >
                                    +2.5 hrs
                                </Box>
                            </Box>
                            <Box>
                                <Box component="p" sx={{ color: '#4c739a', fontSize: '14px', fontWeight: 500, m: 0 }}>
                                    Hours Taught
                                </Box>
                                <Box component="h3" sx={{ fontSize: '30px', fontWeight: 700, color: '#0d141b', mt: 0.5, m: 0 }}>
                                    24.5
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    right: '-24px',
                                    bottom: '-24px',
                                    width: '96px',
                                    height: '96px',
                                    bgcolor: '#faf5ff',
                                    borderRadius: '50%',
                                    transition: 'transform 0.2s',
                                }}
                            ></Box>
                        </Box>
                    </Box>

                    {/* Content Row: Live Classes & Activity */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                            gap: 4,
                        }}
                    >
                        {/* Upcoming Live Classes (Takes up 2 cols) */}
                        <Box sx={{ gridColumn: { xs: '1', lg: 'span 2' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box component="h3" sx={{ fontSize: '20px', fontWeight: 700, color: '#0d141b', m: 0 }}>
                                    Upcoming Live Classes
                                </Box>
                                <Box
                                    component="a"
                                    href="#"
                                    sx={{
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: theme.palette.primary.main,
                                        textDecoration: 'none',
                                        '&:hover': { color: theme.palette.primary.dark },
                                    }}
                                >
                                    View All
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    bgcolor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                }}
                            >
                                {upcomingLiveClasses.length === 0 ? (
                                    <Box sx={{ p: 3, color: '#4c739a', fontSize: '14px' }}>
                                        No upcoming live classes yet.
                                    </Box>
                                ) : (
                                    upcomingLiveClasses.map((session, index) => {
                                        const start = new Date(session.start_time);
                                        const end = new Date(start.getTime() + (session.duration || 0) * 60000);
                                        const timeRange = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                                        const dateLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        const borderTop = index > 0 ? { borderTop: '1px solid #e7edf3' } : {};

                                        return (
                                            <Box
                                                key={session.id}
                                                sx={{
                                                    p: 2.5,
                                                    transition: 'background-color 0.2s',
                                                    '&:hover': { bgcolor: '#e7edf3' },
                                                    ...borderTop,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', sm: 'row' },
                                                        alignItems: { xs: 'flex-start', sm: 'center' },
                                                        justifyContent: 'space-between',
                                                        gap: 2,
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                        <Box
                                                            sx={{
                                                                height: '56px',
                                                                width: '56px',
                                                                borderRadius: '12px',
                                                                bgcolor: index % 2 === 0 ? '#fed7aa' : '#e0e7ff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: index % 2 === 0 ? '#ea580c' : '#4338ca',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <ScienceIcon sx={{ fontSize: 28 }} />
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                            <Box component="h4" sx={{ fontSize: '16px', fontWeight: 700, color: '#0d141b', m: 0 }}>
                                                                {session.title}
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, fontSize: '14px', color: '#4c739a', flexWrap: 'wrap' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                                    <span>{timeRange}</span>
                                                                </Box>
                                                                <Box sx={{ height: '4px', width: '4px', borderRadius: '50%', bgcolor: '#cbd5e1' }}></Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <PersonIcon sx={{ fontSize: 16 }} />
                                                                    <span>{session.courseTitle}</span>
                                                                </Box>
                                                                <Box sx={{ height: '4px', width: '4px', borderRadius: '50%', bgcolor: '#cbd5e1' }}></Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <ScheduleIcon sx={{ fontSize: 16 }} />
                                                                    <span>{dateLabel}</span>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    <Box
                                                        component="button"
                                                        sx={{
                                                            flexShrink: 0,
                                                            bgcolor: theme.palette.primary.main,
                                                            color: 'white',
                                                            px: 2.5,
                                                            py: 1.25,
                                                            borderRadius: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                                            '&:hover': { bgcolor: theme.palette.primary.dark, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
                                                            '&:active': { transform: 'scale(0.95)' },
                                                        }}
                                                    >
                                                        Start Class
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Box>

                        {/* Recent Activity (Takes up 1 col) */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box component="h3" sx={{ fontSize: '20px', fontWeight: 700, color: '#0d141b', m: 0 }}>
                                Recent Activity
                            </Box>
                            <Box
                                sx={{
                                    bgcolor: '#ffffff',
                                    border: '1px solid #e7edf3',
                                    borderRadius: '16px',
                                    p: 3,
                                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                    height: '100%',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                }}
                            >
                                <Box sx={{ position: 'relative', pl: 2, borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {/* Timeline Item 1 */}
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: '-21px',
                                                bgcolor: '#3b82f6',
                                                height: '12px',
                                                width: '12px',
                                                borderRadius: '50%',
                                                border: '2px solid white',
                                            }}
                                        ></Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box component="p" sx={{ fontSize: '14px', fontWeight: 500, color: '#0d141b', m: 0 }}>
                                                New Assignment Submission
                                            </Box>
                                            <Box component="p" sx={{ fontSize: '12px', color: '#4c739a', m: 0 }}>
                                                Sarah J. submitted <Box component="span" sx={{ color: '#334155', fontWeight: 500 }}>'Final Project'</Box> for Physics 101.
                                            </Box>
                                            <Box component="span" sx={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                2 mins ago
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Timeline Item 2 */}
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: '-21px',
                                                bgcolor: '#fb923c',
                                                height: '12px',
                                                width: '12px',
                                                borderRadius: '50%',
                                                border: '2px solid white',
                                            }}
                                        ></Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box component="p" sx={{ fontSize: '14px', fontWeight: 500, color: '#0d141b', m: 0 }}>
                                                System Alert
                                            </Box>
                                            <Box component="p" sx={{ fontSize: '12px', color: '#4c739a', m: 0 }}>
                                                Scheduled maintenance on Sunday at 12:00 AM UTC.
                                            </Box>
                                            <Box component="span" sx={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                1 hour ago
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Timeline Item 3 */}
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: '-21px',
                                                bgcolor: '#34d399',
                                                height: '12px',
                                                width: '12px',
                                                borderRadius: '50%',
                                                border: '2px solid white',
                                            }}
                                        ></Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box component="p" sx={{ fontSize: '14px', fontWeight: 500, color: '#0d141b', m: 0 }}>
                                                New Forum Comment
                                            </Box>
                                            <Box component="p" sx={{ fontSize: '12px', color: '#4c739a', m: 0 }}>
                                                Mark T. commented on <Box component="span" sx={{ color: '#334155', fontWeight: 500 }}>'Week 3 Discussion'</Box>.
                                            </Box>
                                            <Box component="span" sx={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                3 hours ago
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Timeline Item 4 */}
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: '-21px',
                                                bgcolor: '#c084fc',
                                                height: '12px',
                                                width: '12px',
                                                borderRadius: '50%',
                                                border: '2px solid white',
                                            }}
                                        ></Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box component="p" sx={{ fontSize: '14px', fontWeight: 500, color: '#0d141b', m: 0 }}>
                                                Course Update
                                            </Box>
                                            <Box component="p" sx={{ fontSize: '12px', color: '#4c739a', m: 0 }}>
                                                New syllabus uploaded for <Box component="span" sx={{ color: '#334155', fontWeight: 500 }}>MAT201</Box>.
                                            </Box>
                                            <Box component="span" sx={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Yesterday
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default Dashboard;
