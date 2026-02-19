import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

export interface LayoutContextType {
    mobileOpen: boolean;
    handleDrawerToggle: () => void;
}

const Layout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Only show menu button on Profile page for now (or pages with sidebar)
    const showMenuButton = location.pathname === '/profile';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F6F7F8', display: 'flex', flexDirection: 'column' }}>
            <Header onMenuClick={handleDrawerToggle} showMenuButton={showMenuButton} />
            <Outlet context={{ mobileOpen, handleDrawerToggle } satisfies LayoutContextType} />
        </Box>
    );
};

export default Layout;
