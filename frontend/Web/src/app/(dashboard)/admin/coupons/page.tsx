'use client';

import React from 'react';
import Link from 'next/link';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Add as AddIcon,
    Search as SearchIcon,
    Tune as TuneIcon,
    ChevronRight as ChevronRightIcon,
    LocalOffer as CouponIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export default function CouponsPage() {
    const theme = useTheme();

    const couponData = [
        {
            id: 1,
            code: 'SUMMER50',
            description: 'Mid-year promotion',
            type: 'percentage',
            value: '50%',
            expiry: 'Aug 31, 2024',
            daysLeft: '14 days left',
            usage: { current: 362, max: 500, percentage: 72 },
            status: 'active',
        },
        {
            id: 2,
            code: 'WELCOME10',
            description: 'New user registration',
            type: 'fixed',
            value: '$10.00',
            expiry: 'Dec 31, 2024',
            daysLeft: 'Infinite',
            usage: { current: 1240, max: null, percentage: 15 },
            status: 'active',
        },
        {
            id: 3,
            code: 'EARLYBIRD',
            description: 'Course launch promo',
            type: 'percentage',
            value: '25%',
            expiry: 'Jun 15, 2024',
            daysLeft: 'Expired',
            usage: { current: 200, max: 200, percentage: 100 },
            status: 'expired',
        },
        {
            id: 4,
            code: 'BLACKFRIDAY',
            description: 'Annual global sale',
            type: 'percentage',
            value: '75%',
            expiry: 'Nov 28, 2024',
            daysLeft: 'Scheduled',
            usage: { current: 0, max: 1000, percentage: 0 },
            status: 'scheduled',
        },
    ];

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-100 text-emerald-800';
            case 'expired':
                return 'bg-slate-100 text-slate-600';
            case 'scheduled':
                return 'bg-blue-50 text-blue-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-500';
            case 'expired':
                return 'bg-slate-400';
            case 'scheduled':
                return 'bg-blue-500';
            default:
                return 'bg-gray-400';
        }
    };

    return (
        <main className="px-6 md:px-8 pb-12">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-6">
                <div className="flex-1">
                    <nav className="flex items-center gap-2 text-xs font-bold text-gray-600 tracking-wider uppercase mb-3">
                        <span>Home</span>
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                        <span style={{ color: theme.palette.primary.main }}>Coupons</span>
                    </nav>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">Coupon Management</h1>
                    <p className="text-lg text-gray-600 mt-2 max-w-2xl">Create and monitor promotional offers to drive enrollment and student engagement.</p>
                </div>
                <Link
                    href="/admin/coupons/create"
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all active:scale-95 hover:opacity-90"
                    style={{
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                    }}
                >
                    <AddIcon />
                    Create New Coupon
                </Link>
            </header>

            {/* Stats/Filters Bento Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Filters Card */}
                <div className="col-span-1 md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-wrap items-center gap-6">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <SearchIcon
                                sx={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af',
                                    fontSize: 20,
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search by code or campaign..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all text-sm"
                                style={{
                                    outlineColor: theme.palette.primary.main,
                                }}
                            />
                        </div>
                    </div>

                    {/* Selects */}
                    <div className="flex items-center gap-4">
                        <select className="bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium focus:outline-none focus:ring-2 transition-all">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Expired</option>
                            <option>Scheduled</option>
                        </select>

                        <select className="bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium focus:outline-none focus:ring-2 transition-all">
                            <option>Discount Type</option>
                            <option>Percentage</option>
                            <option>Fixed Amount</option>
                        </select>

                        <button className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            <TuneIcon sx={{ fontSize: 20 }} />
                        </button>
                    </div>
                </div>

                {/* Stats Card */}
                <div
                    className="rounded-xl p-6 flex flex-col justify-center border"
                    style={{
                        backgroundColor: `${theme.palette.primary.main}15`,
                        borderColor: `${theme.palette.primary.main}20`,
                    }}
                >
                    <p className="text-[10px] font-bold text-gray-700 tracking-widest uppercase mb-2">Active Coupons</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">24</span>
                        <span className="text-sm font-medium text-gray-600">+3 this week</span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-600 tracking-widest uppercase">Coupon Code</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-600 tracking-widest uppercase">Type & Value</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-600 tracking-widest uppercase">Expiry Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-600 tracking-widest uppercase">Usage</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-600 tracking-widest uppercase">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-600 tracking-widest uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {couponData.map((coupon, idx) => (
                                <tr key={coupon.id} className={`hover:bg-gray-50 transition-colors ${coupon.status === 'expired' ? 'opacity-60' : ''}`}>
                                    {/* Code */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span
                                                className={`font-bold font-mono text-base ${coupon.status === 'expired' ? 'line-through text-gray-500' : ''}`}
                                                style={{ color: coupon.status === 'expired' ? '#6b7280' : theme.palette.primary.main }}
                                            >
                                                {coupon.code}
                                            </span>
                                            <span className="text-xs text-gray-600">{coupon.description}</span>
                                        </div>
                                    </td>

                                    {/* Type & Value */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded flex items-center justify-center"
                                                style={{
                                                    backgroundColor:
                                                        coupon.status === 'expired'
                                                            ? '#e5e7eb'
                                                            : coupon.type === 'percentage'
                                                              ? `${theme.palette.primary.main}10`
                                                              : '#ede9fe30',
                                                    color: coupon.status === 'expired' ? '#9ca3af' : coupon.type === 'percentage' ? theme.palette.primary.main : '#7c3aed',
                                                }}
                                            >
                                                {coupon.type === 'percentage' ? '%' : '$'}
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {coupon.type === 'percentage' ? coupon.value + ' Off' : coupon.value + ' Fixed'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Expiry Date */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{coupon.expiry}</span>
                                            <span
                                                className="text-[10px] uppercase font-bold"
                                                style={{
                                                    color:
                                                        coupon.status === 'expired'
                                                            ? '#ef4444'
                                                            : coupon.status === 'scheduled'
                                                              ? '#3b82f6'
                                                              : '#6b7280',
                                                }}
                                            >
                                                {coupon.daysLeft}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Usage */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 max-w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all"
                                                    style={{
                                                        width: `${coupon.usage.percentage}%`,
                                                        backgroundColor: coupon.status === 'expired' ? '#9ca3af' : theme.palette.primary.main,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {coupon.usage.current}/{coupon.usage.max ?? '∞'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(coupon.status)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotColor(coupon.status)}`} />
                                            {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                {coupon.status === 'expired' ? <HistoryIcon sx={{ fontSize: 20 }} /> : <EditIcon sx={{ fontSize: 20 }} />}
                                            </button>
                                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <DeleteIcon sx={{ fontSize: 20 }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold">1-4</span> of <span className="font-semibold">32</span> coupons
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40" disabled>
                            ❮
                        </button>
                        <div className="flex gap-1">
                            <button
                                className="w-9 h-9 flex items-center justify-center rounded-lg font-semibold text-white"
                                style={{ backgroundColor: theme.palette.primary.main }}
                            >
                                1
                            </button>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-900 transition-colors">
                                2
                            </button>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-900 transition-colors">
                                3
                            </button>
                            <span className="px-2 self-center text-gray-600">...</span>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-900 transition-colors">
                                8
                            </button>
                        </div>
                        <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100">❯</button>
                    </div>
                </div>
            </div>

        </main>
    );
}
