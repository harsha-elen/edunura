'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';
import { generate2FA, verify2FASetup, disable2FA } from '@/services/authService';

interface TwoFactorSetupProps {
    is2FAEnabled: boolean;
    onStatusChange: (enabled: boolean) => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ is2FAEnabled, onStatusChange }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [setupDialog, setSetupDialog] = useState(false);
    const [disableDialog, setDisableDialog] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await generate2FA();
            if (response.status === 'success') {
                setQrCodeUrl(response.data.qrCodeUrl);
                setSecret(response.data.secret);
                setSetupDialog(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate 2FA credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await verify2FASetup(verificationCode);
            if (response.status === 'success') {
                setSetupDialog(false);
                setVerificationCode('');
                onStatusChange(true);
                setSuccess('Two-Factor Authentication has been enabled successfully.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleDisableClick = () => {
        setDisableCode('');
        setError('');
        setSuccess('');
        setDisableDialog(true);
    };

    const handleConfirmDisable = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await disable2FA(disableCode);
            if (response.status === 'success') {
                onStatusChange(false);
                setDisableDialog(false);
                setDisableCode('');
                setSuccess('Two-Factor Authentication has been disabled.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

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
                <Box 
                    onClick={!loading ? (is2FAEnabled ? handleDisableClick : handleGenerate) : undefined}
                    sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
                >
                    <Box sx={{
                        width: 44, height: 24, bgcolor: is2FAEnabled ? theme.palette.primary.main : '#e0e0e0', borderRadius: '9999px', position: 'relative', transition: 'background-color 0.2s',
                        '&::after': { content: '""', position: 'absolute', top: '2px', left: is2FAEnabled ? '22px' : '2px', width: 20, height: 20, bgcolor: '#ffffff', borderRadius: '50%', transition: 'left 0.2s' },
                    }} />
                </Box>
            </Box>

            <Dialog open={setupDialog} onClose={() => setSetupDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        1. Download an authenticator app (like Google Authenticator or Authy) on your phone.
                    </Typography>
                    <Typography gutterBottom>
                        2. Scan the QR code below using the app.
                    </Typography>
                    
                    {qrCodeUrl && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
                        </Box>
                    )}

                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                        Can't scan the QR code? Use this secret key: <strong>{secret}</strong>
                    </Typography>

                    <Typography gutterBottom>
                        3. Enter the 6-digit code generated by the app to verify setup.
                    </Typography>

                    <TextField
                        fullWidth
                        label="6-Digit Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        margin="normal"
                        error={!!error}
                        helperText={error}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSetupDialog(false)}>Cancel</Button>
                    <Button onClick={handleVerify} variant="contained" disabled={loading || !verificationCode}>
                        {loading ? <CircularProgress size={24} /> : 'Verify & Enable'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Disable 2FA Dialog */}
            <Dialog open={disableDialog} onClose={() => setDisableDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom sx={{ mt: 1 }}>
                        Please enter the 6-digit code from your authenticator app to confirm disabling 2FA. This will make your account less secure.
                    </Typography>
                    <TextField
                        fullWidth
                        label="6-Digit Verification Code"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value)}
                        margin="normal"
                        error={!!error && disableDialog}
                        helperText={disableDialog ? error : ''}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDisableDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDisable} variant="contained" color="error" disabled={loading || !disableCode}>
                        {loading ? <CircularProgress size={24} /> : 'Disable 2FA'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TwoFactorSetup;
