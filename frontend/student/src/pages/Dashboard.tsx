import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Typography,
    Card,
    Button,
    LinearProgress,
    Chip,
    IconButton,
    useTheme,
    Link,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    School as SchoolIcon,
    AssignmentLate as AssignmentIcon,
    Leaderboard as LeaderboardIcon,
    Schedule as ScheduleIcon,
    ArrowForward as ArrowForwardIcon,
    MoreVert as MoreVertIcon,
    CalendarMonth as CalendarIcon,
    VideoCameraFront as VideoIcon,
    SupportAgent as SupportIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { enrollmentService, EnrolledCourse } from '../services/enrollmentService';
import courseService from '../services/courseService';
import apiClient from '../services/apiClient';


// --- Types ---
interface LiveClass {
    id: number;
    course_id: number;
    title: string;
    time: string;
    day: 'Today' | 'Tmrw';
    date: number;
    isNow?: boolean;
    lesson?: {
        id: number;
        title: string;
    };
}

interface Announcement {
    id: number;
    title: string;
    description: string;
    time: string;
    isPrimary?: boolean;
}

// --- Mock Data (Announcements - not implemented in backend) ---

const announcements: Announcement[] = [
    { id: 1, title: 'Mid-term Exam Schedule Released', description: 'The schedule for the upcoming mid-terms has been finalized. Please check the exam portal for your specific dates.', time: '2 hours ago', isPrimary: true },
    { id: 2, title: 'Library Maintenance', description: 'The digital library will be undergoing scheduled maintenance this Sunday from 2 AM to 4 AM.', time: 'Yesterday' },
];

