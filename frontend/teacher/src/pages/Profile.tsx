import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Snackbar, IconButton, InputAdornment, useTheme } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import profileService, { ProfileData } from '../services/profileService';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';

const Profile: React.FC = () => {
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Profile data state
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
    
    // Edit mode state
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editFormData, setEditFormData] = useState({
        first_name: '',
        last_name: '',
        phone: ''
    });
    
    // Password change dialog state
    const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
    const [passwordFormData, setPasswordFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    
    // Password visibility state
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    
    // Snackbar state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Fetch profile data on mount
    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await profileService.getProfile();
            if (response.status === 'success' && response.data) {
                setProfileData(response.data);
                setEditFormData({
                    first_name: response.data.first_name,
                    last_name: response.data.last_name,
                    phone: response.data.phone || ''
                });
            }
        } catch (error: any) {
            console.error('Failed to fetch profile:', error);
            showSnackbar('Failed to load profile data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        if (profileData) {
            setEditFormData({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone: profileData.phone || ''
            });
        }
        setIsEditMode(false);
    };

    const handleSaveProfile = async () => {
        try {
            const response = await profileService.updateProfile(editFormData);
            if (response.status === 'success' && response.data) {
                setProfileData(response.data);
                setIsEditMode(false);
                
                // Update localStorage user data so navbar reflects changes immediately
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const userData = JSON.parse(userStr);
                        userData.first_name = response.data.first_name;
                        userData.last_name = response.data.last_name;
                        userData.phone = response.data.phone;
                        localStorage.setItem('user', JSON.stringify(userData));
                        
                        // Trigger a custom event to update navbar
                        window.dispatchEvent(new CustomEvent('userUpdated'));
                    } catch (error) {
                        console.error('Failed to update localStorage user:', error);
                    }
                }
                
                showSnackbar('Profile updated successfully', 'success');
            }
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            showSnackbar(error.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    const handlePasswordDialogOpen = () => {
        setPasswordDialogOpen(true);
    };

    const handlePasswordDialogClose = () => {
        setPasswordDialogOpen(false);
        setPasswordFormData({
            current_password: '',
            new_password: '',
            confirm_password: ''
        });
        setShowPassword({
            current: false,
            new: false,
            confirm: false
        });
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleChangePassword = async () => {
        // Validation
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
            const response = await profileService.changePassword({
                current_password: passwordFormData.current_password,
                new_password: passwordFormData.new_password
            });

            if (response.status === 'success') {
                showSnackbar('Password changed successfully', 'success');
                handlePasswordDialogClose();
            }
        } catch (error: any) {
            console.error('Failed to change password:', error);
            showSnackbar(error.response?.data?.message || 'Failed to change password', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showSnackbar('File size must be less than 5MB', 'error');
            return;
        }

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            showSnackbar('Only JPG and PNG files are allowed', 'error');
            return;
        }

        try {
            setAvatarUploading(true);
            const response = await profileService.uploadAvatar(file);
            if (response.status === 'success' && response.data && profileData) {
                setProfileData({
                    ...profileData,
                    avatar: response.data.avatar
                });

                // Update localStorage user avatar
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const userData = JSON.parse(userStr);
                        userData.avatar = response.data.avatar;
                        localStorage.setItem('user', JSON.stringify(userData));
                        window.dispatchEvent(new CustomEvent('userUpdated'));
                    } catch (error) {
                        console.error('Failed to update localStorage user:', error);
                    }
                }

                showSnackbar('Avatar updated successfully', 'success');
            }
        } catch (error: any) {
            console.error('Failed to upload avatar:', error);
            showSnackbar(error.response?.data?.message || 'Failed to upload avatar', 'error');
        } finally {
            setAvatarUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
            <Box sx={{ maxWidth: '1280px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Profile Header Card */}
                    <Box sx={{ 
                        position: 'relative', 
                        borderRadius: 3, 
                        bgcolor: '#ffffff', 
                        border: '1px solid #e7edf3', 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        overflow: 'hidden'
                    }}>
                        {/* Cover Image */}
                        <Box sx={{ 
                            height: 64, 
                            width: '100%', 
                            bgcolor: '#ffffff'
                        }} />
                        
                        {/* Profile Info */}
                        <Box sx={{ 
                            px: 4, 
                            pb: 3, 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-end', sm: 'center' },
                            gap: 3,
                            mt: -4,
                            position: 'relative',
                            zIndex: 10
                        }}>
                            {/* Profile Picture */}
                            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                                <Box sx={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: 3,
                                    border: '4px solid #ffffff',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    backgroundImage: profileData.avatar 
                                        ? `url("${STATIC_ASSETS_BASE_URL}${profileData.avatar}")`
                                        : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxsbqlfOLuRFhGPyFrb-VLx_HZLY5NrDhVNuyNCsbGOJTYtztx-ddbEUcmDzaLhe_uMpFCyFMfLjSONSd2nP45YZhxY7CSFlecPqbmFUBt7aDdawDgDhaz8oruccU3PEO2v68SB2OIs66pr5Azn5rdVWjSgZdJG-EOw2k46sWZ3u1b95LBnkH9A5bPqQEvBM2daapWrudi-S5OVWJkvUcs70T7gGJJ6VoptL7XfXH3LtjsSVuVNTB5Fya_b5d1BhuaQBVBy9iaCmOT")',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }} />
                                <Box 
                                    onClick={handleAvatarClick}
                                    sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
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
                                    justifyContent: 'center'
                                }}>
                                    {avatarUploading ? (
                                        <CircularProgress size={18} />
                                    ) : (
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span>
                                    )}
                                </Box>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarChange}
                                />
                            </Box>

                            {/* Name and Email */}
                            <Box sx={{ flex: 1, minWidth: 0, pt: { xs: 6, sm: 0 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box component="h1" sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#0d141b', m: 0 }}>
                                        {profileData.first_name} {profileData.last_name}
                                    </Box>
                                    <Box sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        borderRadius: '9999px',
                                        bgcolor: `${theme.palette.primary.main}15`,
                                        px: 1.5,
                                        py: 0.5,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: theme.palette.primary.main,
                                        textTransform: 'capitalize'
                                    }}>
                                        {profileData.role}
                                    </Box>
                                </Box>
                                <Box sx={{ color: '#4c739a', mt: 0.5 }}>{profileData.email}</Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Two Column Layout */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 4 }}>
                        {/* Personal Information Card */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            borderRadius: 3, 
                            bgcolor: '#ffffff', 
                            border: '1px solid #e7edf3', 
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            {/* Card Header */}
                            <Box sx={{ 
                                p: 3, 
                                borderBottom: '1px solid #e7edf3', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center' 
                            }}>
                                <Box sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>
                                    Personal Information
                                </Box>
                                {!isEditMode ? (
                                    <Box 
                                        onClick={handleEditClick}
                                        sx={{ 
                                            color: theme.palette.primary.main, 
                                            fontSize: '0.875rem', 
                                            fontWeight: 700, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 0.5,
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                                        Edit
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleCancelEdit}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleSaveProfile}
                                        >
                                            Save
                                        </Button>
                                    </Box>
                                )}
                            </Box>

                            {/* Card Content */}
                            <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
                                {!isEditMode ? (
                                    <>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                            <Box>
                                                <Box sx={{ fontSize: '0.75rem', color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    First Name
                                                </Box>
                                                <Box sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#0d141b' }}>
                                                    {profileData.first_name}
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Box sx={{ fontSize: '0.75rem', color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    Last Name
                                                </Box>
                                                <Box sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#0d141b' }}>
                                                    {profileData.last_name}
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                            <Box>
                                                <Box sx={{ fontSize: '0.75rem', color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    Email Address
                                                </Box>
                                                <Box sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#0d141b' }}>
                                                    {profileData.email}
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Box sx={{ fontSize: '0.75rem', color: '#4c739a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    Phone Number
                                                </Box>
                                                <Box sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#0d141b' }}>
                                                    {profileData.phone || 'Not provided'}
                                                </Box>
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
                                            <TextField
                                                label="Email Address"
                                                value={profileData.email}
                                                fullWidth
                                                size="small"
                                                disabled
                                                helperText="Email cannot be changed"
                                            />
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
                                    <Box sx={{ fontSize: '0.75rem', color: '#4c739a' }}>
                                        Account created on {formatDate(profileData.created_at)}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Security Settings Card */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            borderRadius: 3, 
                            bgcolor: '#ffffff', 
                            border: '1px solid #e7edf3', 
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            {/* Card Header */}
                            <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                                <Box sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>
                                    Security Settings
                                </Box>
                            </Box>

                            {/* Card Content */}
                            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Password Setting */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    p: 2,
                                    bgcolor: '#f6f7f8',
                                    borderRadius: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ 
                                            p: 1, 
                                            bgcolor: `${theme.palette.primary.main}15`, 
                                            color: theme.palette.primary.main, 
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span className="material-symbols-outlined">lock_reset</span>
                                        </Box>
                                        <Box>
                                            <Box sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d141b' }}>
                                                Password
                                            </Box>
                                            <Box sx={{ fontSize: '0.75rem', color: '#4c739a' }}>
                                                Keep your account secure
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box 
                                        onClick={handlePasswordDialogOpen}
                                        sx={{
                                            px: 2,
                                            py: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            bgcolor: '#ffffff',
                                            border: '1px solid #e7edf3',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            '&:hover': { borderColor: theme.palette.primary.main }
                                        }}
                                    >
                                        Change Password
                                    </Box>
                                </Box>

                                {/* Two-Factor Authentication */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    p: 2,
                                    bgcolor: '#f6f7f8',
                                    borderRadius: 2
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ 
                                            p: 1, 
                                            bgcolor: 'rgba(7, 136, 56, 0.1)', 
                                            color: '#078838', 
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span className="material-symbols-outlined">shield_person</span>
                                        </Box>
                                        <Box>
                                            <Box sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d141b' }}>
                                                Two-Factor Authentication
                                            </Box>
                                            <Box sx={{ fontSize: '0.75rem', color: '#4c739a' }}>
                                                Recommended for enhanced security
                                            </Box>
                                        </Box>
                                    </Box>
                                    {/* Toggle Switch */}
                                    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <Box sx={{
                                            width: 44,
                                            height: 24,
                                            bgcolor: theme.palette.primary.main,
                                            borderRadius: '9999px',
                                            position: 'relative',
                                            transition: 'background-color 0.2s',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: '2px',
                                                left: '22px',
                                                width: 20,
                                                height: 20,
                                                bgcolor: '#ffffff',
                                                borderRadius: '50%',
                                                transition: 'left 0.2s'
                                            }
                                        }} />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Recent Login Activity Table */}
                    <Box sx={{ 
                        borderRadius: 3, 
                        bgcolor: '#ffffff', 
                        border: '1px solid #e7edf3', 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                        mb: 4
                    }}>
                        {/* Table Header */}
                        <Box sx={{ 
                            px: 3, 
                            py: 2, 
                            borderBottom: '1px solid #e7edf3', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span className="material-symbols-outlined" style={{ color: '#4c739a' }}>history</span>
                                <Box sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>
                                    Recent Login Activity
                                </Box>
                            </Box>
                            <Box sx={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: '#4c739a', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                '&:hover': { color: '#2b8cee' }
                            }}>
                                Clear Logs
                            </Box>
                        </Box>

                        {/* Table */}
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
                                            <span className="material-symbols-outlined" style={{ color: '#4c739a' }}>desktop_windows</span>
                                            Chrome on Windows 11
                                        </Box>
                                        <Box component="td" sx={{ px: 3, py: 2 }}>New York, USA</Box>
                                        <Box component="td" sx={{ px: 3, py: 2, fontFamily: 'monospace', fontSize: '0.75rem' }}>192.168.1.1</Box>
                                        <Box component="td" sx={{ px: 3, py: 2 }}>Oct 24, 2023 • 10:24 AM</Box>
                                        <Box component="td" sx={{ px: 3, py: 2, textAlign: 'right' }}>
                                            <Box component="span" sx={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: 0.5, 
                                                color: '#078838', 
                                                fontWeight: 700, 
                                                fontSize: '0.625rem', 
                                                textTransform: 'uppercase' 
                                            }}>
                                                Current Session
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box component="tr">
                                        <Box component="td" sx={{ px: 3, py: 2, fontWeight: 500, color: '#0d141b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <span className="material-symbols-outlined" style={{ color: '#4c739a' }}>smartphone</span>
                                            Safari on iPhone 14
                                        </Box>
                                        <Box component="td" sx={{ px: 3, py: 2 }}>London, UK</Box>
                                        <Box component="td" sx={{ px: 3, py: 2, fontFamily: 'monospace', fontSize: '0.75rem' }}>84.122.45.10</Box>
                                        <Box component="td" sx={{ px: 3, py: 2 }}>Oct 23, 2023 • 09:15 PM</Box>
                                        <Box component="td" sx={{ px: 3, py: 2, textAlign: 'right' }}>
                                            <Box component="span" sx={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: 0.5, 
                                                color: '#4c739a', 
                                                fontWeight: 500 
                                            }}>
                                                Completed
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box component="tr">
                                        <Box component="td" sx={{ px: 3, py: 2, fontWeight: 500, color: '#0d141b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <span className="material-symbols-outlined" style={{ color: '#4c739a' }}>desktop_windows</span>
                                            Firefox on macOS
                                        </Box>
                                        <Box component="td" sx={{ px: 3, py: 2 }}>Berlin, Germany</Box>
                                        <Box component="td" sx={{ px: 3, py: 2, fontFamily: 'monospace', fontSize: '0.75rem' }}>77.21.198.4</Box>
                                        <Box component="td" sx={{ px: 3, py: 2 }}>Oct 21, 2023 • 02:45 PM</Box>
                                        <Box component="td" sx={{ px: 3, py: 2, textAlign: 'right' }}>
                                            <Box component="span" sx={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: 0.5, 
                                                color: '#4c739a', 
                                                fontWeight: 500 
                                            }}>
                                                Completed
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Table Footer */}
                        <Box sx={{ 
                            px: 3, 
                            py: 2, 
                            bgcolor: '#f9fafb', 
                            borderTop: '1px solid #e7edf3', 
                            textAlign: 'center' 
                        }}>
                            <Box sx={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: '#2b8cee', 
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                            }}>
                                See full login history
                            </Box>
                        </Box>
                    </Box>
                </Box>

            {/* Password Change Dialog */}
            <Dialog
                open={passwordDialogOpen}
                onClose={handlePasswordDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Current Password"
                            type={showPassword.current ? 'text' : 'password'}
                            value={passwordFormData.current_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, current_password: e.target.value })}
                            fullWidth
                            autoComplete="current-password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => togglePasswordVisibility('current')}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                        >
                                            {showPassword.current ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
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
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => togglePasswordVisibility('new')}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                        >
                                            {showPassword.new ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <TextField
                            label="Confirm New Password"
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={passwordFormData.confirm_password}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, confirm_password: e.target.value })}
                            fullWidth
                            autoComplete="new-password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                        >
                                            {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handlePasswordDialogClose}>Cancel</Button>
                    <Button onClick={handleChangePassword} variant="contained">
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;
