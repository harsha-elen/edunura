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
    Button,
    InputBase,
    useTheme,
    Badge,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Menu as MenuIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    ExpandMore as ExpandMoreIcon,
    School as SchoolIcon,
    Dashboard as DashboardIcon,
    Book as BookIcon,
    CalendarMonth as CalendarIcon,
    Settings as SettingsIcon,
    Help as HelpIcon,
    VideoCameraFront as LiveIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getSettings } from '../services/settings';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';
import { LayoutContextType } from './Layout';

const drawerWidth = 260;

const StudentLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    // Load site name from localStorage first, fallback to default
    const [siteName, setSiteName] = useState(localStorage.getItem('site_name') || 'LMS Portal');
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
        navigate('/login');
    };

    // Student menu items
    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 22 }} />, path: '/dashboard' },
        { text: 'My Courses', icon: <BookIcon sx={{ fontSize: 22 }} />, path: '/my-courses' },
        { text: 'Calendar', icon: <CalendarIcon sx={{ fontSize: 22 }} />, path: '/calendar' },
        { text: 'Live Classes', icon: <LiveIcon sx={{ fontSize: 22 }} />, path: '/live-sessions' },
        { text: 'Settings', icon: <SettingsIcon sx={{ fontSize: 22 }} />, path: '/profile', divider: true },
        { text: 'Help & Support', icon: <HelpIcon sx={{ fontSize: 22 }} />, path: '/help' },
    ];

    const drawer = (
        <Box sx={{ height: '100%', bgcolor: '#ffffff', borderRight: '1px solid #e7edf3', display: 'flex', flexDirection: 'column' }}>
            {/* Logo Area */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                        <Box sx={{
                            width: 40,
                            height: 40,
                            bgcolor: theme.palette.primary.main,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}>
                            <SchoolIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0d141b', lineHeight: 1.2 }}>{siteName}</Typography>
                            <Typography variant="caption" sx={{ color: '#4c739a', fontWeight: 400 }}>Student Portal</Typography>
                        </Box>
                    </>
                )}
            </Box>

            {/* Navigation */}
            <Box sx={{ px: 2, flex: 1, overflowY: 'auto' }}>
                <List>
                    {menuItems.map((item) => {
                        const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        return (
                            <React.Fragment key={item.text}>
                                {item.divider && <Divider sx={{ my: 2, borderColor: '#e7edf3' }} />}
                                <ListItem disablePadding sx={{ mb: 1 }}>
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            borderRadius: 2,
                                            py: 1.25,
                                            px: 1.5,
                                            bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                            color: active ? theme.palette.primary.main : '#0d141b',
                                            '&:hover': {
                                                bgcolor: active ? alpha(theme.palette.primary.main, 0.15) : '#e7edf3',
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, color: active ? theme.palette.primary.main : '#0d141b' }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            </React.Fragment>
                        );
                    })}
                </List>
            </Box>

            {/* CTA Button */}
            <Box sx={{ p: 2, mt: 'auto' }}>
                <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: `0 4px 6px -1px ${alpha(theme.palette.primary.main, 0.5)}`,
                        py: 1.25,
                        borderRadius: 2,
                        '&:hover': {
                            bgcolor: theme.palette.primary.dark
                        }
                    }}
                >
                    Browse Courses
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f6f7f8', minHeight: '100vh', fontFamily: '"Lexend", sans-serif' }}>
            {/* AppBar / Header */}
            <AppBar
                position="fixed"
                color="default"
                elevation={0}
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: '#ffffff',
                    borderBottom: '1px solid #e7edf3',
                    height: 64,
                    justifyContent: 'center'
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', px: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ color: '#0d141b', fontWeight: 700, fontSize: '1.25rem' }}>
                            Student Portal
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {/* Search */}
                        <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
                            <Box sx={{ position: 'absolute', pointerEvents: 'none', display: 'flex', alignItems: 'center', pl: 1.5, height: '100%', color: '#4c739a' }}>
                                <SearchIcon fontSize="small" />
                            </Box>
                            <InputBase
                                placeholder="Search courses..."
                                sx={{
                                    bgcolor: '#e7edf3',
                                    borderRadius: 2,
                                    pl: 5,
                                    pr: 2,
                                    py: 0.5,
                                    width: 250,
                                    fontSize: '0.875rem',
                                    color: '#0d141b',
                                    '& .MuiInputBase-input::placeholder': {
                                        color: '#4c739a',
                                        opacity: 1
                                    }
                                }}
                            />
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton sx={{ bgcolor: 'transparent', color: '#0d141b', '&:hover': { bgcolor: '#e7edf3' } }}>
                                <Box sx={{ position: 'relative', display: 'flex' }}>
                                    <Badge variant="dot" color="error" overlap="circular">
                                        <NotificationsIcon />
                                    </Badge>
                                </Box>
                            </IconButton>
                            <Divider orientation="vertical" flexItem sx={{ height: 32, borderColor: '#e7edf3', my: 'auto' }} />
                            <Box
                                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                                onClick={handleMenu}
                            >
                                <Avatar
                                    src={user?.avatar ? `${STATIC_ASSETS_BASE_URL}${user.avatar}` : undefined}
                                    alt={user?.first_name || 'Student'}
                                    sx={{ width: 36, height: 36, border: '2px solid white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                                >
                                    {user?.first_name?.charAt(0) || 'S'}
                                </Avatar>
                                <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#0d141b' }}>
                                        {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#4c739a', display: 'block', textTransform: 'capitalize' }}>
                                        Student
                                    </Typography>
                                </Box>
                                <ExpandMoreIcon sx={{ color: '#4c739a' }} />
                            </Box>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                keepMounted
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Profile</MenuItem>
                                <MenuItem onClick={() => { handleClose(); navigate('/my-courses'); }}>My Courses</MenuItem>
                                <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>Settings</MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content Area where child routes render */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 4,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: 8 // Height of AppBar
                }}
            >
                <Outlet context={{ mobileOpen, handleDrawerToggle } satisfies LayoutContextType} />
            </Box>
        </Box>
    );
};

export default StudentLayout;
