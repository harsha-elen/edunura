'use client';

import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    FormControl,
    MenuItem,
    OutlinedInput,
    Select,
    SelectChangeEvent,
} from '@mui/material';
import {
    ChevronRight as ChevronRightIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    InfoOutlined as InfoOutlinedIcon,
    LockReset as LockResetIcon,
} from '@mui/icons-material';

const courseOptions = [
    'Cloud Architecture 101',
    'Python Mastery',
    'Complete JavaScript Mastery',
    'React Advanced Patterns',
    'Node.js Backend Development',
];

export default function CreateCouponPage() {
    const theme = useTheme();
    const [couponCode, setCouponCode] = useState('');
    const [selectedCourses, setSelectedCourses] = useState<string[]>(['Cloud Architecture 101', 'Python Mastery']);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [minimumOrderAmount, setMinimumOrderAmount] = useState('');
    const [maxTotalUses, setMaxTotalUses] = useState('');
    const [unlimitedUses, setUnlimitedUses] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');
    const [noExpiry, setNoExpiry] = useState(false);
    const [usageLimitPerUser, setUsageLimitPerUser] = useState('1');

    const handleGenerateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let generated = '';

        for (let i = 0; i < 10; i += 1) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        setCouponCode(generated);
    };

    const handleCoursesChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        setSelectedCourses(typeof value === 'string' ? value.split(',') : value);
    };

    const themeVars = {
        '--coupon-primary': theme.palette.primary.main,
        '--coupon-primary-dark': theme.palette.primary.dark,
        '--coupon-primary-soft': `${theme.palette.primary.main}18`,
        '--coupon-primary-soft-strong': `${theme.palette.primary.main}26`,
        '--coupon-primary-soft-alt': `${theme.palette.primary.main}14`,
        '--coupon-primary-soft-hover': `${theme.palette.primary.main}22`,
        '--coupon-accent': theme.palette.secondary.main,
        '--coupon-accent-soft': `${theme.palette.secondary.main}1a`,
    } as React.CSSProperties;

    return (
        <main className="relative px-4 md:px-8 pb-12 pt-6 flex justify-center" style={themeVars}>
            <div className="fixed inset-0 pointer-events-none -z-10 opacity-30 overflow-hidden">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] blur-[120px] rounded-full"
                    style={{ backgroundColor: 'var(--coupon-primary-soft-strong)' }}
                />
                <div
                    className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] blur-[120px] rounded-full"
                    style={{ backgroundColor: 'var(--coupon-accent-soft)' }}
                />
            </div>

            <div className="w-full max-w-5xl">
                <header className="mb-8">
                    <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">
                        <span>Home</span>
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                        <span>Coupons</span>
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                        <span style={{ color: 'var(--coupon-primary)' }}>Create New</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Coupon</h1>
                    <p className="text-slate-600 text-sm mt-1">Configure your promotional offering for learners.</p>
                </header>

                <section className="bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
                    <div
                        className="h-1"
                        style={{ background: 'linear-gradient(to right, var(--coupon-primary), var(--coupon-accent))' }}
                    />

                    <div className="p-8 space-y-8">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Coupon Code</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    className="w-full h-12 bg-slate-50 border border-slate-300 focus:border-[color:var(--coupon-primary)] focus:ring-1 focus:ring-[color:var(--coupon-primary)] rounded-lg px-4 font-bold text-lg tracking-widest placeholder:font-normal placeholder:tracking-normal uppercase outline-none"
                                    placeholder="e.g. SUMMER2024"
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateCode}
                                    className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200 whitespace-nowrap"
                                >
                                    <RefreshIcon sx={{ fontSize: 20 }} />
                                    Generate
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Applicable Courses</label>
                            <FormControl fullWidth size="small">
                                <Select
                                    multiple
                                    value={selectedCourses}
                                    onChange={handleCoursesChange}
                                    input={<OutlinedInput />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                            {(selected as string[]).map((course) => (
                                                <Box
                                                    key={course}
                                                    sx={{
                                                        px: 1,
                                                        py: 0.4,
                                                        borderRadius: '6px',
                                                        bgcolor: `${theme.palette.primary.main}1a`,
                                                        color: theme.palette.primary.main,
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        border: 'none',
                                                    }}
                                                >
                                                    {course}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                mt: 0.5,
                                                maxHeight: 260,
                                                borderRadius: '0.75rem',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 10px 25px rgba(2, 6, 23, 0.08)',
                                            },
                                        },
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#cbd5e1',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#94a3b8',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: theme.palette.primary.main,
                                            borderWidth: '2px',
                                        },
                                        '& .MuiSelect-select': {
                                            minHeight: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 0.75,
                                            bgcolor: '#f8fafc',
                                        },
                                    }}
                                >
                                    {courseOptions.map((course) => (
                                        <MenuItem
                                            key={course}
                                            value={course}
                                            sx={{
                                                borderRadius: '8px',
                                                mx: 0.75,
                                                my: 0.25,
                                                bgcolor: selectedCourses.includes(course) ? `${theme.palette.primary.main}14` : '#ffffff',
                                                color: selectedCourses.includes(course) ? theme.palette.primary.main : '#334155',
                                                border: 'none',
                                                '&:hover': {
                                                    bgcolor: `${theme.palette.primary.main}1f`,
                                                },
                                            }}
                                        >
                                            {course}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount Type</label>
                                <select
                                    className="w-full h-12 bg-slate-50 border border-slate-300 focus:border-[color:var(--coupon-primary)] focus:ring-1 focus:ring-[color:var(--coupon-primary)] rounded-lg px-4 text-base outline-none"
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount Value</label>
                                <div className="relative">
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-300 focus:border-[color:var(--coupon-primary)] focus:ring-1 focus:ring-[color:var(--coupon-primary)] rounded-lg px-4 pr-10 text-base outline-none"
                                        placeholder="0.00"
                                        type="number"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                                        {discountType === 'percentage' ? '%' : '$'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Minimum Order Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-300 focus:border-[color:var(--coupon-primary)] focus:ring-1 focus:ring-[color:var(--coupon-primary)] rounded-lg pl-8 pr-4 text-base outline-none"
                                        placeholder="0.00"
                                        type="number"
                                        value={minimumOrderAmount}
                                        onChange={(e) => setMinimumOrderAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Max Total Uses</label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            className="w-4 h-4 rounded border-slate-300 text-[color:var(--coupon-primary)] focus:ring-[color:var(--coupon-primary)]"
                                            type="checkbox"
                                            checked={unlimitedUses}
                                            onChange={(e) => setUnlimitedUses(e.target.checked)}
                                        />
                                        <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700">Unlimited</span>
                                    </label>
                                </div>
                                <input
                                    className="w-full h-12 bg-slate-50 border border-slate-300 focus:border-[color:var(--coupon-primary)] focus:ring-1 focus:ring-[color:var(--coupon-primary)] rounded-lg px-4 text-base outline-none disabled:opacity-60"
                                    placeholder="e.g. 500"
                                    type="number"
                                    disabled={unlimitedUses}
                                    value={maxTotalUses}
                                    onChange={(e) => setMaxTotalUses(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiry Date</label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            className="w-4 h-4 rounded border-slate-300 text-[color:var(--coupon-primary)] focus:ring-[color:var(--coupon-primary)]"
                                            type="checkbox"
                                            checked={noExpiry}
                                            onChange={(e) => setNoExpiry(e.target.checked)}
                                        />
                                        <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700">No Expiry</span>
                                    </label>
                                </div>
                                <input
                                    className="w-full h-12 bg-slate-50 border border-slate-300 focus:border-[color:var(--coupon-primary)] focus:ring-1 focus:ring-[color:var(--coupon-primary)] rounded-lg px-4 text-base outline-none disabled:opacity-60"
                                    type="date"
                                    disabled={noExpiry}
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Usage Limit per User</label>
                                <input
                                    className="w-full h-12 bg-slate-50 border border-slate-300 focus:border-[color:var(--coupon-primary)] focus:ring-1 focus:ring-[color:var(--coupon-primary)] rounded-lg px-4 text-base outline-none"
                                    type="number"
                                    value={usageLimitPerUser}
                                    onChange={(e) => setUsageLimitPerUser(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200/70">
                        <button
                            type="button"
                            className="w-full sm:w-auto h-12 px-8 bg-transparent border border-slate-300 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors active:scale-95 duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="w-full sm:w-auto h-12 px-8 text-white font-semibold rounded-lg transition-all active:scale-95 duration-200 flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: 'var(--coupon-primary)',
                                boxShadow: `0 12px 24px ${theme.palette.primary.main}33`,
                            }}
                        >
                            <SaveIcon sx={{ fontSize: 18 }} />
                            Save Coupon
                        </button>
                    </div>
                </section>

                <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-slate-200/70 flex gap-4 items-start">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--coupon-primary-soft)' }}>
                            <InfoOutlinedIcon sx={{ color: 'var(--coupon-primary)' }} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">Best Practice</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Unique codes like WELCOME10 typically see higher conversion than random strings.
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-slate-200/70 flex gap-4 items-start">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--coupon-accent-soft)' }}>
                            <LockResetIcon sx={{ color: 'var(--coupon-accent)' }} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">Security</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Usage limits help prevent coupon abuse and keep discount distribution fair.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
