'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Snackbar,
    IconButton,
    InputAdornment,
    useTheme,
    Breadcrumbs,
    Typography,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Edit as EditIcon,
    CameraAlt as CameraAltIcon,
    LockReset as LockResetIcon,
    Security as SecurityIcon,
    History as HistoryIcon,
    DesktopWindows as DesktopWindowsIcon,
    Smartphone as SmartphoneIcon,
    NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { getProfile, updateProfile, uploadAvatar, changePassword, type ProfileData, type UpdateProfileData, type ChangePasswordData } from '@/services/profileService';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';

const Profile: React.FC = () => {
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [avatarUploading, setAvatarUploading] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState<UpdateProfileData>({
        first_name: '',
        last_name: '',
        phone: '',
    });

    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await getProfile();
            if (response.status === 'success' && response.data) {
                setProfileData(response.data);
                setEditFormData({
                    first_name: response.data.first_name,
                    last_name: response.data.last_name,
                    phone: response.data.phone || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            showSnackbar('Failed to load profile data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (profileData) {
            setEditFormData({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone: profileData.phone || '',
            });
        }
        setIsEditMode(false);
    };

    const handleSaveProfile = async () => {
        try {
            const response = await updateProfile(editFormData);
            if (response.status === 'success' && response.data) {
                setProfileData(response.data);
                setIsEditMode(false);

                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const userData = JSON.parse(userStr);
                        userData.first_name = response.data.first_name;
                        userData.last_name = response.data.last_name;
                        userData.phone = response.data.phone;
                        localStorage.setItem('user', JSON.stringify(userData));
                        window.dispatchEvent(new CustomEvent('userUpdated'));
                    } catch { /* ignore */ }
                }

                showSnackbar('Profile updated successfully', 'success');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showSnackbar(err.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    const handlePasswordDialogClose = () => {
        setPasswordDialogOpen(false);
        setPasswordFormData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPassword({ current: false, new: false, confirm: false });
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChangePassword = async () => {
        if (!passwordFormData.current_password || !passwordFormData.new_password || !passwordFormData.confirm_password) {
            showSnackbar('All password fields are required', 'error');
            return;
        }
        if (passwordFormData.new_password !== passwordFormData.confirm_password) {
            showSnackbar('New password and confirm password do not match', 'error');
            return;
        }
        if (passwordFormData.new_password.length < 6) {
            showSnackbar('New password must be at least 6 characters long', 'error');
            return;
        }

        try {
            const data: ChangePasswordData = {
                current_password: passwordFormData.current_password,
                new_password: passwordFormData.new_password,
            };
            const response = await changePassword(data);
            if (response.status === 'success') {
                showSnackbar('Password changed successfully', 'success');
                handlePasswordDialogClose();
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showSnackbar(err.response?.data?.message || 'Failed to change password', 'error');
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showSnackbar('File size must be less than 5MB', 'error');
            return;
        }
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            showSnackbar('Only JPG and PNG files are allowed', 'error');
            return;
        }

        try {
            setAvatarUploading(true);
            const response = await uploadAvatar(file);
            if (response.status === 'success' && response.data && profileData) {
                setProfileData({ ...profileData, avatar: response.data.avatar });

                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const userData = JSON.parse(userStr);
                        userData.avatar = response.data.avatar;
                        localStorage.setItem('user', JSON.stringify(userData));
                        window.dispatchEvent(new CustomEvent('userUpdated'));
                    } catch { /* ignore */ }
                }
                showSnackbar('Avatar updated successfully', 'success');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showSnackbar(err.response?.data?.message || 'Failed to upload avatar', 'error');
        } finally {
            setAvatarUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!profileData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Alert severity="error">Failed to load profile data</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f6f7f8', minHeight: '100%', p: 4 }}>
            <Box sx={{ maxWidth: 1280, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Breadcrumb */}
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}>
                    <Typography component={Link} href="/admin" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                        Home
                    </Typography>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>Profile</Typography>
                </Breadcrumbs>

                {/* Profile Header Card */}
                <Box sx={{ borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e7edf3', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <Box sx={{ height: 64, width: '100%', bgcolor: '#ffffff' }} />
                    <Box sx={{ px: 4, pb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-end', sm: 'center' }, gap: 3, mt: -4, position: 'relative', zIndex: 10 }}>
                        {/* Avatar */}
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Box
                                sx={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: 3,
                                    border: '4px solid #ffffff',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    backgroundImage: profileData.avatar
                                        ? `url("${STATIC_ASSETS_BASE_URL}${profileData.avatar}")`
                                        : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    bgcolor: profileData.avatar ? 'transparent' : '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                }}
                            >
                                {!profileData.avatar && (
                                    <span>{profileData.first_name?.charAt(0)}{profileData.last_name?.charAt(0)}</span>
                                )}
                            </Box>
                            <Box
                                onClick={handleAvatarClick}
                                sx={{
                                    position: 'absolute',
                                    bottom: 4,
                                    right: 4,
                                    p: 0.75,
                                    bgcolor: '#ffffff',
                                    borderRadius: 2,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    border: '1px solid #e7edf3',
                                    color: '#4c739a',
                                    cursor: avatarUploading ? 'not-allowed' : 'pointer',
                                    opacity: avatarUploading ? 0.6 : 1,
                                    '&:hover': { color: avatarUploading ? '#4c739a' : theme.palette.primary.main },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {avatarUploading ? <CircularProgress size={18} /> : <CameraAltIcon sx={{ fontSize: 18 }} />}
                            </Box>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                            />
                        </Box>

                        {/* Name & Email */}
                        <Box sx={{ flex: 1, minWidth: 0, pt: { xs: 6, sm: 0 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                    {profileData.first_name} {profileData.last_name}
                                </Typography>
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', bgcolor: `${theme.palette.primary.main}15`, px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600, color: theme.palette.primary.main, textTransform: 'capitalize' }}>
                                    {profileData.role}
                                </Box>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>{profileData.email}</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Two Column Layout */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 4 }}>
                    {/* Personal Information Card */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e7edf3', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Personal Information</Typography>
                            {!isEditMode ? (
                                <Box
                                    onClick={() => setIsEditMode(true)}
                                    sx={{ color: theme.palette.primary.main, fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                >
                                    <EditIcon sx={{ fontSize: 18 }} />
                                    Edit
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" size="small" onClick={handleCancelEdit} sx={{ textTransform: 'none' }}>Cancel</Button>
                                    <Button variant="contained" size="small" onClick={handleSaveProfile} sx={{ textTransform: 'none' }}>Save</Button>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
                            {!isEditMode ? (
                                <>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>First Name</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0d141b', mt: 0.5 }}>{profileData.first_name}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Name</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0d141b', mt: 0.5 }}>{profileData.last_name}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0d141b', mt: 0.5 }}>{profileData.email}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0d141b', mt: 0.5 }}>{profileData.phone || 'Not provided'}</Typography>
                                        </Box>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                        <TextField
                                            label="First Name"
                                            value={editFormData.first_name}
                                            onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                            fullWidth
                                            size="small"
                                        />
                                        <TextField
                                            label="Last Name"
                                            value={editFormData.last_name}
                                            onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                            fullWidth
                                            size="small"
                                        />
                                    </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                        <TextField label="Email Address" value={profileData.email} fullWidth size="small" disabled helperText="Email cannot be changed" />
                                        <TextField
                                            label="Phone Number"
                                            value={editFormData.phone}
                                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                            fullWidth
                                            size="small"
                                            placeholder="+1 (555) 234-5678"
                                        />
                                    </Box>
                                </>
                            )}
                            <Box sx={{ pt: 2, mt: 2, borderTop: '1px solid #e7edf3' }}>
                                <Typography variant="caption" sx={{ color: '#4c739a' }}>Account created on {formatDate(profileData.created_at)}</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Security Settings Card */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e7edf3', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                            <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Security Settings</Typography>
                        </Box>
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Password */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#f6f7f8', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <LockResetIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0d141b' }}>Password</Typography>
                                        <Typography variant="caption" sx={{ color: '#4c739a' }}>Keep your account secure</Typography>
                                    </Box>
                                </Box>
                                <Box
                                    onClick={() => setPasswordDialogOpen(true)}
                                    sx={{ px: 2, py: 1, fontSize: '0.75rem', fontWeight: 700, bgcolor: '#ffffff', border: '1px solid #e7edf3', borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: theme.palette.primary.main } }}
                                >
                                    Change Password
                                </Box>
                            </Box>

                            {/* Two-Factor Authentication */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#f6f7f8', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, bgcolor: 'rgba(7, 136, 56, 0.1)', color: '#078838', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <SecurityIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0d141b' }}>Two-Factor Authentication</Typography>
                                        <Typography variant="caption" sx={{ color: '#4c739a' }}>Recommended for enhanced security</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <Box sx={{
                                        width: 44, height: 24, bgcolor: theme.palette.primary.main, borderRadius: '9999px', position: 'relative', transition: 'background-color 0.2s',
                                        '&::after': { content: '""', position: 'absolute', top: '2px', left: '22px', width: 20, height: 20, bgcolor: '#ffffff', borderRadius: '50%', transition: 'left 0.2s' },
                                    }} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Recent Login Activity */}
                <Box sx={{ borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e7edf3', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden', mb: 4 }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon sx={{ color: '#4c739a' }} />
                            <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Recent Login Activity</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#4c739a', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', '&:hover': { color: '#2b8cee' } }}>
                            Clear Logs
                        </Typography>
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box component="table" sx={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', color: '#4c739a' }}>
                            <Box component="thead" sx={{ bgcolor: '#f6f7f8', fontSize: '0.75rem', textTransform: 'uppercase', color: '#4c739a', fontWeight: 600 }}>
                                <Box component="tr">
                                    <Box component="th" sx={{ px: 3, py: 2 }}>Device & Browser</Box>
                                    <Box component="th" sx={{ px: 3, py: 2 }}>Location</Box>
                                    <Box component="th" sx={{ px: 3, py: 2 }}>IP Address</Box>
                                    <Box component="th" sx={{ px: 3, py: 2 }}>Date & Time</Box>
                                    <Box component="th" sx={{ px: 3, py: 2, textAlign: 'right' }}>Status</Box>
                                </Box>
                            </Box>
                            <Box component="tbody" sx={{ '& tr': { borderBottom: '1px solid #e7edf3', '&:hover': { bgcolor: '#f6f7f8' } } }}>
                                <Box component="tr">
                                    <Box component="td" sx={{ px: 3, py: 2, fontWeight: 500, color: '#0d141b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <DesktopWindowsIcon sx={{ color: '#4c739a', fontSize: 20 }} />
                                        Chrome on Windows 11
                                    </Box>
                                    <Box component="td" sx={{ px: 3, py: 2 }}>New York, USA</Box>
                                    <Box component="td" sx={{ px: 3, py: 2, fontFamily: 'monospace', fontSize: '0.75rem' }}>192.168.1.1</Box>
                                    <Box component="td" sx={{ px: 3, py: 2 }}>Oct 24, 2023 &bull; 10:24 AM</Box>
                                    <Box component="td" sx={{ px: 3, py: 2, textAlign: 'right' }}>
                                        <Box component="span" sx={{ color: '#078838', fontWeight: 700, fontSize: '0.625rem', textTransform: 'uppercase' }}>Current Session</Box>
                                    </Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={{ px: 3, py: 2, fontWeight: 500, color: '#0d141b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <SmartphoneIcon sx={{ color: '#4c739a', fontSize: 20 }} />
                                        Safari on iPhone 14
                                    </Box>
                                    <Box component="td" sx={{ px: 3, py: 2 }}>London, UK</Box>
                                    <Box component="td" sx={{ px: 3, py: 2, fontFamily: 'monospace', fontSize: '0.75rem' }}>84.122.45.10</Box>
                                    <Box component="td" sx={{ px: 3, py: 2 }}>Oct 23, 2023 &bull; 09:15 PM</Box>
                                    <Box component="td" sx={{ px: 3, py: 2, textAlign: 'right' }}>
                                        <Box component="span" sx={{ color: '#4c739a', fontWeight: 500 }}>Completed</Box>
                                    </Box>
                                </Box>
                                <Box component="tr">
                                    <Box component="td" sx={{ px: 3, py: 2, fontWeight: 500, color: '#0d141b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <DesktopWindowsIcon sx={{ color: '#4c739a', fontSize: 20 }} />
                                        Firefox on macOS
                                    </Box>
                                    <Box component="td" sx={{ px: 3, py: 2 }}>Berlin, Germany</Box>
                                    <Box component="td" sx={{ px: 3, py: 2, fontFamily: 'monospace', fontSize: '0.75rem' }}>77.21.198.4</Box>
                                    <Box component="td" sx={{ px: 3, py: 2 }}>Oct 21, 2023 &bull; 02:45 PM</Box>
                                    <Box component="td" sx={{ px: 3, py: 2, textAlign: 'right' }}>
                                        <Box component="span" sx={{ color: '#4c739a', fontWeight: 500 }}>Completed</Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ px: 3, py: 2, bgcolor: '#f9fafb', borderTop: '1px solid #e7edf3', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#2b8cee', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                            See full login history
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Password Change Dialog */}
            <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Change Password</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Current Password"
                            type={showPassword.current ? 'text' : 'password'}
                            value={passwordFormData.current_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, current_password: e.target.value })}
                            fullWidth
                            autoComplete="current-password"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => togglePasswordVisibility('current')} edge="end">
                                                {showPassword.current ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            label="New Password"
                            type={showPassword.new ? 'text' : 'password'}
                            value={passwordFormData.new_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, new_password: e.target.value })}
                            fullWidth
                            helperText="Password must be at least 6 characters long"
                            autoComplete="new-password"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => togglePasswordVisibility('new')} edge="end">
                                                {showPassword.new ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <TextField
                            label="Confirm New Password"
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={passwordFormData.confirm_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, confirm_password: e.target.value })}
                            fullWidth
                            autoComplete="new-password"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => togglePasswordVisibility('confirm')} edge="end">
                                                {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handlePasswordDialogClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleChangePassword} variant="contained" sx={{ textTransform: 'none' }}>Change Password</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;
