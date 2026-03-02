'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Card,
    Grid,
    Typography,
    TextField,
    Button,
    Avatar,
    Alert,
    CircularProgress,
    Drawer,
    IconButton,
    InputAdornment,
    InputBase,
    Select,
    MenuItem,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';
import * as profileService from '@/services/profileService';
import { getPaymentHistory } from '@/services/paymentService';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';
import EditIcon from '@mui/icons-material/Edit';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LogoutIcon from '@mui/icons-material/Logout';
import DownloadIcon from '@mui/icons-material/Download';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Visibility, VisibilityOff } from '@mui/icons-material';


// ── Country data ────────────────────────────────────────────────────────────
const getFlag = (code: string) =>
    code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));

const COUNTRIES = [
    { code: 'IN', name: 'India',                  dial: '+91'  },
    { code: 'US', name: 'United States',           dial: '+1'   },
    { code: 'GB', name: 'United Kingdom',          dial: '+44'  },
    { code: 'AU', name: 'Australia',               dial: '+61'  },
    { code: 'CA', name: 'Canada',                  dial: '+1'   },
    { code: 'AE', name: 'UAE',                     dial: '+971' },
    { code: 'SG', name: 'Singapore',               dial: '+65'  },
    { code: 'AF', name: 'Afghanistan',             dial: '+93'  },
    { code: 'AL', name: 'Albania',                 dial: '+355' },
    { code: 'DZ', name: 'Algeria',                 dial: '+213' },
    { code: 'AR', name: 'Argentina',               dial: '+54'  },
    { code: 'AM', name: 'Armenia',                 dial: '+374' },
    { code: 'AT', name: 'Austria',                 dial: '+43'  },
    { code: 'AZ', name: 'Azerbaijan',              dial: '+994' },
    { code: 'BH', name: 'Bahrain',                 dial: '+973' },
    { code: 'BD', name: 'Bangladesh',              dial: '+880' },
    { code: 'BE', name: 'Belgium',                 dial: '+32'  },
    { code: 'BR', name: 'Brazil',                  dial: '+55'  },
    { code: 'BG', name: 'Bulgaria',                dial: '+359' },
    { code: 'KH', name: 'Cambodia',                dial: '+855' },
    { code: 'CL', name: 'Chile',                   dial: '+56'  },
    { code: 'CN', name: 'China',                   dial: '+86'  },
    { code: 'CO', name: 'Colombia',                dial: '+57'  },
    { code: 'HR', name: 'Croatia',                 dial: '+385' },
    { code: 'CY', name: 'Cyprus',                  dial: '+357' },
    { code: 'CZ', name: 'Czech Republic',          dial: '+420' },
    { code: 'DK', name: 'Denmark',                 dial: '+45'  },
    { code: 'EG', name: 'Egypt',                   dial: '+20'  },
    { code: 'EE', name: 'Estonia',                 dial: '+372' },
    { code: 'FI', name: 'Finland',                 dial: '+358' },
    { code: 'FR', name: 'France',                  dial: '+33'  },
    { code: 'GE', name: 'Georgia',                 dial: '+995' },
    { code: 'DE', name: 'Germany',                 dial: '+49'  },
    { code: 'GH', name: 'Ghana',                   dial: '+233' },
    { code: 'GR', name: 'Greece',                  dial: '+30'  },
    { code: 'HK', name: 'Hong Kong',               dial: '+852' },
    { code: 'HU', name: 'Hungary',                 dial: '+36'  },
    { code: 'IS', name: 'Iceland',                 dial: '+354' },
    { code: 'ID', name: 'Indonesia',               dial: '+62'  },
    { code: 'IQ', name: 'Iraq',                    dial: '+964' },
    { code: 'IE', name: 'Ireland',                 dial: '+353' },
    { code: 'IL', name: 'Israel',                  dial: '+972' },
    { code: 'IT', name: 'Italy',                   dial: '+39'  },
    { code: 'JP', name: 'Japan',                   dial: '+81'  },
    { code: 'JO', name: 'Jordan',                  dial: '+962' },
    { code: 'KZ', name: 'Kazakhstan',              dial: '+7'   },
    { code: 'KE', name: 'Kenya',                   dial: '+254' },
    { code: 'KW', name: 'Kuwait',                  dial: '+965' },
    { code: 'LB', name: 'Lebanon',                 dial: '+961' },
    { code: 'LV', name: 'Latvia',                  dial: '+371' },
    { code: 'LT', name: 'Lithuania',               dial: '+370' },
    { code: 'MY', name: 'Malaysia',                dial: '+60'  },
    { code: 'MV', name: 'Maldives',                dial: '+960' },
    { code: 'MX', name: 'Mexico',                  dial: '+52'  },
    { code: 'MA', name: 'Morocco',                 dial: '+212' },
    { code: 'NP', name: 'Nepal',                   dial: '+977' },
    { code: 'NL', name: 'Netherlands',             dial: '+31'  },
    { code: 'NZ', name: 'New Zealand',             dial: '+64'  },
    { code: 'NG', name: 'Nigeria',                 dial: '+234' },
    { code: 'NO', name: 'Norway',                  dial: '+47'  },
    { code: 'OM', name: 'Oman',                    dial: '+968' },
    { code: 'PK', name: 'Pakistan',                dial: '+92'  },
    { code: 'PH', name: 'Philippines',             dial: '+63'  },
    { code: 'PL', name: 'Poland',                  dial: '+48'  },
    { code: 'PT', name: 'Portugal',                dial: '+351' },
    { code: 'QA', name: 'Qatar',                   dial: '+974' },
    { code: 'RO', name: 'Romania',                 dial: '+40'  },
    { code: 'RU', name: 'Russia',                  dial: '+7'   },
    { code: 'SA', name: 'Saudi Arabia',            dial: '+966' },
    { code: 'RS', name: 'Serbia',                  dial: '+381' },
    { code: 'ZA', name: 'South Africa',            dial: '+27'  },
    { code: 'KR', name: 'South Korea',             dial: '+82'  },
    { code: 'ES', name: 'Spain',                   dial: '+34'  },
    { code: 'LK', name: 'Sri Lanka',               dial: '+94'  },
    { code: 'SE', name: 'Sweden',                  dial: '+46'  },
    { code: 'CH', name: 'Switzerland',             dial: '+41'  },
    { code: 'TW', name: 'Taiwan',                  dial: '+886' },
    { code: 'TH', name: 'Thailand',                dial: '+66'  },
    { code: 'TR', name: 'Turkey',                  dial: '+90'  },
    { code: 'UA', name: 'Ukraine',                 dial: '+380' },
    { code: 'VN', name: 'Vietnam',                 dial: '+84'  },
    { code: 'YE', name: 'Yemen',                   dial: '+967' },
];

