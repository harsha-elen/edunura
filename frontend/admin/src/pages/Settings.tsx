import React, { useState, useEffect } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Select,
    MenuItem,
    Divider,
    Tabs,
    Tab,
    Breadcrumbs,
    Link,
    FormControl,
    InputAdornment,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    NavigateNext as NavigateNextIcon,
    Tune as TuneIcon,
    Notifications as NotificationsIcon,
    CreditCard as CreditCardIcon,
    Extension as ExtensionIcon,
    Badge as BadgeIcon,
    Mail as MailIcon,
    CloudUpload as CloudUploadIcon,
    Public as PublicIcon,
    Palette as PaletteIcon,
    Info as InfoIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContext';
import { updateSetting, sendTestEmail as sendTestEmailAPI, getSettings, getZoomAccount } from '../services/settings';
import apiClient, { STATIC_ASSETS_BASE_URL } from '../services/apiClient';
import { alpha } from '@mui/material/styles';

const Settings: React.FC = () => {
    // Check if user is admin
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;

    // Redirect moderators to dashboard
    if (userData?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const [tab, setTab] = useState(0);
    const { primaryColor, updatePrimaryColor } = useThemeContext();
    const [selectedColor, setSelectedColor] = useState(primaryColor);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Razorpay Settings state
    const [razorpaySettings, setRazorpaySettings] = useState({
        enabled: 'false',
        testMode: 'true',
        keyId: '',
        keySecret: '',
        webhookSecret: ''
    });

    // Zoom Settings state
    const [zoomSettings, setZoomSettings] = useState({
        accountId: '',
        clientId: '',
        clientSecret: ''
    });

    // Zoom Account Info state
    const [zoomAccountInfo, setZoomAccountInfo] = useState<{
        email: string;
        planType: string;
        type: number;
        firstName: string;
        lastName: string;
    } | null>(null);
    const [isRefreshingZoom, setIsRefreshingZoom] = useState(false);
    const [showZoomInfo, setShowZoomInfo] = useState(false);

    // Site Settings state
    const [organizationSettings, setOrganizationSettings] = useState({
        site_name: '',
        site_tagline: '',
        org_support_email: '',
        org_logo: '',
        site_favicon: ''
    });

    // Localization state
    const [localizationSettings, setLocalizationSettings] = useState({
        timezone: 'GMT-05:00',
        language: 'en',
        currency: 'USD',
        date_format: 'mdy'
    });

    // Email settings state
    const [emailSettings, setEmailSettings] = useState({
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_pass: '',
        from_name: '',
        from_address: '',
        encryption: 'tls'
    });
    const [testEmail, setTestEmail] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);

    // File upload states
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const faviconInputRef = React.useRef<HTMLInputElement>(null);

    // Function to fetch Zoom account info
    const fetchZoomAccount = async () => {
        try {
            const response = await getZoomAccount();
            if (response.status === 'success' && response.data) {
                setZoomAccountInfo(response.data);
                setShowZoomInfo(true);
            }
        } catch (error) {
            console.error('Failed to fetch Zoom account:', error);
            // Don't show error if credentials not set yet
        }
    };

    // Sync local state with global theme when it loads
    useEffect(() => {
        setSelectedColor(primaryColor);
    }, [primaryColor]);

    // Load all settings on mount
    useEffect(() => {
        const loadAllSettings = async () => {
            try {
                const response = await getSettings();
                if (response.status === 'success' && response.data) {
                    // Load site settings
                    setOrganizationSettings({
                        site_name: response.data['site_name'] || '',
                        site_tagline: response.data['site_tagline'] || '',
                        org_support_email: response.data['org_support_email'] || '',
                        org_logo: response.data['org_logo'] || '',
                        site_favicon: response.data['site_favicon'] || ''
                    });

                    // Load localization settings
                    setLocalizationSettings({
                        timezone: response.data['localization_timezone'] || 'GMT-05:00',
                        language: response.data['localization_language'] || 'en',
                        currency: response.data['localization_currency'] || 'USD',
                        date_format: response.data['localization_date_format'] || 'mdy'
                    });

                    // Load email settings
                    setEmailSettings({
                        smtp_host: response.data['email_smtp_host'] || '',
                        smtp_port: response.data['email_smtp_port'] || '587',
                        smtp_user: response.data['email_smtp_user'] || '',
                        smtp_pass: response.data['email_smtp_pass'] || '',
                        from_name: response.data['email_from_name'] || '',
                        from_address: response.data['email_from_address'] || '',
                        encryption: response.data['email_encryption'] || 'tls'
                    });

                    // Load branding color
                    if (response.data['branding_primary_color']) {
                        setSelectedColor(response.data['branding_primary_color']);
                        updatePrimaryColor(response.data['branding_primary_color']);
                    }

                    // Load Zoom settings
                    const zoomAccountId = response.data['zoom_account_id'] || '';
                    const zoomClientId = response.data['zoom_client_id'] || '';
                    const zoomClientSecret = response.data['zoom_client_secret'] || '';

                    setZoomSettings({
                        accountId: zoomAccountId,
                        clientId: zoomClientId,
                        clientSecret: zoomClientSecret
                    });

                    // Auto-fetch Zoom account info if credentials exist
                    if (zoomAccountId && zoomClientId && zoomClientSecret) {
                        fetchZoomAccount();
                    }

                    // Load Razorpay settings
                    setRazorpaySettings({
                        enabled: response.data['razorpay_enabled'] || 'false',
                        testMode: response.data['razorpay_test_mode'] || 'true',
                        keyId: response.data['razorpay_key_id'] || '',
                        keySecret: response.data['razorpay_key_secret'] || '',
                        webhookSecret: response.data['razorpay_webhook_secret'] || ''
                    });
                }
            } catch (error) {
                console.error('Failed to load settings', error);
            }
        };
        loadAllSettings();
    }, []);

    const colors = [
        { name: 'Blue', value: '#2b8cee' },
        { name: 'Purple', value: '#7c3aed' },
        { name: 'Green', value: '#10b981' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Dark', value: '#1e293b' },
        { name: 'Indigo', value: '#4f5bd5' },
        { name: 'Teal', value: '#1fa3a3' },
        { name: 'Purple-Blue', value: '#5b7cfa' },
    ];

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (tab === 0) {
                // General tab - save Site Settings, Localization, and Branding
                await Promise.all([
                    // Site Settings
                    updateSetting('site_name', organizationSettings.site_name, 'organization', 'Site Name'),
                    updateSetting('site_tagline', organizationSettings.site_tagline, 'organization', 'Site Tagline'),
                    updateSetting('org_support_email', organizationSettings.org_support_email, 'organization', 'Support Email'),
                    // Localization
                    updateSetting('localization_timezone', localizationSettings.timezone, 'localization', 'Default Timezone'),
                    updateSetting('localization_language', localizationSettings.language, 'localization', 'Default Language'),
                    updateSetting('localization_currency', localizationSettings.currency, 'localization', 'Currency'),
                    updateSetting('localization_date_format', localizationSettings.date_format, 'localization', 'Date Format'),
                    // Branding
                    updateSetting('branding_primary_color', selectedColor, 'branding', 'Primary brand color')
                ]);
                updatePrimaryColor(selectedColor);
            } else if (tab === 4) {
                // Email tab
                await Promise.all([
                    updateSetting('email_smtp_host', emailSettings.smtp_host, 'email', 'SMTP Host'),
                    updateSetting('email_smtp_port', emailSettings.smtp_port, 'email', 'SMTP Port'),
                    updateSetting('email_smtp_user', emailSettings.smtp_user, 'email', 'SMTP User'),
                    updateSetting('email_smtp_pass', emailSettings.smtp_pass, 'email', 'SMTP Password'),
                    updateSetting('email_from_name', emailSettings.from_name, 'email', 'From Name'),
                    updateSetting('email_from_address', emailSettings.from_address, 'email', 'From Email'),
                    updateSetting('email_encryption', emailSettings.encryption, 'email', 'Encryption')
                ]);
            } else if (tab === 3) {
                // Integrations tab (Zoom)
                await Promise.all([
                    updateSetting('zoom_account_id', zoomSettings.accountId, 'zoom', 'Zoom Account ID'),
                    updateSetting('zoom_client_id', zoomSettings.clientId, 'zoom', 'Zoom Client ID'),
                    updateSetting('zoom_client_secret', zoomSettings.clientSecret, 'zoom', 'Zoom Client Secret')
                ]);
                // Fetch Zoom account info after saving
                await fetchZoomAccount();
            } else if (tab === 2) {
                // Payments tab (Razorpay)
                await Promise.all([
                    updateSetting('razorpay_enabled', razorpaySettings.enabled, 'payment', 'Razorpay Enabled'),
                    updateSetting('razorpay_test_mode', razorpaySettings.testMode, 'payment', 'Razorpay Test Mode'),
                    updateSetting('razorpay_key_id', razorpaySettings.keyId, 'payment', 'Razorpay Key ID'),
                    updateSetting('razorpay_key_secret', razorpaySettings.keySecret, 'payment', 'Razorpay Key Secret'),
                    updateSetting('razorpay_webhook_secret', razorpaySettings.webhookSecret, 'payment', 'Razorpay Webhook Secret')
                ]);
            }
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to save settings', error);
            setErrorMessage('Failed to save settings');
            setShowError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEmailSettings = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                updateSetting('email_smtp_host', emailSettings.smtp_host, 'email', 'SMTP Host'),
                updateSetting('email_smtp_port', emailSettings.smtp_port, 'email', 'SMTP Port'),
                updateSetting('email_smtp_user', emailSettings.smtp_user, 'email', 'SMTP User'),
                updateSetting('email_smtp_pass', emailSettings.smtp_pass, 'email', 'SMTP Password'),
                updateSetting('email_from_name', emailSettings.from_name, 'email', 'From Name'),
                updateSetting('email_from_address', emailSettings.from_address, 'email', 'From Email'),
                updateSetting('email_encryption', emailSettings.encryption, 'email', 'Encryption')
            ]);
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to save email settings', error);
            setErrorMessage('Failed to save email settings');
            setShowError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRefreshZoom = async () => {
        setIsRefreshingZoom(true);
        try {
            await fetchZoomAccount();
        } catch (error) {
            console.error('Failed to refresh Zoom account:', error);
            setErrorMessage('Failed to refresh Zoom account information');
            setShowError(true);
        } finally {
            setIsRefreshingZoom(false);
        }
    };

    const handleFileUpload = async (file: File, fieldType: 'logo' | 'favicon') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fieldType', fieldType);

        try {
            if (fieldType === 'logo') {
                setIsUploadingLogo(true);
            } else {
                setIsUploadingFavicon(true);
            }

            const response = await apiClient.post('/settings/upload', formData);
            const data = response.data;

            if (data.status === 'success') {
                // Update local state with new file path
                setOrganizationSettings({
                    ...organizationSettings,
                    [fieldType === 'logo' ? 'org_logo' : 'site_favicon']: data.data.path
                });
                setShowSuccess(true);
            } else {
                setErrorMessage(data.message || 'Upload failed');
                setShowError(true);
            }
        } catch (error) {
            console.error('File upload error:', error);
            setErrorMessage('Failed to upload file');
            setShowError(true);
        } finally {
            if (fieldType === 'logo') {
                setIsUploadingLogo(false);
            } else {
                setIsUploadingFavicon(false);
            }
        }
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setErrorMessage('File size must be less than 2MB');
                setShowError(true);
                return;
            }
            handleFileUpload(file, 'logo');
        }
    };

    const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setErrorMessage('File size must be less than 2MB');
                setShowError(true);
                return;
            }
            handleFileUpload(file, 'favicon');
        }
    };

    const handleRemoveLogo = async () => {
        try {
            await updateSetting('org_logo', '', 'organization', 'Organization Logo');
            setOrganizationSettings({ ...organizationSettings, org_logo: '' });
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to remove logo', error);
            setErrorMessage('Failed to remove logo');
            setShowError(true);
        }
    };

    const handleRemoveFavicon = async () => {
        try {
            await updateSetting('site_favicon', '', 'organization', 'Site Favicon');
            setOrganizationSettings({ ...organizationSettings, site_favicon: '' });
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to remove favicon', error);
            setErrorMessage('Failed to remove favicon');
            setShowError(true);
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmail) {
            setErrorMessage('Please enter an email address');
            setShowError(true);
            return;
        }
        setIsSendingTest(true);
        try {
            const response = await sendTestEmailAPI(testEmail);
            if (response.status === 'success') {
                setShowSuccess(true);
            }
        } catch (error: any) {
            console.error('Failed to send test email', error);
            setErrorMessage(error.response?.data?.message || 'Failed to send test email');
            setShowError(true);
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <Box sx={{ pb: 10 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                >
                    <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">Home</Link>
                    <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">Admin</Link>
                    <Typography color="text.primary">Settings</Typography>
                </Breadcrumbs>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b', fontSize: '1.875rem' }}>
                    Organization Settings
                </Typography>
                <Typography variant="body1" sx={{ color: '#4c739a', mt: 1 }}>
                    Manage your organization details, branding, and global preferences.
                </Typography>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs value={tab} onChange={handleTabChange} aria-label="settings tabs">
                    <Tab icon={<TuneIcon />} iconPosition="start" label="General" sx={{ minHeight: 64, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                    <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" sx={{ minHeight: 64, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                    <Tab icon={<CreditCardIcon />} iconPosition="start" label="Payments" sx={{ minHeight: 64, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                    <Tab icon={<ExtensionIcon />} iconPosition="start" label="Integrations" sx={{ minHeight: 64, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                    <Tab icon={<MailIcon />} iconPosition="start" label="Email" sx={{ minHeight: 64, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                </Tabs>
            </Box>

            <Grid container spacing={3}>
                {/* Integrations Tab */}
                {tab === 3 && (
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Integrations</Typography>
                                    <Typography variant="caption" sx={{ color: '#4c739a' }}>Connect with third-party services to extend functionality.</Typography>
                                </Box>
                                <ExtensionIcon sx={{ color: '#94a3b8' }} />
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    {/* Zoom Integration */}
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Zoom Integration</Typography>
                                            <InfoIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                                            Connect your Zoom account (Server-to-Server OAuth) to schedule and manage live classes directly from the LMS.
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Zoom Account ID"
                                                value={zoomSettings.accountId}
                                                onChange={(e) => setZoomSettings({ ...zoomSettings, accountId: e.target.value })}
                                                placeholder="Enter Account ID"
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Zoom Client ID"
                                                value={zoomSettings.clientId}
                                                onChange={(e) => setZoomSettings({ ...zoomSettings, clientId: e.target.value })}
                                                placeholder="Enter Client ID"
                                            />
                                        </Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Zoom Client Secret"
                                            type="password"
                                            value={zoomSettings.clientSecret}
                                            onChange={(e) => setZoomSettings({ ...zoomSettings, clientSecret: e.target.value })}
                                            placeholder="Enter Client Secret"
                                            sx={{ mb: 3 }}
                                        />

                                        <Divider sx={{ my: 2 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<SaveIcon />}
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: 'none',
                                                    bgcolor: primaryColor,
                                                    '&:hover': { bgcolor: alpha(primaryColor, 0.9), boxShadow: 'none' }
                                                }}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </Box>

                                        {/* Zoom Account Info */}
                                        {showZoomInfo && zoomAccountInfo && (
                                            <Box
                                                sx={{
                                                    mt: 3,
                                                    p: 2,
                                                    bgcolor: zoomAccountInfo.type === 1 ? alpha('#f97316', 0.1) : alpha('#10b981', 0.1),
                                                    border: `1px solid ${zoomAccountInfo.type === 1 ? alpha('#f97316', 0.3) : alpha('#10b981', 0.3)}`,
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: 2
                                                }}
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: zoomAccountInfo.type === 1 ? '#f97316' : '#10b981',
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        {zoomAccountInfo.type === 1 ? '⚠️ Basic (Free) Account' : '✅ Pro Account'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                                                        You're on{' '}
                                                        <Box component="span" sx={{ fontWeight: 600 }}>
                                                            {zoomAccountInfo.planType}
                                                        </Box>{' '}
                                                        plan. Meeting limit:{' '}
                                                        <Box component="span" sx={{ fontWeight: 600 }}>
                                                            {zoomAccountInfo.type === 1 ? '40 minutes for group meetings' : 'Up to 24 hours'}
                                                        </Box>
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', mt: 0.5 }}>
                                                        Account: {zoomAccountInfo.email}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    size="small"
                                                    startIcon={isRefreshingZoom ? <CircularProgress size={16} /> : <RefreshIcon />}
                                                    onClick={handleRefreshZoom}
                                                    disabled={isRefreshingZoom}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        color: primaryColor,
                                                        '&:hover': {
                                                            bgcolor: alpha(primaryColor, 0.1)
                                                        }
                                                    }}
                                                >
                                                    {isRefreshingZoom ? 'Refreshing...' : 'Refresh'}
                                                </Button>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Grid>
                )}
                {/* Payments Tab */}
                {tab === 2 && (
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Payment Gateway</Typography>
                                    <Typography variant="caption" sx={{ color: '#4c739a' }}>Configure Razorpay to accept payments for paid courses.</Typography>
                                </Box>
                                <CreditCardIcon sx={{ color: '#94a3b8' }} />
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    {/* Enable / Test Mode toggles */}
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Enable Razorpay</Typography>
                                        </Box>
                                        <Select
                                            fullWidth
                                            size="small"
                                            value={razorpaySettings.enabled}
                                            onChange={(e) => setRazorpaySettings({ ...razorpaySettings, enabled: e.target.value })}
                                        >
                                            <MenuItem value="true">Enabled</MenuItem>
                                            <MenuItem value="false">Disabled</MenuItem>
                                        </Select>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Mode</Typography>
                                        </Box>
                                        <Select
                                            fullWidth
                                            size="small"
                                            value={razorpaySettings.testMode}
                                            onChange={(e) => setRazorpaySettings({ ...razorpaySettings, testMode: e.target.value })}
                                        >
                                            <MenuItem value="true">Test Mode</MenuItem>
                                            <MenuItem value="false">Live Mode</MenuItem>
                                        </Select>
                                    </Grid>

                                    {/* API Credentials */}
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>API Credentials</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                                            Enter your Razorpay {razorpaySettings.testMode === 'true' ? 'Test' : 'Live'} API keys. You can find them in your Razorpay Dashboard → Settings → API Keys.
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Key ID"
                                            value={razorpaySettings.keyId}
                                            onChange={(e) => setRazorpaySettings({ ...razorpaySettings, keyId: e.target.value })}
                                            placeholder={razorpaySettings.testMode === 'true' ? 'rzp_test_xxxxxxxxxxxxxxx' : 'rzp_live_xxxxxxxxxxxxxxx'}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Key Secret"
                                            type="password"
                                            value={razorpaySettings.keySecret}
                                            onChange={(e) => setRazorpaySettings({ ...razorpaySettings, keySecret: e.target.value })}
                                            placeholder="Enter Key Secret"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Webhook Secret"
                                            type="password"
                                            value={razorpaySettings.webhookSecret}
                                            onChange={(e) => setRazorpaySettings({ ...razorpaySettings, webhookSecret: e.target.value })}
                                            placeholder="Enter Webhook Secret (optional)"
                                            helperText="Used to validate incoming webhook events from Razorpay"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<SaveIcon />}
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: 'none',
                                                    bgcolor: primaryColor,
                                                    '&:hover': { bgcolor: alpha(primaryColor, 0.9), boxShadow: 'none' }
                                                }}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Payment Settings'}
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>

                        {/* Info box */}

                    </Grid>
                )}
                {/* General Tab */}
                {tab === 0 && (
                    <>
                        <Grid item xs={12} lg={8}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                                {/* Site Settings Card */}
                                <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Site Settings</Typography>
                                            <Typography variant="caption" sx={{ color: '#4c739a' }}>Configure your site's basic information.</Typography>
                                        </Box>
                                        <BadgeIcon sx={{ color: '#94a3b8' }} />
                                    </Box>
                                    <Box sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <FormControl fullWidth>
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Site Name</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={organizationSettings.site_name}
                                                        onChange={(e) => setOrganizationSettings({ ...organizationSettings, site_name: e.target.value })}
                                                        placeholder="Enter site name"
                                                        variant="outlined"
                                                    />
                                                </FormControl>
                                                <FormControl fullWidth>
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Site Tagline</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={organizationSettings.site_tagline}
                                                        onChange={(e) => setOrganizationSettings({ ...organizationSettings, site_tagline: e.target.value })}
                                                        placeholder="A short tagline for your site"
                                                        variant="outlined"
                                                    />
                                                </FormControl>
                                                <FormControl fullWidth>
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Support Email</Typography>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={organizationSettings.org_support_email}
                                                        onChange={(e) => setOrganizationSettings({ ...organizationSettings, org_support_email: e.target.value })}
                                                        placeholder="support@company.com"
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <MailIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                    />
                                                </FormControl>
                                            </Box>

                                            {/* Logo & Favicon Upload Column */}
                                            <Box sx={{ width: { sm: '33%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {/* Logo Upload */}
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Logo</Typography>
                                                    <input
                                                        type="file"
                                                        ref={logoInputRef}
                                                        accept="image/jpeg,image/jpg,image/png"
                                                        style={{ display: 'none' }}
                                                        onChange={handleLogoChange}
                                                    />
                                                    {isUploadingLogo ? (
                                                        <Box sx={{
                                                            border: '2px dashed #cbd5e1',
                                                            borderRadius: 2,
                                                            p: 2,
                                                            textAlign: 'center',
                                                            minHeight: '100px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <CircularProgress size={40} />
                                                        </Box>
                                                    ) : organizationSettings.org_logo ? (
                                                        <Box sx={{
                                                            border: '1px solid #e7edf3',
                                                            borderRadius: 2,
                                                            p: 2,
                                                            textAlign: 'center',
                                                            position: 'relative',
                                                            bgcolor: '#f8fafc'
                                                        }}>
                                                            <img
                                                                src={`${STATIC_ASSETS_BASE_URL}${organizationSettings.org_logo.startsWith('/') ? organizationSettings.org_logo : '/' + organizationSettings.org_logo}`}
                                                                alt="Logo"
                                                                style={{ maxWidth: '100%', maxHeight: '80px', marginBottom: '8px' }}
                                                            />
                                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<EditIcon />}
                                                                    onClick={() => logoInputRef.current?.click()}
                                                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    startIcon={<CloseIcon />}
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                                                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        <Box
                                                            onClick={() => logoInputRef.current?.click()}
                                                            sx={{
                                                                border: '2px dashed #cbd5e1',
                                                                borderRadius: 2,
                                                                p: 2,
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                                minHeight: '100px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                '&:hover': { bgcolor: '#f8fafc', borderColor: primaryColor }
                                                            }}
                                                        >
                                                            <CloudUploadIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 0.5 }} />
                                                            <Typography variant="body2" sx={{ color: primaryColor, fontWeight: 500, fontSize: '0.8rem' }}>Upload Logo</Typography>
                                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>PNG, JPG up to 2MB</Typography>
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* Favicon Upload */}
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Favicon</Typography>
                                                    <input
                                                        type="file"
                                                        ref={faviconInputRef}
                                                        accept="image/x-icon,image/vnd.microsoft.icon,image/png"
                                                        style={{ display: 'none' }}
                                                        onChange={handleFaviconChange}
                                                    />
                                                    {isUploadingFavicon ? (
                                                        <Box sx={{
                                                            border: '2px dashed #cbd5e1',
                                                            borderRadius: 2,
                                                            p: 2,
                                                            textAlign: 'center',
                                                            minHeight: '100px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <CircularProgress size={40} />
                                                        </Box>
                                                    ) : organizationSettings.site_favicon ? (
                                                        <Box sx={{
                                                            border: '1px solid #e7edf3',
                                                            borderRadius: 2,
                                                            p: 2,
                                                            textAlign: 'center',
                                                            position: 'relative',
                                                            bgcolor: '#f8fafc'
                                                        }}>
                                                            <img
                                                                src={`${STATIC_ASSETS_BASE_URL}${organizationSettings.site_favicon.startsWith('/') ? organizationSettings.site_favicon : '/' + organizationSettings.site_favicon}`}
                                                                alt="Favicon"
                                                                style={{ maxWidth: '32px', maxHeight: '32px', marginBottom: '8px' }}
                                                            />
                                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<EditIcon />}
                                                                    onClick={() => faviconInputRef.current?.click()}
                                                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    startIcon={<CloseIcon />}
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveFavicon(); }}
                                                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        <Box
                                                            onClick={() => faviconInputRef.current?.click()}
                                                            sx={{
                                                                border: '2px dashed #cbd5e1',
                                                                borderRadius: 2,
                                                                p: 2,
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                                minHeight: '100px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                '&:hover': { bgcolor: '#f8fafc', borderColor: primaryColor }
                                                            }}
                                                        >
                                                            <CloudUploadIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 0.5 }} />
                                                            <Typography variant="body2" sx={{ color: primaryColor, fontWeight: 500, fontSize: '0.8rem' }}>Upload Favicon</Typography>
                                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>ICO, PNG 32x32px</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>

                                {/* Localization Card */}
                                <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Localization</Typography>
                                            <Typography variant="caption" sx={{ color: '#4c739a' }}>Set default region and time settings.</Typography>
                                        </Box>
                                        <PublicIcon sx={{ color: '#94a3b8' }} />
                                    </Box>
                                    <Box sx={{ p: 3 }}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Default Timezone</Typography>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    value={localizationSettings.timezone}
                                                    onChange={(e) => setLocalizationSettings({ ...localizationSettings, timezone: e.target.value })}
                                                >
                                                    <MenuItem value="GMT-12:00">(GMT-12:00) International Date Line West</MenuItem>
                                                    <MenuItem value="GMT-11:00">(GMT-11:00) Midway Island, Samoa</MenuItem>
                                                    <MenuItem value="GMT-10:00">(GMT-10:00) Hawaii</MenuItem>
                                                    <MenuItem value="GMT-09:00">(GMT-09:00) Alaska</MenuItem>
                                                    <MenuItem value="GMT-08:00">(GMT-08:00) Pacific Time (US & Canada)</MenuItem>
                                                    <MenuItem value="GMT-07:00">(GMT-07:00) Mountain Time (US & Canada)</MenuItem>
                                                    <MenuItem value="GMT-06:00">(GMT-06:00) Central Time (US & Canada)</MenuItem>
                                                    <MenuItem value="GMT-05:00">(GMT-05:00) Eastern Time (US & Canada)</MenuItem>
                                                    <MenuItem value="GMT-04:00">(GMT-04:00) Atlantic Time (Canada)</MenuItem>
                                                    <MenuItem value="GMT-03:30">(GMT-03:30) Newfoundland</MenuItem>
                                                    <MenuItem value="GMT-03:00">(GMT-03:00) Brasilia, Buenos Aires</MenuItem>
                                                    <MenuItem value="GMT-02:00">(GMT-02:00) Mid-Atlantic</MenuItem>
                                                    <MenuItem value="GMT-01:00">(GMT-01:00) Azores, Cape Verde Islands</MenuItem>
                                                    <MenuItem value="GMT+00:00">(GMT+00:00) London, Dublin, Lisbon</MenuItem>
                                                    <MenuItem value="GMT+01:00">(GMT+01:00) Paris, Berlin, Rome</MenuItem>
                                                    <MenuItem value="GMT+02:00">(GMT+02:00) Cairo, Athens, Helsinki</MenuItem>
                                                    <MenuItem value="GMT+03:00">(GMT+03:00) Moscow, Istanbul, Kuwait</MenuItem>
                                                    <MenuItem value="GMT+03:30">(GMT+03:30) Tehran</MenuItem>
                                                    <MenuItem value="GMT+04:00">(GMT+04:00) Abu Dhabi, Dubai, Baku</MenuItem>
                                                    <MenuItem value="GMT+04:30">(GMT+04:30) Kabul</MenuItem>
                                                    <MenuItem value="GMT+05:00">(GMT+05:00) Islamabad, Karachi, Tashkent</MenuItem>
                                                    <MenuItem value="GMT+05:30">(GMT+05:30) Mumbai, Kolkata, New Delhi</MenuItem>
                                                    <MenuItem value="GMT+05:45">(GMT+05:45) Kathmandu</MenuItem>
                                                    <MenuItem value="GMT+06:00">(GMT+06:00) Dhaka, Almaty</MenuItem>
                                                    <MenuItem value="GMT+06:30">(GMT+06:30) Yangon (Rangoon)</MenuItem>
                                                    <MenuItem value="GMT+07:00">(GMT+07:00) Bangkok, Hanoi, Jakarta</MenuItem>
                                                    <MenuItem value="GMT+08:00">(GMT+08:00) Beijing, Hong Kong, Singapore</MenuItem>
                                                    <MenuItem value="GMT+09:00">(GMT+09:00) Tokyo, Seoul, Osaka</MenuItem>
                                                    <MenuItem value="GMT+09:30">(GMT+09:30) Adelaide, Darwin</MenuItem>
                                                    <MenuItem value="GMT+10:00">(GMT+10:00) Sydney, Melbourne, Brisbane</MenuItem>
                                                    <MenuItem value="GMT+11:00">(GMT+11:00) Magadan, Solomon Islands</MenuItem>
                                                    <MenuItem value="GMT+12:00">(GMT+12:00) Auckland, Wellington, Fiji</MenuItem>
                                                    <MenuItem value="GMT+13:00">(GMT+13:00) Nuku'alofa</MenuItem>
                                                    <MenuItem value="GMT+14:00">(GMT+14:00) Kiritimati Island</MenuItem>
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Default Language</Typography>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    value={localizationSettings.language}
                                                    onChange={(e) => setLocalizationSettings({ ...localizationSettings, language: e.target.value })}
                                                >
                                                    <MenuItem value="en">English (US)</MenuItem>
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Currency</Typography>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    value={localizationSettings.currency}
                                                    onChange={(e) => setLocalizationSettings({ ...localizationSettings, currency: e.target.value })}
                                                >
                                                    <MenuItem value="AED">AED (د.إ) - UAE Dirham</MenuItem>
                                                    <MenuItem value="AFN">AFN (؋) - Afghan Afghani</MenuItem>
                                                    <MenuItem value="ALL">ALL (L) - Albanian Lek</MenuItem>
                                                    <MenuItem value="AMD">AMD (֏) - Armenian Dram</MenuItem>
                                                    <MenuItem value="ANG">ANG (ƒ) - Netherlands Antillean Guilder</MenuItem>
                                                    <MenuItem value="AOA">AOA (Kz) - Angolan Kwanza</MenuItem>
                                                    <MenuItem value="ARS">ARS ($) - Argentine Peso</MenuItem>
                                                    <MenuItem value="AUD">AUD ($) - Australian Dollar</MenuItem>
                                                    <MenuItem value="AWG">AWG (ƒ) - Aruban Florin</MenuItem>
                                                    <MenuItem value="AZN">AZN (₼) - Azerbaijani Manat</MenuItem>
                                                    <MenuItem value="BAM">BAM (KM) - Bosnia-Herzegovina Convertible Mark</MenuItem>
                                                    <MenuItem value="BBD">BBD ($) - Barbadian Dollar</MenuItem>
                                                    <MenuItem value="BDT">BDT (৳) - Bangladeshi Taka</MenuItem>
                                                    <MenuItem value="BGN">BGN (лв) - Bulgarian Lev</MenuItem>
                                                    <MenuItem value="BHD">BHD (.د.ب) - Bahraini Dinar</MenuItem>
                                                    <MenuItem value="BIF">BIF (Fr) - Burundian Franc</MenuItem>
                                                    <MenuItem value="BMD">BMD ($) - Bermudan Dollar</MenuItem>
                                                    <MenuItem value="BND">BND ($) - Brunei Dollar</MenuItem>
                                                    <MenuItem value="BOB">BOB (Bs.) - Bolivian Boliviano</MenuItem>
                                                    <MenuItem value="BRL">BRL (R$) - Brazilian Real</MenuItem>
                                                    <MenuItem value="BSD">BSD ($) - Bahamian Dollar</MenuItem>
                                                    <MenuItem value="BTN">BTN (Nu.) - Bhutanese Ngultrum</MenuItem>
                                                    <MenuItem value="BWP">BWP (P) - Botswanan Pula</MenuItem>
                                                    <MenuItem value="BYN">BYN (Br) - Belarusian Ruble</MenuItem>
                                                    <MenuItem value="BZD">BZD ($) - Belize Dollar</MenuItem>
                                                    <MenuItem value="CAD">CAD ($) - Canadian Dollar</MenuItem>
                                                    <MenuItem value="CDF">CDF (Fr) - Congolese Franc</MenuItem>
                                                    <MenuItem value="CHF">CHF (Fr) - Swiss Franc</MenuItem>
                                                    <MenuItem value="CLP">CLP ($) - Chilean Peso</MenuItem>
                                                    <MenuItem value="CNY">CNY (¥) - Chinese Yuan</MenuItem>
                                                    <MenuItem value="COP">COP ($) - Colombian Peso</MenuItem>
                                                    <MenuItem value="CRC">CRC (₡) - Costa Rican Colón</MenuItem>
                                                    <MenuItem value="CUP">CUP ($) - Cuban Peso</MenuItem>
                                                    <MenuItem value="CVE">CVE ($) - Cape Verdean Escudo</MenuItem>
                                                    <MenuItem value="CZK">CZK (Kč) - Czech Koruna</MenuItem>
                                                    <MenuItem value="DJF">DJF (Fr) - Djiboutian Franc</MenuItem>
                                                    <MenuItem value="DKK">DKK (kr) - Danish Krone</MenuItem>
                                                    <MenuItem value="DOP">DOP ($) - Dominican Peso</MenuItem>
                                                    <MenuItem value="DZD">DZD (د.ج) - Algerian Dinar</MenuItem>
                                                    <MenuItem value="EGP">EGP (£) - Egyptian Pound</MenuItem>
                                                    <MenuItem value="ERN">ERN (Nfk) - Eritrean Nakfa</MenuItem>
                                                    <MenuItem value="ETB">ETB (Br) - Ethiopian Birr</MenuItem>
                                                    <MenuItem value="EUR">EUR (€) - Euro</MenuItem>
                                                    <MenuItem value="FJD">FJD ($) - Fijian Dollar</MenuItem>
                                                    <MenuItem value="FKP">FKP (£) - Falkland Islands Pound</MenuItem>
                                                    <MenuItem value="FOK">FOK (kr) - Faroese Króna</MenuItem>
                                                    <MenuItem value="GBP">GBP (£) - British Pound Sterling</MenuItem>
                                                    <MenuItem value="GEL">GEL (₾) - Georgian Lari</MenuItem>
                                                    <MenuItem value="GGP">GGP (£) - Guernsey Pound</MenuItem>
                                                    <MenuItem value="GHS">GHS (₵) - Ghanaian Cedi</MenuItem>
                                                    <MenuItem value="GIP">GIP (£) - Gibraltar Pound</MenuItem>
                                                    <MenuItem value="GMD">GMD (D) - Gambian Dalasi</MenuItem>
                                                    <MenuItem value="GNF">GNF (Fr) - Guinean Franc</MenuItem>
                                                    <MenuItem value="GTQ">GTQ (Q) - Guatemalan Quetzal</MenuItem>
                                                    <MenuItem value="GYD">GYD ($) - Guyanaese Dollar</MenuItem>
                                                    <MenuItem value="HKD">HKD ($) - Hong Kong Dollar</MenuItem>
                                                    <MenuItem value="HNL">HNL (L) - Honduran Lempira</MenuItem>
                                                    <MenuItem value="HRK">HRK (kn) - Croatian Kuna</MenuItem>
                                                    <MenuItem value="HTG">HTG (G) - Haitian Gourde</MenuItem>
                                                    <MenuItem value="HUF">HUF (Ft) - Hungarian Forint</MenuItem>
                                                    <MenuItem value="IDR">IDR (Rp) - Indonesian Rupiah</MenuItem>
                                                    <MenuItem value="ILS">ILS (₪) - Israeli New Shekel</MenuItem>
                                                    <MenuItem value="IMP">IMP (£) - Isle of Man Pound</MenuItem>
                                                    <MenuItem value="INR">INR (₹) - Indian Rupee</MenuItem>
                                                    <MenuItem value="IQD">IQD (ع.د) - Iraqi Dinar</MenuItem>
                                                    <MenuItem value="IRR">IRR (﷼) - Iranian Rial</MenuItem>
                                                    <MenuItem value="ISK">ISK (kr) - Icelandic Króna</MenuItem>
                                                    <MenuItem value="JEP">JEP (£) - Jersey Pound</MenuItem>
                                                    <MenuItem value="JMD">JMD ($) - Jamaican Dollar</MenuItem>
                                                    <MenuItem value="JOD">JOD (د.ا) - Jordanian Dinar</MenuItem>
                                                    <MenuItem value="JPY">JPY (¥) - Japanese Yen</MenuItem>
                                                    <MenuItem value="KES">KES (Sh) - Kenyan Shilling</MenuItem>
                                                    <MenuItem value="KGS">KGS (с) - Kyrgystani Som</MenuItem>
                                                    <MenuItem value="KHR">KHR (៛) - Cambodian Riel</MenuItem>
                                                    <MenuItem value="KID">KID ($) - Kiribati Dollar</MenuItem>
                                                    <MenuItem value="KMF">KMF (Fr) - Comorian Franc</MenuItem>
                                                    <MenuItem value="KRW">KRW (₩) - South Korean Won</MenuItem>
                                                    <MenuItem value="KWD">KWD (د.ك) - Kuwaiti Dinar</MenuItem>
                                                    <MenuItem value="KYD">KYD ($) - Cayman Islands Dollar</MenuItem>
                                                    <MenuItem value="KZT">KZT (₸) - Kazakhstani Tenge</MenuItem>
                                                    <MenuItem value="LAK">LAK (₭) - Laotian Kip</MenuItem>
                                                    <MenuItem value="LBP">LBP (ل.ل) - Lebanese Pound</MenuItem>
                                                    <MenuItem value="LKR">LKR (Rs) - Sri Lankan Rupee</MenuItem>
                                                    <MenuItem value="LRD">LRD ($) - Liberian Dollar</MenuItem>
                                                    <MenuItem value="LSL">LSL (L) - Lesotho Loti</MenuItem>
                                                    <MenuItem value="LYD">LYD (ل.د) - Libyan Dinar</MenuItem>
                                                    <MenuItem value="MAD">MAD (د.م.) - Moroccan Dirham</MenuItem>
                                                    <MenuItem value="MDL">MDL (L) - Moldovan Leu</MenuItem>
                                                    <MenuItem value="MGA">MGA (Ar) - Malagasy Ariary</MenuItem>
                                                    <MenuItem value="MKD">MKD (ден) - Macedonian Denar</MenuItem>
                                                    <MenuItem value="MMK">MMK (Ks) - Myanmar Kyat</MenuItem>
                                                    <MenuItem value="MNT">MNT (₮) - Mongolian Tugrik</MenuItem>
                                                    <MenuItem value="MOP">MOP (P) - Macanese Pataca</MenuItem>
                                                    <MenuItem value="MRU">MRU (UM) - Mauritanian Ouguiya</MenuItem>
                                                    <MenuItem value="MUR">MUR (₨) - Mauritian Rupee</MenuItem>
                                                    <MenuItem value="MVR">MVR (ރ.) - Maldivian Rufiyaa</MenuItem>
                                                    <MenuItem value="MWK">MWK (MK) - Malawian Kwacha</MenuItem>
                                                    <MenuItem value="MXN">MXN ($) - Mexican Peso</MenuItem>
                                                    <MenuItem value="MYR">MYR (RM) - Malaysian Ringgit</MenuItem>
                                                    <MenuItem value="MZN">MZN (MT) - Mozambican Metical</MenuItem>
                                                    <MenuItem value="NAD">NAD ($) - Namibian Dollar</MenuItem>
                                                    <MenuItem value="NGN">NGN (₦) - Nigerian Naira</MenuItem>
                                                    <MenuItem value="NIO">NIO (C$) - Nicaraguan Córdoba</MenuItem>
                                                    <MenuItem value="NOK">NOK (kr) - Norwegian Krone</MenuItem>
                                                    <MenuItem value="NPR">NPR (₨) - Nepalese Rupee</MenuItem>
                                                    <MenuItem value="NZD">NZD ($) - New Zealand Dollar</MenuItem>
                                                    <MenuItem value="OMR">OMR (ر.ع.) - Omani Rial</MenuItem>
                                                    <MenuItem value="PAB">PAB (B/.) - Panamanian Balboa</MenuItem>
                                                    <MenuItem value="PEN">PEN (S/.) - Peruvian Sol</MenuItem>
                                                    <MenuItem value="PGK">PGK (K) - Papua New Guinean Kina</MenuItem>
                                                    <MenuItem value="PHP">PHP (₱) - Philippine Peso</MenuItem>
                                                    <MenuItem value="PKR">PKR (₨) - Pakistani Rupee</MenuItem>
                                                    <MenuItem value="PLN">PLN (zł) - Polish Zloty</MenuItem>
                                                    <MenuItem value="PYG">PYG (₲) - Paraguayan Guarani</MenuItem>
                                                    <MenuItem value="QAR">QAR (ر.ق) - Qatari Riyal</MenuItem>
                                                    <MenuItem value="RON">RON (lei) - Romanian Leu</MenuItem>
                                                    <MenuItem value="RSD">RSD (дин.) - Serbian Dinar</MenuItem>
                                                    <MenuItem value="RUB">RUB (₽) - Russian Ruble</MenuItem>
                                                    <MenuItem value="RWF">RWF (Fr) - Rwandan Franc</MenuItem>
                                                    <MenuItem value="SAR">SAR (ر.س) - Saudi Riyal</MenuItem>
                                                    <MenuItem value="SBD">SBD ($) - Solomon Islands Dollar</MenuItem>
                                                    <MenuItem value="SCR">SCR (₨) - Seychellois Rupee</MenuItem>
                                                    <MenuItem value="SDG">SDG (ج.س.) - Sudanese Pound</MenuItem>
                                                    <MenuItem value="SEK">SEK (kr) - Swedish Krona</MenuItem>
                                                    <MenuItem value="SGD">SGD ($) - Singapore Dollar</MenuItem>
                                                    <MenuItem value="SHP">SHP (£) - Saint Helena Pound</MenuItem>
                                                    <MenuItem value="SLE">SLE (Le) - Sierra Leonean Leone</MenuItem>
                                                    <MenuItem value="SOS">SOS (Sh) - Somali Shilling</MenuItem>
                                                    <MenuItem value="SRD">SRD ($) - Surinamese Dollar</MenuItem>
                                                    <MenuItem value="SSP">SSP (£) - South Sudanese Pound</MenuItem>
                                                    <MenuItem value="STN">STN (Db) - São Tomé and Príncipe Dobra</MenuItem>
                                                    <MenuItem value="SYP">SYP (£) - Syrian Pound</MenuItem>
                                                    <MenuItem value="SZL">SZL (L) - Swazi Lilangeni</MenuItem>
                                                    <MenuItem value="THB">THB (฿) - Thai Baht</MenuItem>
                                                    <MenuItem value="TJS">TJS (ЅМ) - Tajikistani Somoni</MenuItem>
                                                    <MenuItem value="TMT">TMT (m) - Turkmenistani Manat</MenuItem>
                                                    <MenuItem value="TND">TND (د.ت) - Tunisian Dinar</MenuItem>
                                                    <MenuItem value="TOP">TOP (T$) - Tongan Paʻanga</MenuItem>
                                                    <MenuItem value="TRY">TRY (₺) - Turkish Lira</MenuItem>
                                                    <MenuItem value="TTD">TTD ($) - Trinidad and Tobago Dollar</MenuItem>
                                                    <MenuItem value="TVD">TVD ($) - Tuvaluan Dollar</MenuItem>
                                                    <MenuItem value="TWD">TWD (NT$) - New Taiwan Dollar</MenuItem>
                                                    <MenuItem value="TZS">TZS (Sh) - Tanzanian Shilling</MenuItem>
                                                    <MenuItem value="UAH">UAH (₴) - Ukrainian Hryvnia</MenuItem>
                                                    <MenuItem value="UGX">UGX (Sh) - Ugandan Shilling</MenuItem>
                                                    <MenuItem value="USD">USD ($) - United States Dollar</MenuItem>
                                                    <MenuItem value="UYU">UYU ($) - Uruguayan Peso</MenuItem>
                                                    <MenuItem value="UZS">UZS (so'm) - Uzbekistan Som</MenuItem>
                                                    <MenuItem value="VES">VES (Bs.) - Venezuelan Bolívar</MenuItem>
                                                    <MenuItem value="VND">VND (₫) - Vietnamese Dong</MenuItem>
                                                    <MenuItem value="VUV">VUV (Vt) - Vanuatu Vatu</MenuItem>
                                                    <MenuItem value="WST">WST (T) - Samoan Tala</MenuItem>
                                                    <MenuItem value="XAF">XAF (Fr) - Central African CFA Franc</MenuItem>
                                                    <MenuItem value="XCD">XCD ($) - East Caribbean Dollar</MenuItem>
                                                    <MenuItem value="XDR">XDR (SDR) - Special Drawing Rights</MenuItem>
                                                    <MenuItem value="XOF">XOF (Fr) - West African CFA Franc</MenuItem>
                                                    <MenuItem value="XPF">XPF (Fr) - CFP Franc</MenuItem>
                                                    <MenuItem value="YER">YER (﷼) - Yemeni Rial</MenuItem>
                                                    <MenuItem value="ZAR">ZAR (R) - South African Rand</MenuItem>
                                                    <MenuItem value="ZMW">ZMW (ZK) - Zambian Kwacha</MenuItem>
                                                    <MenuItem value="ZWL">ZWL ($) - Zimbabwean Dollar</MenuItem>
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Date Format</Typography>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    value={localizationSettings.date_format}
                                                    onChange={(e) => setLocalizationSettings({ ...localizationSettings, date_format: e.target.value })}
                                                >
                                                    <MenuItem value="mdy">MM/DD/YYYY</MenuItem>
                                                    <MenuItem value="dmy">DD/MM/YYYY</MenuItem>
                                                    <MenuItem value="ymd">YYYY-MM-DD</MenuItem>
                                                </Select>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>

                        {/* Right Column (Branding & Help) */}
                        <Grid item xs={12} lg={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                                {/* Branding Card */}
                                <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Branding</Typography>
                                            <Typography variant="caption" sx={{ color: '#4c739a' }}>Customize look & feel.</Typography>
                                        </Box>
                                        <PaletteIcon sx={{ color: '#94a3b8' }} />
                                    </Box>
                                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>Color Palette</Typography>
                                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                                {colors.map((color) => (
                                                    <Box
                                                        key={color.value}
                                                        onClick={() => setSelectedColor(color.value)}
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            bgcolor: color.value,
                                                            cursor: 'pointer',
                                                            border: selectedColor === color.value ? `3px solid white` : '2px solid transparent',
                                                            boxShadow: selectedColor === color.value ? `0 0 0 2px ${color.value}` : 'none',
                                                            transition: 'all 0.2s',
                                                            '&:hover': { transform: 'scale(1.1)' }
                                                        }}
                                                        title={color.name}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 600, color: '#64748b', mb: 2, display: 'block' }}>Preview</Typography>
                                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    disableElevation
                                                    sx={{ bgcolor: selectedColor, '&:hover': { bgcolor: selectedColor, opacity: 0.9 } }}
                                                >
                                                    Primary Button
                                                </Button>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: 0.5,
                                                        border: `1px solid ${selectedColor}`,
                                                        bgcolor: selectedColor,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Box sx={{ width: 10, height: 10, bgcolor: 'white', clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)' }} />
                                                    </Box>
                                                    <Typography variant="body2">Checkbox active</Typography>
                                                </Box>
                                                <Link href="#" underline="hover" sx={{ fontSize: '0.875rem', fontWeight: 500, color: selectedColor }}>Link style</Link>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>

                                {/* Quick Access Card */}
                                <Paper sx={{ borderRadius: 3, border: `1px solid ${alpha(primaryColor, 0.2)}`, bgcolor: alpha(primaryColor, 0.05), p: 3 }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <InfoIcon sx={{ color: primaryColor, mt: 0.5 }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0d141b' }}>Need help setting up?</Typography>
                                            <Typography variant="caption" sx={{ color: '#4c739a', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                                                Check our documentation for detailed guides on how to configure your domain and email servers.
                                            </Typography>
                                            <Link href="#" underline="hover" sx={{ fontSize: '0.75rem', fontWeight: 600, mt: 1, display: 'block' }}>View Documentation →</Link>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                    </>
                )}

                {/* Email Tab */}
                {tab === 4 && (
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* SMTP Configuration */}
                            <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>SMTP Configuration</Typography>
                                        <Typography variant="caption" sx={{ color: '#4c739a' }}>Configure your email sending settings.</Typography>
                                    </Box>
                                    <MailIcon sx={{ color: '#94a3b8' }} />
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>SMTP Host</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="smtp.example.com"
                                                    variant="outlined"
                                                    value={emailSettings.smtp_host}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>SMTP Port</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="587"
                                                    variant="outlined"
                                                    value={emailSettings.smtp_port}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: e.target.value })}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>SMTP User</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="user@example.com"
                                                    variant="outlined"
                                                    value={emailSettings.smtp_user}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>SMTP Password</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="password"
                                                    placeholder="********"
                                                    variant="outlined"
                                                    value={emailSettings.smtp_pass}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_pass: e.target.value })}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>From Name</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="LMS Support"
                                                    variant="outlined"
                                                    value={emailSettings.from_name}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>From Email</Typography>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="no-reply@example.com"
                                                    variant="outlined"
                                                    value={emailSettings.from_address}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, from_address: e.target.value })}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Encryption</Typography>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    value={emailSettings.encryption}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, encryption: e.target.value })}
                                                >
                                                    <MenuItem value="none">None</MenuItem>
                                                    <MenuItem value="ssl">SSL</MenuItem>
                                                    <MenuItem value="tls">TLS</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            disableElevation
                                            startIcon={<SaveIcon />}
                                            onClick={handleSaveEmailSettings}
                                            disabled={isSaving}
                                            sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: alpha(primaryColor, 0.9) } }}
                                        >
                                            {isSaving ? 'Saving...' : 'Save Settings'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Test Email */}
                            <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Test Email Configuration</Typography>
                                        <Typography variant="caption" sx={{ color: '#4c739a' }}>Send a test email to verify your settings.</Typography>
                                    </Box>
                                    <MailIcon sx={{ color: '#94a3b8' }} />
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', maxWidth: 600 }}>
                                        <FormControl fullWidth>
                                            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>To Email Address</Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="your-email@example.com"
                                                variant="outlined"
                                                value={testEmail}
                                                onChange={(e) => setTestEmail(e.target.value)}
                                            />
                                        </FormControl>
                                        <Button
                                            variant="contained"
                                            disableElevation
                                            onClick={handleSendTestEmail}
                                            disabled={isSendingTest}
                                            sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: alpha(primaryColor, 0.9) }, whiteSpace: 'nowrap', minWidth: 120 }}
                                        >
                                            {isSendingTest ? 'Sending...' : 'Send Test Email'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Sticky Footer - Show only on General and Email tabs */}
            {
                (tab === 0 || tab === 4) && (
                    <Box sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: { sm: 260 }, // Matches Drawer width
                        right: 0,
                        bgcolor: 'white',
                        borderTop: '1px solid #e7edf3',
                        px: 4, py: 2,
                        zIndex: 1100,
                        boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button variant="outlined" color="inherit" sx={{ borderColor: '#cbd5e1' }}>Cancel</Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    disableElevation
                                    disabled={isSaving}
                                    onClick={handleSave}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )
            }

            <Snackbar open={showSuccess} autoHideDuration={6000} onClose={() => setShowSuccess(false)}>
                <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
                    Settings saved successfully!
                </Alert>
            </Snackbar>

            <Snackbar open={showError} autoHideDuration={6000} onClose={() => setShowError(false)}>
                <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
                    {errorMessage || 'An error occurred'}
                </Alert>
            </Snackbar>
        </Box >
    );
};

export default Settings;

