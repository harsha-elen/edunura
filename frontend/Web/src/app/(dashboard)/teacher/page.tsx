'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';

/**
 * Teacher Dashboard page — placeholder.
 * Will be replaced with the full teacher dashboard ported from teacher/src/pages/Dashboard.tsx
 */
export default function TeacherDashboardPage() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Teacher Dashboard
            </Typography>
            <Typography color="text.secondary">
                Welcome to the Teacher Portal. This page will be populated with the full dashboard.
            </Typography>
        </Box>
    );
}
