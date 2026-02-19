import React from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    InputBase,
    IconButton,
    Badge,
    Avatar,
    useTheme,
    Button,
    Link,
} from '@mui/material';
import {
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    ChatBubble as ChatBubbleIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface HeaderProps {
    onMenuClick?: () => void;
    showMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuButton }) => {
    const theme = useTheme();

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: 'background.paper',
                borderBottom: `1px solid ${theme.palette.divider}`,
                zIndex: theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar sx={{ px: { xs: 2, md: 3, lg: 4 }, height: 72, justifyContent: 'space-between' }}>
                {/* Logo & Nav Links */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Mobile Menu Button */}
                    <Box sx={{ display: { lg: 'none' }, mr: 1 }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={onMenuClick}
                            sx={{ display: showMenuButton ? 'flex' : 'none', color: 'text.primary' }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Logo SVG */}
                        <Box sx={{ width: 32, height: 32, color: theme.palette.primary.main }}>
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.015em', color: 'text.primary' }}>
                            LMS Portal
                        </Typography>
                    </Box>

                    {/* Desktop Navigation */}
                    <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 4 }}>
                        <Link href="#" underline="none" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.875rem', '&:hover': { color: theme.palette.primary.main } }}>
                            Dashboard
                        </Link>
                        <Link href="#" underline="none" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem', '&:hover': { color: theme.palette.primary.main } }}>
                            My Courses
                        </Link>
                        <Link href="#" underline="none" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem', '&:hover': { color: theme.palette.primary.main } }}>
                            Calendar
                        </Link>
                        <Link href="#" underline="none" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem', '&:hover': { color: theme.palette.primary.main } }}>
                            Grades
                        </Link>
                        <Link href="#" underline="none" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem', '&:hover': { color: theme.palette.primary.main } }}>
                            Library
                        </Link>
                    </Box>
                </Box>

                {/* Right Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
                    {/* Search - Desktop */}
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            alignItems: 'center',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                            borderRadius: 2,
                            px: 1.5,
                            height: 40,
                            width: 260,
                        }}
                    >
                        <SearchIcon sx={{ color: 'text.disabled', fontSize: 20, mr: 1 }} />
                        <InputBase
                            placeholder="Search courses..."
                            sx={{ fontSize: '0.875rem', color: 'text.primary', width: '100%' }}
                        />
                    </Box>

                    {/* Icons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton sx={{ color: 'text.secondary', p: 1, '&:hover': { bgcolor: theme.palette.action.hover } }}>
                            <Badge variant="dot" color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { border: `2px solid ${theme.palette.background.paper}` } }}>
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                        <IconButton sx={{ color: 'text.secondary', p: 1, '&:hover': { bgcolor: theme.palette.action.hover } }}>
                            <ChatBubbleIcon />
                        </IconButton>
                    </Box>

                    {/* Profile */}
                    <Avatar
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQvffq99MOnSEeN2vUJA9az59EH__Bqcoh4z4c2z0Z1ydLc5gYTTTZTdyhiD2Lsewx_mS_lOqR5uljWV_SAfAmqxWi9S0whaA__xwdsx7hQFPpyQ2V6FImGb7D-ybW7-wZgLJygfiy9KIo-EzWRA8O--kfHAHPdnrrgGPzarXKIJIPrDi4HDR-E8ITfphfl8RNDHjOm4cfyzaOavaPNOwODyIFZgjU_lm0wOkCunCiFkzswCfuMRMWNU659nEWPrKxEXc6KP7A0yT0"
                        alt="Student"
                        sx={{ width: 40, height: 40, border: `2px solid ${theme.palette.divider}`, cursor: 'pointer' }}
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
