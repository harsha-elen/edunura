import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, TextField,
    Radio, RadioGroup, ToggleButton, ToggleButtonGroup, useTheme, MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface PricingSectionProps {
    price: string;
    setPrice: (value: string) => void;
    discountedPrice: string;
    setDiscountedPrice: (value: string) => void;
    isFree: boolean;
    setIsFree: (value: boolean) => void;
    validityPeriod: string; // 'lifetime' or number of days
    setValidityPeriod: (value: string) => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({
    price, setPrice, discountedPrice, setDiscountedPrice,
    isFree, setIsFree, validityPeriod, setValidityPeriod
}) => {
    const theme = useTheme();
    const [currencySymbol, setCurrencySymbol] = useState('$');
    // Internal state for validity type to manage UI before updating parent with days
    const [validityType, setValidityType] = useState<'lifetime' | 'limited'>('lifetime');
    const [days, setDays] = useState('');
    const [validityUnit, setValidityUnit] = useState('days');

    useEffect(() => {
        // Fetch global settings for currency
        const fetchSettings = async () => {
            try {
                const response = await apiClient.get('/settings');
                if (response.data.status === 'success') {
                    const settings = response.data.data;
                    const currencyCode = settings['localization_currency'] || 'USD';

                    // Map common currency codes to symbols
                    const symbolMap: Record<string, string> = {
                        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥',
                        'AUD': '$', 'CAD': '$', 'CNY': '¥', 'RUB': '₽', 'BRL': 'R$',
                        'KRW': '₩', 'TRY': '₺', 'ZAR': 'R', 'MXN': '$', 'SGD': '$',
                        'HKD': '$', 'NZD': '$', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr',
                        'PLN': 'zł', 'THB': '฿', 'IDR': 'Rp', 'HUF': 'Ft', 'CZK': 'Kč',
                        'ILS': '₪', 'MYR': 'RM', 'PHP': '₱', 'AED': 'د.إ', 'SAR': 'ر.س'
                    };

                    setCurrencySymbol(symbolMap[currencyCode] || '$');
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        // Sync internal validity type with props
        if (validityPeriod === '' || validityPeriod === null || validityPeriod === '0') {
            setValidityType('lifetime');
            setDays('');
        } else {
            setValidityType('limited');
            const d = parseInt(validityPeriod);
            if (!isNaN(d)) {
                if (d % 365 === 0) {
                    setDays((d / 365).toString());
                    setValidityUnit('years');
                } else if (d % 30 === 0) {
                    setDays((d / 30).toString());
                    setValidityUnit('months');
                } else if (d % 7 === 0) {
                    setDays((d / 7).toString());
                    setValidityUnit('weeks');
                } else {
                    setDays(validityPeriod);
                    setValidityUnit('days');
                }
            }
        }
    }, [validityPeriod]);

    const updateValidity = (val: string, unit: string) => {
        if (!val) {
            setValidityPeriod('');
            return;
        }
        const num = parseInt(val);
        let totalDays = num;
        if (unit === 'weeks') totalDays = num * 7;
        if (unit === 'months') totalDays = num * 30; // approx
        if (unit === 'years') totalDays = num * 365;

        setValidityPeriod(totalDays.toString());
    };

    const handlePricingTypeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newType: 'paid' | 'free' | null,
    ) => {
        if (newType !== null) {
            setIsFree(newType === 'free');
            if (newType === 'free') {
                setPrice('0');
                setDiscountedPrice('');
            }
        }
    };

    const handleValidityTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const type = event.target.value as 'lifetime' | 'limited';
        setValidityType(type);
        if (type === 'lifetime') {
            setValidityPeriod(''); // Null/0 equivalent
        } else {
            if (days) {
                updateValidity(days, validityUnit);
            } else {
                setDays('30');
                setValidityUnit('days');
                setValidityPeriod('30');
            }
        }
    };

    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (parseInt(val) < 0) return; // Prevent negative
        setDays(val);
        updateValidity(val, validityUnit);
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const unit = e.target.value;
        setValidityUnit(unit);
        updateValidity(days, unit);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'discounted') => {
        const val = e.target.value;
        if (val && parseFloat(val) < 0) return; // Prevent negative

        if (type === 'base') {
            setPrice(val);
        } else {
            setDiscountedPrice(val);
        }
    };

    return (
        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 4, px: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Course Pricing Card */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3', boxShadow: 'none' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Course Pricing</Typography>
                        <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>Set your course cost and access details.</Typography>
                    </Box>
                    <ToggleButtonGroup
                        value={isFree ? 'free' : 'paid'}
                        exclusive
                        onChange={handlePricingTypeChange}
                        sx={{
                            bgcolor: '#f6f7f8',
                            p: 0.5,
                            borderRadius: '8px',
                            '& .MuiToggleButton-root': {
                                border: 'none',
                                borderRadius: '6px !important',
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 500,
                                color: '#4c739a',
                                '&.Mui-selected': {
                                    bgcolor: 'white',
                                    color: theme.palette.primary.main,
                                    fontWeight: 700,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    '&:hover': {
                                        bgcolor: 'white',
                                    },
                                },
                            },
                        }}
                    >
                        <ToggleButton value="paid">Paid</ToggleButton>
                        <ToggleButton value="free">Free</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ p: 3, spacing: 4 }}>
                    {!isFree && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>Base Price</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="49.99"
                                    size="small"
                                    type="number"
                                    value={price}
                                    onChange={(e) => handlePriceChange(e as React.ChangeEvent<HTMLInputElement>, 'base')}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: '#4c739a', fontSize: '0.9rem' }}>{currencySymbol}</Typography>,
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f6f7f8' } }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>Discounted Price</Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Optional"
                                    size="small"
                                    type="number"
                                    value={discountedPrice}
                                    error={!!discountedPrice && !!price && parseFloat(discountedPrice) >= parseFloat(price)}
                                    helperText={!!discountedPrice && !!price && parseFloat(discountedPrice) >= parseFloat(price) ? "Must be less than base price" : ""}
                                    onChange={(e) => handlePriceChange(e as React.ChangeEvent<HTMLInputElement>, 'discounted')}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: '#4c739a', fontSize: '0.9rem' }}>{currencySymbol}</Typography>,
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f6f7f8' } }}
                                />
                            </Box>
                        </Box>
                    )}

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 2 }}>Enrollment Validity</Typography>
                        <RadioGroup
                            value={validityType}
                            onChange={handleValidityTypeChange}
                            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    border: `2px solid ${validityType === 'lifetime' ? theme.palette.primary.main : '#e7edf3'}`,
                                    bgcolor: validityType === 'lifetime' ? `${theme.palette.primary.main}0D` : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                onClick={() => {
                                    setValidityType('lifetime');
                                    setValidityPeriod('');
                                }}
                            >
                                <Radio value="lifetime" size="small" />
                                <Box sx={{ ml: 1 }}>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>Lifetime Access</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#4c739a' }}>Students can access the course forever.</Typography>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    border: `2px solid ${validityType === 'limited' ? theme.palette.primary.main : '#e7edf3'}`,
                                    bgcolor: validityType === 'limited' ? `${theme.palette.primary.main}0D` : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                                onClick={() => {
                                    // Focus logic handled by radio or direct click
                                    if (validityType !== 'limited') {
                                        setValidityType('limited');
                                        if (days) updateValidity(days, validityUnit);
                                        else {
                                            setDays('30');
                                            setValidityUnit('days');
                                            setValidityPeriod('30');
                                        }
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Radio value="limited" size="small" />
                                    <Box sx={{ ml: 1 }}>
                                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>Limited Period</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#4c739a' }}>Access expires after a specific duration.</Typography>
                                    </Box>
                                </Box>
                                {validityType === 'limited' && (
                                    <Box sx={{ mt: 2, ml: 4, width: 'calc(100% - 32px)', display: 'flex', gap: 2 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="30"
                                            type="number"
                                            value={days}
                                            onChange={handleDaysChange}
                                            sx={{ bgcolor: '#fff', flex: 1 }}
                                        />
                                        <TextField
                                            select
                                            size="small"
                                            value={validityUnit}
                                            onChange={handleUnitChange}
                                            sx={{ bgcolor: '#fff', width: '120px' }}
                                        >
                                            <MenuItem value="days">Days</MenuItem>
                                            <MenuItem value="weeks">Weeks</MenuItem>
                                            <MenuItem value="months">Months</MenuItem>
                                            <MenuItem value="years">Years</MenuItem>
                                        </TextField>
                                    </Box>
                                )}
                            </Box>
                        </RadioGroup>
                    </Box>
                </Box>
            </Paper>

            {/* Coupons Card */}
            {!isFree && (
                <Paper sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e7edf3', boxShadow: 'none' }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Coupons</Typography>
                            <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>Manage promotional codes for your course.</Typography>
                        </Box>
                        {/* Coupon logic to be implemented later */}
                        <Button
                            variant="contained"
                            disabled
                            startIcon={<AddIcon />}
                            sx={{
                                bgcolor: `${theme.palette.primary.main}0D`,
                                color: theme.palette.primary.main,
                                textTransform: 'none',
                                fontWeight: 700,
                                boxShadow: 'none',
                            }}
                        >
                            Add Coupon
                        </Button>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="body2" color="textSecondary" align="center">
                            Coupon management coming soon.
                        </Typography>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default PricingSection;
