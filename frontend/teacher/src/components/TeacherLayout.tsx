import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    School as SchoolIcon,
    Dashboard as DashboardIcon,
    MenuBook as CoursesIcon,
    Videocam as VideocamIcon,
    Groups as GroupsIcon,
    AssignmentTurnedIn as GradingIcon,
    CalendarMonth as CalendarIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { getSettings } from '../services/settings';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';

const TeacherLayout: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    // Load site name from localStorage first, fallback to default
    const [siteName, setSiteName] = useState(localStorage.getItem('site_name') || 'EduPro LMS');
    const [orgLogo, setOrgLogo] = useState<string | null>(localStorage.getItem('org_logo') || null);
    const [logoError, setLogoError] = useState(false);

    // Load user data from localStorage
    const [user, setUser] = useState<{
        first_name: string;
        last_name: string;
        email: string;
        avatar: string | null;
        role: string;
    } | null>(null);

    // Helper function to check if a path is active
    const isActive = (path: string) => location.pathname === path;

    useEffect(() => {
        // Load user data from localStorage
        const loadUserData = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    setUser(userData);
                } catch (error) {
                    console.error('Failed to parse user data:', error);
                }
            }
        };

        loadUserData();

        // Listen for userUpdated event (when profile is updated)
        window.addEventListener('userUpdated', loadUserData);

        return () => {
            window.removeEventListener('userUpdated', loadUserData);
        };
    }, []);

    useEffect(() => {
        const loadBranding = async () => {
            try {
                const response = await getSettings();
                if (response.data) {
                    if (response.data.site_name) {
                        setSiteName(response.data.site_name);
                        localStorage.setItem('site_name', response.data.site_name);
                    }
                    if (response.data.org_logo) {
                        setOrgLogo(response.data.org_logo);
                        localStorage.setItem('org_logo', response.data.org_logo);
                        setLogoError(false);
                    }
                }
            } catch (error) {
                console.error('Failed to load branding:', error);
            }
        };
        loadBranding();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
            {/* Sidebar Navigation */}
            <Box
                component="aside"
                sx={{
                    display: { xs: 'none', lg: 'flex' },
                    flexDirection: 'column',
                    width: '260px',
                    height: '100%',
                    bgcolor: '#ffffff',
                    borderRight: '1px solid #e7edf3',
                    flexShrink: 0,
                    transition: 'colors 0.2s',
                }}
            >
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    {/* Logo & Nav */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* Logo */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {orgLogo && !logoError ? (
                                <Box
                                    component="img"
                                    src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`}
                                    alt={siteName}
                                    onError={() => setLogoError(true)}
                                    sx={{ width: '100%', maxHeight: 48, objectFit: 'contain' }}
                                />
                            ) : (
                                <>
                                    <Box
                                        sx={{
                                            bgcolor: theme.palette.primary.main,
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <SchoolIcon sx={{ fontSize: 24 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Box component="h1" sx={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.2, color: '#0d141b', m: 0 }}>
                                            {siteName}
                                        </Box>
                                        <Box component="p" sx={{ fontSize: '12px', fontWeight: 400, color: '#4c739a', mt: 0, m: 0 }}>
                                            Instructor Portal
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Box>

                        {/* Navigation Links */}
                        <Box component="nav" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Dashboard */}
                            <Box
                                component={RouterLink}
                                to="/dashboard"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    ...(isActive('/dashboard') ? {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                    } : {
                                        color: '#0d141b',
                                        '&:hover': { bgcolor: '#e7edf3' },
                                    }),
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <DashboardIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>Dashboard</Box>
                            </Box>

                            {/* Courses */}
                            <Box
                                component={RouterLink}
                                to="/courses"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    ...(isActive('/courses') ? {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                    } : {
                                        color: '#0d141b',
                                        '&:hover': { bgcolor: '#e7edf3' },
                                    }),
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <CoursesIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>My Courses</Box>
                            </Box>

                            {/* Live Classes */}
                            <Box
                                component={RouterLink}
                                to="/live-classes"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    ...(isActive('/live-classes') ? {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                    } : {
                                        color: '#0d141b',
                                        '&:hover': { bgcolor: '#e7edf3' },
                                    }),
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <VideocamIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>Live Classes</Box>
                            </Box>

                            {/* Students */}
                            <Box
                                component="a"
                                href="#"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    color: '#0d141b',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: '#e7edf3' },
                                }}
                            >
                                <GroupsIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>Students</Box>
                            </Box>

                            {/* Grading */}
                            <Box
                                component="a"
                                href="#"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    color: '#0d141b',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: '#e7edf3' },
                                }}
                            >
                                <GradingIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>Grading</Box>
                            </Box>

                            {/* Calendar */}
                            <Box
                                component={RouterLink}
                                to="/calendar"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    ...(isActive('/calendar') ? {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                    } : {
                                        color: '#0d141b',
                                        '&:hover': { bgcolor: '#e7edf3' },
                                    }),
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <CalendarIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>Calendar</Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Bottom Actions */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto' }}>
                        <Box sx={{ height: '1px', width: '100%', bgcolor: '#e7edf3' }}></Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* Profile */}
                            <Box
                                component={RouterLink}
                                to="/profile"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    ...(isActive('/profile') ? {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                    } : {
                                        color: '#0d141b',
                                        '&:hover': { bgcolor: '#e7edf3' },
                                    }),
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>Profile</Box>
                            </Box>

                            <Box
                                component="button"
                                onClick={handleLogout}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1.5,
                                    py: 1.25,
                                    borderRadius: 2,
                                    color: '#ef4444',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    bgcolor: 'transparent',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: '#fef2f2' },
                                }}
                            >
                                <LogoutIcon sx={{ fontSize: 22 }} />
                                <Box component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>Log Out</Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 1, cursor: 'pointer', borderRadius: 2, transition: 'all 0.2s', '&:hover': { bgcolor: '#e7edf3' } }} component={RouterLink} to="/profile">
                            <Box sx={{ position: 'relative' }}>
                                <Box
                                    component="img"
                                    src={user?.avatar ? `${STATIC_ASSETS_BASE_URL}${user.avatar}` : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcBNNhqjL6hE4XAh-ip9Qi7ICfsKuPqlsnB3uswgkOSzZRrRsStrYusJUm4TyCXZVkcR5vj9VsLvDtKKeRmbZKYGQsos5WRW8D_3gibEwGYyrX9hYgB5-HR8agp11CtpSC4GR1azHbp9m9keBqXkzFE4q9XuRCybw6KKZv4iuL8nYj9Z9m-2n1cwESYwSRCQWWT_84JB8xuHFlC4huOgxXekrweXNYKZFRz5LvJLZaglO3qEn6a83phpkSdB3Li9dofNgxRjWZODr1'}
                                    alt="Profile Avatar"
                                    sx={{
                                        height: '40px',
                                        width: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '2px solid white',
                                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        height: '12px',
                                        width: '12px',
                                        borderRadius: '50%',
                                        bgcolor: '#10b981',
                                        border: '2px solid white',
                                    }}
                                ></Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Box component="p" sx={{ fontSize: '14px', fontWeight: 500, color: '#0d141b', m: 0 }}>
                                    {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                                </Box>
                                <Box component="p" sx={{ fontSize: '12px', color: '#4c739a', m: 0 }}>
                                    {user ? user.role : ''}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', bgcolor: '#f6f7f8', position: 'relative' }}>
                {/* Header */}
                <Box
                    component="header"
                    sx={{
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 4,
                        py: 2,
                        bgcolor: '#ffffff',
                        borderBottom: '1px solid #e7edf3',
                        flexShrink: 0,
                        zIndex: 20,
                    }}
                >
                    {/* Mobile Menu Toggle */}
                    <Box
                        component="button"
                        sx={{
                            display: { xs: 'block', lg: 'none' },
                            p: 1,
                            ml: -1,
                            color: '#4c739a',
                            border: 'none',
                            bgcolor: 'transparent',
                            cursor: 'pointer',
                        }}
                    >
                        <MenuIcon sx={{ fontSize: 20 }} />
                    </Box>

                    <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', maxWidth: '640px' }}>
                        <Box sx={{ position: 'relative', width: '100%', maxWidth: '448px', display: { xs: 'none', md: 'block' } }}>
                            <SearchIcon
                                sx={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '20px',
                                    color: '#4c739a',
                                }}
                            />
                            <Box
                                component="input"
                                type="text"
                                placeholder="Search courses, students, or resources..."
                                sx={{
                                    width: '100%',
                                    pl: '40px',
                                    pr: 2,
                                    py: 1,
                                    bgcolor: '#e7edf3',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#0d141b',
                                    '&:focus': {
                                        outline: 'none',
                                        ring: `2px solid ${theme.palette.primary.main}`,
                                    },
                                    '&::placeholder': {
                                        color: '#4c739a',
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            component="button"
                            sx={{
                                position: 'relative',
                                p: 1,
                                color: '#4c739a',
                                border: 'none',
                                bgcolor: 'transparent',
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                '&:hover': { color: theme.palette.primary.main },
                            }}
                        >
                            <NotificationsIcon sx={{ fontSize: 20 }} />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    height: '8px',
                                    width: '8px',
                                    bgcolor: '#ef4444',
                                    borderRadius: '50%',
                                }}
                            ></Box>
                        </Box>
                        <Box
                            component="button"
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                                px: 2,
                                py: 1,
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                '&:hover': {
                                    bgcolor: theme.palette.primary.dark,
                                },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 18 }} />
                            <span>Create Class</span>
                        </Box>
                    </Box>
                </Box>

                <Outlet />
            </Box>
        </Box>
    );
};

export default TeacherLayout;