// Parse a stored phone string into { dialCode, number }
const parsePhone = (raw: string) => {
    if (!raw.startsWith('+')) return { dialCode: '+91', number: raw };
    const match = [...COUNTRIES]
        .sort((a, b) => b.dial.length - a.dial.length)
        .find(c => raw.startsWith(c.dial));
    return match
        ? { dialCode: match.dial, number: raw.slice(match.dial.length).trim() }
        : { dialCode: '+91', number: raw };
};
// ─────────────────────────────────────────────────────────────────────────────

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    bio: string;
    address_line: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
}

interface PasswordData {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

export default function ProfilePage() {
    const theme = useTheme();
    const { user, updateUser, logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dialCode, setDialCode] = useState('+91');

    const [formData, setFormData] = useState<FormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bio: '',
        address_line: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
    });

    const [passwordDialog, setPasswordDialog] = useState(false);
    const [passwordData, setPasswordData] = useState<PasswordData>({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        fetchProfile();
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        try {
            setPaymentsLoading(true);
            const data = await getPaymentHistory();
            setPayments(data);
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setPaymentsLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await profileService.getProfile();
            if (response.status === 'success' && response.data) {
                setProfileData(response.data);
                let addressData = { address_line: '', city: '', state: '', country: '', pincode: '' };
                if (response.data.location) {
                    try { addressData = JSON.parse(response.data.location); } catch (e) {}
                }
                const { dialCode: parsedDial, number: parsedNumber } = parsePhone(response.data.phone || '');
                setDialCode(parsedDial);
                setFormData({
                    first_name: response.data.first_name || '',
                    last_name: response.data.last_name || '',
                    email: response.data.email || '',
                    phone: parsedNumber,
                    bio: response.data.bio || '',
                    address_line: addressData.address_line || '',
                    city: addressData.city || '',
                    state: addressData.state || '',
                    country: addressData.country || '',
                    pincode: addressData.pincode || '',
                });
            }
        } catch (error: any) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to load profile', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const locationJson = JSON.stringify({
                address_line: formData.address_line,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
            });
            const response = await profileService.updateProfile({
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: dialCode + formData.phone,
                bio: formData.bio,
                location: locationJson,
            } as any);
            if (response.status === 'success') {
                setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
                setEditMode(false);
                updateUser({ ...user!, first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone });
                fetchProfile();
            }
        } catch (error: any) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update profile', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setSnackbar({ open: true, message: 'File size must be less than 5MB', severity: 'error' });
            return;
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setSnackbar({ open: true, message: 'Only JPEG and PNG files are allowed', severity: 'error' });
            return;
        }
        try {
            setAvatarUploading(true);
            const response = await profileService.uploadAvatar(file);
            if (response.status === 'success') {
                setSnackbar({ open: true, message: 'Avatar updated successfully', severity: 'success' });
                if (response.data?.avatar) {
                    updateUser({ ...user!, avatar: response.data.avatar });
                }
                fetchProfile();
            }
        } catch (error: any) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to upload avatar', severity: 'error' });
        } finally {
            setAvatarUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('Passwords do not match');
            return;
        }
        if (passwordData.new_password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        setPasswordError('');
        try {
            setChangingPassword(true);
            const response = await profileService.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            if (response.status === 'success') {
                setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
                setPasswordDialog(false);
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            }
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMobileOpen(false);
    };

    const getAvatarUrl = (avatar: string | null | undefined) => {
        if (!avatar) return undefined;
        if (avatar.startsWith('http')) return avatar;
        return `${STATIC_ASSETS_BASE_URL}${avatar}`;
    };

    const inputSx = {
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : theme.palette.grey[50],
    };

    const sidebarContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, px: 1 }}>
                Account
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                    startIcon={<PersonIcon />}
                    onClick={() => scrollToSection('personal')}
                    sx={{ justifyContent: 'flex-start', color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1), fontWeight: 600, textTransform: 'none', px: 2, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                >
                    Personal Info
                </Button>
                <Button
                    startIcon={<LockIcon />}
                    onClick={() => scrollToSection('security')}
                    sx={{ justifyContent: 'flex-start', color: 'text.secondary', fontWeight: 600, textTransform: 'none', px: 2, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: theme.palette.action.hover, color: 'text.primary' } }}
                >
                    Security
                </Button>
                <Button
                    startIcon={<CreditCardIcon />}
                    onClick={() => scrollToSection('billing')}
                    sx={{ justifyContent: 'flex-start', color: 'text.secondary', fontWeight: 600, textTransform: 'none', px: 2, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: theme.palette.action.hover, color: 'text.primary' } }}
                >
                    Payment History
                </Button>
            </Box>

            <Box sx={{ mt: 'auto', pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    fullWidth
                    sx={{ justifyContent: 'flex-start', color: theme.palette.error.main, fontWeight: 600, textTransform: 'none', px: 2, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                >
                    Sign Out
                </Button>
            </Box>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box component="main" sx={{ flexGrow: 1, height: '100%', maxWidth: 1440, mx: 'auto', width: '100%', p: { xs: 2, md: 4 } }}>
            {/* Mobile Hamburger */}
            <Box sx={{ display: { lg: 'none' }, mb: 2 }}>
                <IconButton onClick={() => setMobileOpen(true)}>
                    <MenuIcon />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>

                {/* Desktop Sidebar */}
                <Box component="aside" sx={{ width: 280, flexShrink: 0, display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
                    {sidebarContent}
                </Box>

                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 } }}
                >
                    {sidebarContent}
                </Drawer>

                {/* Main Content */}
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>

                    {/* Avatar Card */}
                    <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
                        <Box sx={{ position: 'relative' }}>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/jpeg,image/png" style={{ display: 'none' }} />
                            <Avatar
                                src={getAvatarUrl(profileData?.avatar)}
                                sx={{ width: 96, height: 96, border: `4px solid ${theme.palette.background.paper}`, boxShadow: theme.shadows[1] }}
                            >
                                {avatarUploading ? <CircularProgress size={40} color="primary" /> : (formData.first_name?.[0] || 'U')}
                            </Avatar>
                            <IconButton
                                size="small"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarUploading}
                                sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: theme.palette.primary.main, color: 'white', border: `2px solid ${theme.palette.background.paper}`, '&:hover': { bgcolor: theme.palette.primary.dark } }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {formData.first_name} {formData.last_name}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {formData.email}
                            </Typography>
                        </Box>

                    </Card>

                    {/* Personal Information */}
                    <Box id="personal" sx={{ scrollMarginTop: '120px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>Personal Information</Typography>
                        <Card elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Bio</Typography>
                                    <TextField
                                        fullWidth multiline rows={3}
                                        placeholder="Tell us a little about yourself..."
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        disabled={!editMode}
                                        helperText="Brief description for your profile."
                                        InputProps={{ sx: inputSx }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>First Name</Typography>
                                    <TextField fullWidth value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} disabled={!editMode} InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Last Name</Typography>
                                    <TextField fullWidth value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} disabled={!editMode} InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Email Address</Typography>
                                    <TextField fullWidth value={formData.email} disabled InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Phone Number</Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : theme.palette.grey[50],
                                        '&:focus-within': { borderColor: 'primary.main', boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` },
                                        opacity: !editMode ? 0.6 : 1,
                                    }}>
                                        <Select
                                            value={dialCode}
                                            onChange={(e) => setDialCode(e.target.value)}
                                            disabled={!editMode}
                                            variant="standard"
                                            disableUnderline
                                            renderValue={(val) => {
                                                const c = COUNTRIES.find(x => x.dial === val);
                                                return (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0 }}>
                                                        <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{c ? getFlag(c.code) : '🏳'}</span>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{val}</Typography>
                                                    </Box>
                                                );
                                            }}
                                            sx={{ minWidth: 100, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 1.3, pr: '28px !important' } }}
                                            MenuProps={{ PaperProps: { sx: { maxHeight: 320, width: 280 } } }}
                                        >
                                            {COUNTRIES.map((c) => (
                                                <MenuItem key={`${c.code}-${c.dial}`} value={c.dial}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{getFlag(c.code)}</span>
                                                        <Typography variant="body2" sx={{ flex: 1 }}>{c.name}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>{c.dial}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <Divider orientation="vertical" flexItem sx={{ my: 0.75 }} />
                                        <InputBase
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={!editMode}
                                            placeholder="Enter phone number"
                                            inputProps={{ inputMode: 'tel' }}
                                            sx={{ flex: 1, px: 1.5, fontSize: '0.875rem' }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Address</Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField fullWidth label="Address Line" value={formData.address_line} onChange={(e) => setFormData({ ...formData, address_line: e.target.value })} disabled={!editMode} placeholder="Street address, P.O. box" InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField fullWidth label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!editMode} placeholder="City" InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField fullWidth label="State/Province" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} disabled={!editMode} placeholder="State/Province" InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField fullWidth label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} disabled={!editMode} placeholder="Country" InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField fullWidth label="Pincode/ZIP" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} disabled={!editMode} placeholder="Pincode/ZIP" InputProps={{ sx: inputSx }} />
                                </Grid>
                                <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    {editMode ? (
                                        <>
                                            <Button
                                                onClick={() => {
                                                    setEditMode(false);
                                                    let addressData = { address_line: '', city: '', state: '', country: '', pincode: '' };
                                                    if (profileData?.location) { try { addressData = JSON.parse(profileData.location); } catch (e) {} }
                                                    const { dialCode: pd, number: pn } = parsePhone(profileData?.phone || '');
                                                    setDialCode(pd);
                                                    setFormData({ first_name: profileData?.first_name || '', last_name: profileData?.last_name || '', email: profileData?.email || '', phone: pn, bio: profileData?.bio || '', ...addressData });
                                                }}
                                                sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button variant="contained" onClick={handleSaveProfile} disabled={saving} sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button variant="contained" onClick={() => setEditMode(true)} sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>
                                            Edit Profile
                                        </Button>
                                    )}
                                </Grid>
                            </Grid>
                        </Card>
                    </Box>

                    {/* Security */}
                    <Box id="security" sx={{ scrollMarginTop: '120px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>Security</Typography>
                        <Card elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>Change Password</Typography>
                                <Grid container spacing={3} sx={{ maxWidth: 640 }}>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>Current Password</Typography>
                                        <TextField
                                            fullWidth
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            InputProps={{
                                                sx: inputSx,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                                                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>New Password</Typography>
                                        <TextField
                                            fullWidth
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            InputProps={{ sx: inputSx }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>Confirm Password</Typography>
                                        <TextField
                                            fullWidth
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            InputProps={{ sx: inputSx }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Button
                                            variant="contained"
                                            color="inherit"
                                            onClick={() => setPasswordDialog(true)}
                                            sx={{ bgcolor: 'text.primary', color: 'background.paper', borderRadius: 2, fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: 'text.secondary' } }}
                                        >
                                            Update Password
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>
                    </Box>

                    {/* Payment History */}
                    <Box id="billing" sx={{ scrollMarginTop: '120px', pb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Payment History</Typography>
                        </Box>

                        {/* Stats Cards */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {(() => {
                                const completedPayments = payments.filter((p: any) => p.status === 'completed');
                                const totalSpent = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                                const lastPayment = completedPayments[0];
                                const currency = lastPayment?.currency || 'INR';
                                return (
                                    <>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, borderRadius: 3, p: 3, color: 'white', boxShadow: theme.shadows[4] }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, backdropFilter: 'blur(4px)' }}>
                                                        <WalletIcon />
                                                    </Box>
                                                    <Box sx={{ px: 1, py: 0.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                                                        All Time
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Total Spent</Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 700 }}>{currency} {(totalSpent / 100).toFixed(2)}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider, height: '100%' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, borderRadius: 2 }}>
                                                        <CheckCircleIcon />
                                                    </Box>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Last Payment</Typography>
                                                {lastPayment ? (
                                                    <>
                                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>{currency} {((lastPayment.amount || 0) / 100).toFixed(2)}</Typography>
                                                        <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600, display: 'block', mt: 0.5 }}>
                                                            Paid on {new Date(lastPayment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>-</Typography>
                                                )}
                                            </Card>
                                        </Grid>
                                    </>
                                );
                            })()}
                        </Grid>

                        {/* Transactions Table */}
                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: theme.palette.divider, overflow: 'hidden' }}>
                            <TableContainer>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : theme.palette.grey[50] }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Invoice</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paymentsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                    <CircularProgress size={24} />
                                                </TableCell>
                                            </TableRow>
                                        ) : payments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No payment history found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            payments.map((payment: any) => (
                                                <TableRow key={payment.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell sx={{ color: 'text.secondary' }}>
                                                        {new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                        {payment.course?.title || `Course #${payment.course_id}`}
                                                    </TableCell>
                                                    <TableCell sx={{ color: 'text.secondary' }}>
                                                        {payment.currency} {((payment.amount || 0) / 100).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, borderRadius: 10,
                                                            bgcolor: payment.status === 'completed' ? alpha(theme.palette.success.main, 0.1) :
                                                                     payment.status === 'pending' ? alpha(theme.palette.warning.main, 0.1) :
                                                                     payment.status === 'refunded' ? alpha(theme.palette.info.main, 0.1) :
                                                                     alpha(theme.palette.error.main, 0.1),
                                                            color: payment.status === 'completed' ? theme.palette.success.dark :
                                                                   payment.status === 'pending' ? theme.palette.warning.dark :
                                                                   payment.status === 'refunded' ? theme.palette.info.dark :
                                                                   theme.palette.error.dark,
                                                            fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize'
                                                        }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                                            {payment.status}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" disabled={!payment.receipt}>
                                                            <DownloadIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="caption" color="text.secondary">
                                    {payments.length > 0 ? `Showing all ${payments.length} transaction${payments.length !== 1 ? 's' : ''}` : 'No transactions'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="outlined" size="small" disabled sx={{ color: 'text.secondary', borderColor: theme.palette.divider }}>Previous</Button>
                                    <Button variant="outlined" size="small" disabled={payments.length <= 5} sx={{ color: 'text.secondary', borderColor: theme.palette.divider }}>Next</Button>
                                </Box>
                            </Box>
                        </Card>
                    </Box>

                </Box>
            </Box>

            {/* Change Password Dialog */}
            <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Change Password</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Current Password</Typography>
                            <TextField
                                fullWidth
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                                                {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>New Password</Typography>
                            <TextField
                                fullWidth
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Confirm New Password</Typography>
                            <TextField
                                fullWidth
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                error={!!passwordError}
                                helperText={passwordError}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPasswordDialog(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                    >
                        {changingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}


