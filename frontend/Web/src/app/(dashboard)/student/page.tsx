'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';

/**
 * Student Dashboard page — placeholder.
 * Will be replaced with the full student dashboard ported from student/src/pages/Dashboard.tsx
 */
export default function StudentDashboardPage() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Student Dashboard
            </Typography>
            <Typography color="text.secondary">
                Welcome to the Student Portal. This page will be populated with the full dashboard.
            </Typography>
        </Box>
    );
}
