'use client';

import React from 'react';
import { Box, Typography, Card, Grid, Button, useTheme, Link } from '@mui/material';
import {
    Help as HelpIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface FAQ {
    id: number;
    question: string;
    answer: string;
}

const faqs: FAQ[] = [
    {
        id: 1,
        question: 'How do I access my courses?',
        answer: 'Go to My Courses to view all your enrolled courses. You can start learning immediately.',
    },
    {
        id: 2,
        question: 'How do I track my progress?',
        answer: 'Your progress is automatically tracked as you complete lessons. You can see your progress percentage on the course card and in the course player.',
    },
    {
        id: 3,
        question: 'Can I get a refund?',
        answer: 'Please contact support for refund inquiries. Our support team will review your request and get back to you within 48 hours.',
    },
    {
        id: 4,
        question: 'How do I join live classes?',
        answer: 'Live classes will appear in your Calendar and Live Classes sections. You can join directly from there at the scheduled time.',
    },
    {
        id: 5,
        question: 'Can I download course materials?',
        answer: 'Yes, you can download course resources from the Resources section in the Course Player.',
    },
    {
        id: 6,
        question: 'How do I update my profile?',
        answer: 'Go to Account settings to update your personal information, avatar, and other profile details.',
    },
];

export default function HelpPage() {
    const theme = useTheme();

    return (
        <Box sx={{ maxWidth: 1440, mx: 'auto', width: '100%' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Help & Support
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    Find answers to common questions or get in touch with our support team
                </Typography>
            </Box>

            {/* Quick Support Cards */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {/* Contact Support Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                                boxShadow: theme.shadows[4],
                            },
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    display: 'flex',
                                }}
                            >
                                <HelpIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                Get Help
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, flex: 1 }}>
                            Have questions or facing an issue? Our support team is available 24/7 to assist you with any problems or inquiries.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<EmailIcon />}
                            fullWidth
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                py: 1.5,
                            }}
                        >
                            Contact Support
                        </Button>
                    </Card>
                </Grid>

                {/* Report Issue Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.warning.main, 0.02)})`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: alpha(theme.palette.warning.main, 0.2),
                                boxShadow: theme.shadows[4],
                            },
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                                    color: theme.palette.warning.main,
                                    display: 'flex',
                                }}
                            >
                                <EmailIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                Report Issue
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, flex: 1 }}>
                            Found a bug or technical issue? Let us know the details and our technical team will investigate and resolve it promptly.
                        </Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                py: 1.5,
                            }}
                        >
                            Report Bug
                        </Button>
                    </Card>
                </Grid>
            </Grid>

            {/* FAQs Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
                    Frequently Asked Questions
                </Typography>

                <Grid container spacing={2}>
                    {faqs.map((faq) => (
                        <Grid size={{ xs: 12, md: 6 }} key={faq.id}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: alpha(theme.palette.primary.main, 0.3),
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                    },
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                                    {faq.question}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                    {faq.answer}
                                </Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Additional Resources */}
            <Card
                elevation={0}
                sx={{
                    p: 4,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.main, 0.02)})`,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                    Additional Resources
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Link
                        href="#"
                        sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        → Documentation & Guides
                    </Link>
                    <Link
                        href="#"
                        sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        → Video Tutorials
                    </Link>
                    <Link
                        href="#"
                        sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        → Community Forum
                    </Link>
                    <Link
                        href="#"
                        sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        → System Status
                    </Link>
                </Box>
            </Card>
        </Box>
    );
}