const Dashboard: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState('Student');
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [stats, setStats] = useState({
        coursesInProgress: 0,
        assignmentsDue: 0,
        averageGrade: 0,
        studyHours: 0,
    });

    // Fetch user data and enrolled courses
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get user from localStorage
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student';
                    setUserName(fullName);
                }

                // Fetch enrolled courses
                let courses: EnrolledCourse[] = [];
                try {
                    courses = await enrollmentService.getMyEnrollments();
                } catch (apiErr) {
                    console.warn('Could not fetch courses:', apiErr);
                }
                
                setEnrolledCourses(courses || []);

                // Fetch live classes
                try {
                    const [enrollmentsRes, liveClassesRes] = await Promise.all([
                        enrollmentService.getMyEnrollments(),
                        apiClient.get('/live-classes/all')
                    ]);
                    
                    const enrolledCourseIds = enrollmentsRes.map((e: EnrolledCourse) => e.course_id);
                    
                    if (liveClassesRes.data.status === 'success') {
                        const allClasses = liveClassesRes.data.data;
                        const filteredClasses = allClasses.filter((cls: any) => 
                            enrolledCourseIds.includes(cls.course_id)
                        );
                        
                        // Transform to display format
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        const now = new Date();
                        
                        const transformedLiveClasses: LiveClass[] = filteredClasses.slice(0, 3).map((cls: any) => {
                            const classDate = new Date(cls.start_time);
                            const isToday = classDate.toDateString() === today.toDateString();
                            const isTomorrow = classDate.toDateString() === tomorrow.toDateString();
                            const isNow = classDate <= now && new Date(classDate.getTime() + cls.duration * 60000) >= now;
                            
                            return {
                                id: cls.id,
                                course_id: cls.course_id,
                                title: cls.title,
                                time: classDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(classDate.getTime() + cls.duration * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                day: isToday ? 'Today' : isTomorrow ? 'Tmrw' : 'Today',
                                date: classDate.getDate(),
                                isNow: isNow,
                                lesson: cls.lesson || null
                            };
                        });
                        
                        setLiveClasses(transformedLiveClasses);
                    }
                } catch (liveErr) {
                    console.warn('Could not fetch live classes:', liveErr);
                }

                // Calculate stats
                const activeCourses = (courses || []).filter(c => c.status === 'active');
                const totalProgress = (courses || []).reduce((sum, c) => sum + c.progress_percentage, 0);
                const avgGrade = (courses || []).length > 0 ? Math.round(totalProgress / (courses || []).length) : 0;

                setStats({
                    coursesInProgress: activeCourses.length,
                    assignmentsDue: 3,
                    averageGrade: avgGrade,
                    studyHours: 12,
                });
                setError(null);
            } catch (err: any) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getCourseColor = (progress: number) => {
        if (progress >= 80) return 'success';
        if (progress >= 50) return 'warning';
        return 'primary';
    };

    if (loading) {
        return (
            <Box component="main" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box component="main" sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <Typography variant="h6" sx={{ color: 'error.main', mb: 2 }}>
                    {error}
                </Typography>
                <Button variant="contained" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Box>
        );
    }

    return (

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3, lg: 4 }, maxWidth: 1440, mx: 'auto', width: '100%' }}>
            {/* Welcome Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: 3, mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                        Welcome back, {userName}! 👋
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', fontSize: '1.125rem' }}>
                        You have {stats.coursesInProgress} courses in progress and {stats.assignmentsDue} assignments due this week.
                    </Typography>
                </Box>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 6 }}>
                {[
                    { label: 'Courses in Progress', value: stats.coursesInProgress.toString(), icon: <SchoolIcon />, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.1) },
                    { label: 'Assignments Due', value: stats.assignmentsDue.toString(), icon: <AssignmentIcon />, color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.1) },
                    { label: 'Average Grade', value: `${stats.averageGrade}%`, icon: <LeaderboardIcon />, color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.1) },
                    { label: 'Study Hours', value: `${stats.studyHours}h`, icon: <ScheduleIcon />, color: '#a855f7', bg: alpha('#a855f7', 0.1) },
                ].map((stat, index) => (
                    <Grid item xs={6} md={3} key={index}>
                        <Card
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    {stat.label}
                                </Typography>
                                <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: stat.bg, color: stat.color, display: 'flex' }}>
                                    {React.cloneElement(stat.icon as any, { fontSize: 'small' })}
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {stat.value}
                            </Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Main Content Grid */}
            <Grid container spacing={4} alignItems="flex-start">
                {/* Left Column: My Courses */}
                <Grid item xs={12} xl={8}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            My Courses
                        </Typography>
                        <Link href="#" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                            View all <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </Link>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {enrolledCourses.length === 0 ? (
                            <Card elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider, textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                                    No enrolled courses yet
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                                    Browse our catalog to start learning!
                                </Typography>
                            </Card>
                        ) : (
                            enrolledCourses.map((course) => (
                                <Card
                                    key={course.enrollment_id}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.shadows[4],
                                            borderColor: alpha(theme.palette.primary.main, 0.2)
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                                        {/* Course Image */}
                                        <Box
                                            sx={{
                                                width: { xs: '100%', md: 240 },
                                                height: 160,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                position: 'relative',
                                                flexShrink: 0,
                                                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
                                            }}
                                        >
                                            {course.thumbnail ? (
                                                <Box
                                                    component="img"
                                                    src={courseService.getThumbnailUrl(course.thumbnail) || undefined}
                                                    alt={course.title}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                                                </Box>
                                            )}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    bgcolor: 'rgba(255,255,255,0.9)',
                                                    backdropFilter: 'blur(4px)',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    color: 'text.primary',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {course.category || 'Course'}
                                            </Box>
                                        </Box>

                                        {/* Content */}
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 0.5 }}>
                                            <Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.125rem' }}>
                                                        {course.title}
                                                    </Typography>
                                                    <IconButton size="small" sx={{ color: 'text.disabled' }}>
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                    {course.instructors || 'Instructor'} • {course.total_lessons} Lessons
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Progress</Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>{course.progress_percentage}%</Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={course.progress_percentage}
                                                        color={getCourseColor(course.progress_percentage) as any}
                                                        sx={{ height: 8, borderRadius: 4, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                                                    />
                                                </Box>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Chip 
                                                        label={course.status} 
                                                        size="small" 
                                                        color={course.status === 'completed' ? 'success' : course.status === 'active' ? 'primary' : 'default'}
                                                        sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                                                    />

                                                    <Button
                                                        variant={course.progress_percentage > 0 ? 'contained' : 'outlined'}
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => navigate(`/course/${course.course_id}/learn`)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: 2,
                                                            px: 3,
                                                            fontWeight: 600,
                                                            bgcolor: course.progress_percentage > 0 ? theme.palette.primary.main : 'transparent',
                                                            '&:hover': { bgcolor: course.progress_percentage > 0 ? theme.palette.primary.dark : 'rgba(43, 140, 238, 0.04)' }
                                                        }}
                                                    >
                                                        {course.progress_percentage > 0 ? 'Resume' : 'Start'}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Card>
                            ))
                        )}
                    </Box>
                </Grid>

                {/* Right Column: Widgets */}
                <Grid item xs={12} xl={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

                        {/* Upcoming Live Classes */}
                        <Card
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: theme.palette.divider
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.125rem' }}>
                                    Upcoming Live Classes
                                </Typography>
                                <IconButton size="small" sx={{ color: 'text.disabled' }} onClick={() => navigate('/live-sessions')}>
                                    <CalendarIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {liveClasses.map((liveClass, i) => (
                                    <React.Fragment key={liveClass.id}>
                                        <Box
                                            onClick={() => navigate(liveClass.lesson ? `/course/${liveClass.course_id}/player/${liveClass.lesson.id}` : `/course/${liveClass.course_id}/learn`)}
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                opacity: liveClass.day === 'Tmrw' ? 0.7 : 1,
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 1, '& h2': { color: theme.palette.primary.main } }
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 56,
                                                    height: 58,
                                                    borderRadius: 2,
                                                    bgcolor: liveClass.day === 'Today' ? alpha(theme.palette.primary.main, 0.1) : theme.palette.action.hover,
                                                    color: liveClass.day === 'Today' ? theme.palette.primary.main : 'text.secondary',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                                    {liveClass.day}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                    {liveClass.date}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ flex: 1 }}>
                                                <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', transition: 'color 0.2s' }}>
                                                    {liveClass.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                                    {liveClass.time}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(liveClass.lesson ? `/course/${liveClass.course_id}/player/${liveClass.lesson.id}` : `/course/${liveClass.course_id}/learn`);
                                                }}
                                                sx={{ 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: 600,
                                                    py: 0.5,
                                                    px: 1.5,
                                                    height: 'fit-content',
                                                    alignSelf: 'center',
                                                }}
                                            >
                                                {liveClass.isNow ? 'Join Now' : 'Join Class'}
                                            </Button>
                                        </Box>
                                        {i < liveClasses.length - 1 && <Box sx={{ height: 1, bgcolor: theme.palette.divider }} />}
                                    </React.Fragment>
                                ))}
                            </Box>
                        </Card>

                        {/* Announcements */}
                        <Card
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: theme.palette.divider
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.125rem' }}>
                                    Announcements
                                </Typography>
                                <Link href="#" underline="hover" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>See all</Link>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {announcements.map((announcement) => (
                                    <Box
                                        key={announcement.id}
                                        sx={{
                                            pl: 2,
                                            borderLeft: '2px solid',
                                            borderColor: announcement.isPrimary ? theme.palette.primary.main : theme.palette.divider,
                                            position: 'relative'
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3, mb: 0.5 }}>
                                            {announcement.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {announcement.description}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontSize: '0.65rem' }}>
                                            {announcement.time}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Card>

                        {/* Support Banner */}
                        <Box
                            sx={{
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                borderRadius: 3,
                                p: 3,
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Need Help?</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2.5, maxWidth: '80%' }}>
                                    Check our knowledge base or contact support.
                                </Typography>
                                <Button
                                    size="small"
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'white',
                                        color: theme.palette.primary.main,
                                        fontWeight: 700,
                                        '&:hover': { bgcolor: alpha('#fff', 0.9) }
                                    }}
                                >
                                    Contact Support
                                </Button>
                            </Box>

                            {/* Decorations */}
                            <Box sx={{ position: 'absolute', bottom: -32, right: -32, width: 128, height: 128, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                            <SupportIcon sx={{ position: 'absolute', top: 16, right: 16, fontSize: 48, opacity: 0.2 }} />
                        </Box>

                    </Box>
                </Grid>
            </Grid>
        </Box>

    );
};

export default Dashboard;
