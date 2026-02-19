import React from 'react';
import {
    Box, Typography, Switch, TextField,
    RadioGroup, useTheme,
} from '@mui/material';
import {
    EditNote as EditNoteIcon, Public as PublicIcon,
} from '@mui/icons-material';

interface SettingsSectionProps {
    forumEnabled: boolean;
    setForumEnabled: (value: boolean) => void;
    ratingEnabled: boolean;
    setRatingEnabled: (value: boolean) => void;
    certEnabled: boolean;
    setCertEnabled: (value: boolean) => void;
visibility: 'draft' | 'published';
    setVisibility: (value: 'draft' | 'published') => void;
    metaTitle: string;
    setMetaTitle: (value: string) => void;
    metaDescription: string;
    setMetaDescription: (value: string) => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
    forumEnabled,
    setForumEnabled,
    ratingEnabled,
    setRatingEnabled,
    certEnabled,
    setCertEnabled,
    visibility,
    setVisibility,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
}) => {
    const theme = useTheme();

    return (
        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 4, px: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Engagement Features */}
            <section style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Engagement Features</Typography>
                    <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>Configure how students interact within the course.</Typography>
                </Box>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d141b' }}>Enable Discussion Forum</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#4c739a' }}>Allow students to post questions and engage in discussions.</Typography>
                        </Box>
                        <Switch
                            checked={forumEnabled}
                            onChange={(e) => setForumEnabled(e.target.checked)}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: theme.palette.primary.main },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d141b' }}>Show Course Rating</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#4c739a' }}>Display student ratings and reviews on the course landing page.</Typography>
                        </Box>
                        <Switch
                            checked={ratingEnabled}
                            onChange={(e) => setRatingEnabled(e.target.checked)}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: theme.palette.primary.main },
                            }}
                        />
                    </Box>
                </Box>
            </section>

            {/* Completion Settings */}
            <section style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Completion Settings</Typography>
                    <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>Manage certification and completion rules.</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d141b' }}>Certificate Generation</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#4c739a' }}>Automatically issue a certificate to students who finish the course.</Typography>
                        </Box>
                        <Switch
                            checked={certEnabled}
                            onChange={(e) => setCertEnabled(e.target.checked)}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: theme.palette.primary.main },
                            }}
                        />
                    </Box>
                </Box>
            </section>

            {/* Visibility */}
            <section style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Visibility</Typography>
                    <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>Control the current status and access of your course.</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
<RadioGroup
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as 'draft' | 'published')}
                        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}
                    >
                        <Box
                            onClick={() => setVisibility('draft')}
                            sx={{
                                position: 'relative', p: 3, borderRadius: '12px', border: `2px solid ${visibility === 'draft' ? theme.palette.primary.main : '#e7edf3'}`,
                                bgcolor: visibility === 'draft' ? `${theme.palette.primary.main}0D` : 'transparent', cursor: 'pointer',
                                transition: 'all 0.2s', '&:hover': { border: `2px solid ${theme.palette.primary.main}80` }
                            }}
                        >
                            <EditNoteIcon sx={{ color: theme.palette.primary.main, mb: 1.5 }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d141b' }}>Draft</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#4c739a', mt: 0.5 }}>Only admins can view</Typography>
                            <Box sx={{
                                position: 'absolute', top: 16, right: 16, width: 16, height: 16, borderRadius: '50%',
                                border: `2px solid ${visibility === 'draft' ? theme.palette.primary.main : '#cbd5e1'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {visibility === 'draft' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.primary.main }} />}
                            </Box>
</Box>

                        <Box
                            onClick={() => setVisibility('published')}
                            sx={{
                                position: 'relative', p: 3, borderRadius: '12px', border: `2px solid ${visibility === 'published' ? theme.palette.primary.main : '#e7edf3'}`,
                                bgcolor: visibility === 'published' ? `${theme.palette.primary.main}0D` : 'transparent', cursor: 'pointer',
                                transition: 'all 0.2s', '&:hover': { border: `2px solid ${theme.palette.primary.main}80` }
                            }}
                        >
                            <PublicIcon sx={{ color: visibility === 'published' ? theme.palette.primary.main : '#4c739a', mb: 1.5, transition: 'color 0.2s' }} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d141b' }}>Published</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#4c739a', mt: 0.5 }}>Visible to all students</Typography>
                            <Box sx={{
                                position: 'absolute', top: 16, right: 16, width: 16, height: 16, borderRadius: '50%',
                                border: `2px solid ${visibility === 'published' ? theme.palette.primary.main : '#cbd5e1'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {visibility === 'published' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.primary.main }} />}
                            </Box>
                        </Box>
                    </RadioGroup>
                </Box>
            </section>

            {/* SEO Configuration */}
            <section style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3', marginBottom: '48px' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>SEO Configuration</Typography>
                    <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>Optimize your course listing for search engine visibility.</Typography>
                </Box>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d141b', mb: 1 }}>Meta Title</Typography>
                        <TextField
                            fullWidth
                            placeholder="e.g., Master React Patterns | LMS Course"
                            size="small"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': { bgcolor: '#f6f7f8', borderRadius: '8px' },
                                '& .MuiOutlinedInput-input::placeholder': { color: 'rgba(76, 115, 154, 0.5)' }
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography sx={{ fontSize: '10px', color: '#4c739a' }}>Recommended length: 50-60 characters</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#4c739a' }}>{metaTitle.length} / 60</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d141b', mb: 1 }}>Meta Description</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Enter a brief description for search engine results..."
                            size="small"
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': { bgcolor: '#f6f7f8', borderRadius: '8px' },
                                '& .MuiOutlinedInput-input::placeholder': { color: 'rgba(76, 115, 154, 0.5)' }
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography sx={{ fontSize: '10px', color: '#4c739a' }}>Recommended length: 150-160 characters</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#4c739a' }}>{metaDescription.length} / 160</Typography>
                        </Box>
                    </Box>
                </Box>
            </section>
        </Box>
    );
};

export default SettingsSection;
