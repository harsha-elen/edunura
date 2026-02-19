import React from 'react';
import { Box, Typography, Card, Grid, Button, Container } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import { LayoutContextType } from '../components/Layout';
import {
    Help as HelpIcon,
    Email as EmailIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';

const Help: React.FC = () => {
    const { mobileOpen, handleDrawerToggle } = useOutletContext<LayoutContextType>();

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Button
                    sx={{ display: { sm: 'none' }, p: 1 }}
                    onClick={handleDrawerToggle}
                >
                    <MenuIcon />
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Help & Support
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 4, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <HelpIcon color="primary" sx={{ fontSize: 32 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Contact Support
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Have questions? Our support team is here to help you with any issues or inquiries.
                        </Typography>
                        <Button variant="contained" startIcon={<EmailIcon />} fullWidth>
                            Email Support
                        </Button>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Frequently Asked Questions
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    How do I access my courses?
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Go to My Courses to view all your enrolled courses.
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    How do I track my progress?
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your progress is automatically tracked as you complete lessons.
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Can I get a refund?
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Please contact support for refund inquiries.
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Help;
