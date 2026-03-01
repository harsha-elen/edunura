'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    InputBase,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Dashboard as DashboardIcon,
    MenuBook as CoursesIcon,
    Videocam as VideocamIcon,
    CalendarMonth as CalendarIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    School as SchoolIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getSettings } from '@/services/settings';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';

const drawerWidth = 260;

interface TeacherLayoutComponentProps {
    children: React.ReactNode;
}

const TeacherLayoutComponent: React.FC<TeacherLayoutComponentProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [siteName, setSiteName] = useState(
        typeof window !== 'undefined' ? localStorage.getItem('site_name') || 'EduPro LMS' : 'EduPro LMS'
    );
    const [orgLogo, setOrgLogo] = useState<string | null>(
        typeof window !== 'undefined' ? localStorage.getItem('org_logo') : null
    );
    const [logoError, setLogoError] = useState(false);

    const [user, setUser] = useState<{
        first_name: string;
        last_name: string;
        email: string;
        avatar: string | null;
        role: string;
    } | null>(null);

    // Helper to check if path is active
    const isActive = (path: string) => pathname === path;

    useEffect(() => {
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

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    // Teacher menu items with updated paths
    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 22 }} />, path: '/teacher' },
        { text: 'My Courses', icon: <CoursesIcon sx={{ fontSize: 22 }} />, path: '/teacher/courses' },
        { text: 'Live Classes', icon: <VideocamIcon sx={{ fontSize: 22 }} />, path: '/teacher/live-classes' },
        { text: 'Calendar', icon: <CalendarIcon sx={{ fontSize: 22 }} />, path: '/teacher/calendar' },
    ];

    const drawer = (
        <Box
            sx={{
                height: '100%',
                bgcolor: '#ffffff',
                borderRight: '1px solid #e7edf3',
                display: 'flex',
                flexDirection: 'column',
                p: 3,
            }}
        >
            {/* Logo Area */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                {orgLogo && !logoError ? (
                    <Box
                        component="img"
                        src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`}
                        alt={siteName}
                        onError={() => setLogoError(true)}
                        sx={{
                            width: '80%',
                            height: 'auto',
                            objectFit: 'contain',
                            objectPosition: 'left center',
                            display: 'block',
                        }}
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
                        <Box>
                            <Typography
                                component="h1"
                                sx={{
                                    fontSize: '18px',
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    color: '#0d141b',
                                    m: 0,
                                }}
                            >
                                {siteName}
                            </Typography>
                            <Typography
                                component="p"
                                sx={{
                                    fontSize: '12px',
                                    fontWeight: 400,
                                    color: '#4c739a',
                                    mt: 0.5,
                                    m: 0,
                                }}
                            >
                                Instructor Portal
                            </Typography>
                        </Box>
                    </>
                )}
            </Box>

            {/* Navigation Links */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                {menuItems.map((item) => (
                    <Box
                        key={item.path}
                        component={Link}
                        href={item.path}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1.5,
                            py: 1.25,
                            borderRadius: 2,
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            ...(isActive(item.path)
                                ? {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                }
                                : {
                                    color: '#0d141b',
                                    '&:hover': { bgcolor: '#e7edf3' },
                                }),
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.icon}
                        </Box>
                        <Typography component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>
                            {item.text}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Bottom Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto' }}>
                <Box sx={{ height: '1px', width: '100%', bgcolor: '#e7edf3' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Profile Link */}
                    <Box
                        component={Link}
                        href="/teacher/profile"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1.5,
                            py: 1.25,
                            borderRadius: 2,
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            ...(isActive('/teacher/profile')
                                ? {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                }
                                : {
                                    color: '#0d141b',
                                    '&:hover': { bgcolor: '#e7edf3' },
                                }),
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 22 }} />
                        <Typography component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>
                            Profile
                        </Typography>
                    </Box>

                    {/* Logout Button */}
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
                        <Typography component="span" sx={{ fontSize: '14px', fontWeight: 500 }}>
                            Log Out
                        </Typography>
                    </Box>
                </Box>

                {/* User Profile Card */}
                <Box
                    component={Link}
                    href="/teacher/profile"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1,
                        py: 1,
                        cursor: 'pointer',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                        '&:hover': { bgcolor: '#e7edf3' },
                    }}
                >
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={
                                user?.avatar
                                    ? `${STATIC_ASSETS_BASE_URL}${user.avatar}`
                                    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcBNNhqjL6hE4XAh-ip9Qi7ICfsKuPqlsnB3uswgkOSzZRrRsStrYusJUm4TyCXZVkcR5vj9VsLvDtKKeRmbZKYGQsos5WRW8D_3gibEwGYyrX9hYgB5-HR8agp11CtpSC4GR1azHbp9m9keBqXkzFE4q9XuRCybw6KKZv4iuL8nYj9Z9m-2n1cwESYwSRCQWWT_84JB8xuHFlC4huOgxXekrweXNYKZFRz5LvJLZaglO3qEn6a83phpkSdB3Li9dofNgxRjWZODr1'
                            }
                            alt="Profile Avatar"
                            sx={{
                                height: '40px',
                                width: '40px',
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
                        />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', color: '#0d141b' }}>
                        <Typography component="p" sx={{ fontSize: '14px', fontWeight: 500, m: 0 }}>
                            {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                        </Typography>
                        <Typography
                            component="p"
                            sx={{
                                fontSize: '12px',
                                color: '#4c739a',
                                m: 0,
                            }}
                        >
                            {user ? user.role : ''}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
            {/* Desktop Sidebar */}
            <Box
                component="aside"
                sx={{
                    display: { xs: 'none', lg: 'flex' },
                    flexDirection: 'column',
                    width: `${drawerWidth}px`,
                    height: '100%',
                    bgcolor: '#ffffff',
                    borderRight: '1px solid #e7edf3',
                    flexShrink: 0,
                    transition: 'colors 0.2s',
                }}
            >
                {drawer}
            </Box>

            {/* Mobile Drawer */}
            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                    },
                }}
            >
                {drawer}
            </Drawer>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    overflowY: 'auto',
                    bgcolor: '#f6f7f8',
                    position: 'relative',
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
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
                        onClick={handleDrawerToggle}
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

                    {/* Search Bar */}
                    <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', maxWidth: '640px' }}>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '448px',
                                display: { xs: 'none', md: 'block' },
                            }}
                        >
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
                            <InputBase
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
                                    },
                                    '&::placeholder': {
                                        color: '#4c739a',
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Header Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
                        {/* Notifications Button */}
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
                            />
                        </Box>

                        {/* Create Class Button */}
                        <Box
                            component="button"
                            onClick={() => router.push('/teacher/live-classes')}
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

                {/* Page Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', overflow: 'hidden' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default TeacherLayoutComponent;
