'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Grid,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    Paper,
    Link,
    Container,
    CircularProgress,
    Alert,
    useTheme,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import * as courseService from '@/services/courseService';
import * as profileService from '@/services/profileService';
import * as enrollmentService from '@/services/enrollmentService';
import * as paymentService from '@/services/paymentService';
import * as settingsService from '@/services/settings';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_line: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}

interface CheckoutPageProps {
    courseId: number;
}

export default function CheckoutPage({ courseId }: CheckoutPageProps) {
    const router = useRouter();
    const theme = useTheme();

    // State
    const [enrollmentLoading, setEnrollmentLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [courseUnavailable, setCourseUnavailable] = useState(false);
    const [siteName, setSiteName] = useState('LMS Portal');
    const [orgLogo, setOrgLogo] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address_line: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
    });

    // Fetch course
    const {
        data: course,
        isLoading: courseLoading,
        error: courseError,
    } = useQuery({
        queryKey: ['course', courseId],
        queryFn: async () => {
            try {
                const response = await courseService.getCourse(courseId);
                return response.data || response;
            } catch (err: any) {
                throw err.response?.data?.message || 'Failed to load course';
            }
        },
        enabled: !!courseId,
    });

    // Fetch profile
    const {
        data: profile,
        isLoading: profileLoading,
    } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            try {
                const response = await profileService.getProfile();
                return response.data || response;
            } catch (err) {
                return null;
            }
        },
    });

    // Fetch branding settings
    useEffect(() => {
        const loadBranding = async () => {
            try {
                const response = await settingsService.getSettings();
                if (response.status === 'success' && response.data) {
                    if (response.data['site_name']) setSiteName(response.data['site_name']);
                    if (response.data['org_logo']) setOrgLogo(response.data['org_logo']);
                }
            } catch (e) {
                // Branding is cosmetic, don't block checkout
            }
        };
        loadBranding();
    }, []);

    // Load script tag for Razorpay
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                address_line: profile.address_line || '',
                city: profile.city || '',
                state: profile.state || '',
                pincode: profile.pincode || '',
                country: profile.country || 'India',
            });
        }
    }, [profile]);

    // Check enrollment status and course availability
    useEffect(() => {
        const checkStatus = async () => {
            if (!course) return;

            try {
                // Check if course is available
                if (course.status === 'draft' || course.visibility === 'draft') {
                    setCourseUnavailable(true);
                    return;
                }

                // Check if already enrolled
                try {
                    const enrollments = await enrollmentService.getEnrollments();
                    const isAlreadyEnrolled = enrollments?.some((e: any) => e.course_id === courseId);
                    if (isAlreadyEnrolled) {
                        setIsEnrolled(true);
                    }
                } catch (err) {
                    // If check fails, allow checkout to proceed
                    console.warn('Could not verify enrollment status:', err);
                }
            } catch (err) {
                console.error('Error checking status:', err);
            }
        };

        checkStatus();
    }, [course, courseId]);

    // Countdown redirect after enrollment
    useEffect(() => {
        if (isEnrolled) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        router.push(`/course/${courseId}/learn`);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isEnrolled, courseId, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCountryChange = (e: any) => {
        setFormData((prev) => ({ ...prev, country: e.target.value }));
    };

    const saveProfile = async () => {
        await profileService.updateProfile({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            address_line: formData.address_line,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: formData.country,
        });
    };

    const handleRazorpayPayment = async () => {
        if (!course) return;

        setEnrollmentLoading(true);
        setError(null);

        try {
            // Save profile first
            await saveProfile();

            // Create Razorpay order
            const orderData = await paymentService.createOrder(courseId);

            // Open Razorpay checkout modal
            const options = {
                key: orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: siteName,
                description: `Enrollment: ${course.title}`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    try {
                        // Verify payment on backend
                        const verifyResult = await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyResult.status === 'success') {
                            setSuccessMessage('Payment successful! Redirecting...');
                            setTimeout(() => {
                                router.push(
                                    `/purchase-success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}&courseId=${courseId}`
                                );
                            }, 1000);
                        }
                    } catch (err: any) {
                        console.error('Payment verification error:', err);
                        setError(err.response?.data?.message || 'Payment verification failed. Please contact support.');
                    } finally {
                        setEnrollmentLoading(false);
                    }
                },
                prefill: {
                    name: `${formData.first_name} ${formData.last_name}`,
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: {
                    course_id: courseId.toString(),
                },
                theme: {
                    color: theme.palette.primary.main,
                },
                modal: {
                    ondismiss: function () {
                        setEnrollmentLoading(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                setError(response.error.description || 'Payment failed. Please try again.');
                setEnrollmentLoading(false);
            });
            rzp.open();
        } catch (err: any) {
            console.error('Payment initiation error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to initiate payment');
            setEnrollmentLoading(false);
        }
    };

    const handleFreeEnrollment = async () => {
        if (!course) return;

        setEnrollmentLoading(true);
        setError(null);

        try {
            await saveProfile();
            const enrollmentResponse = await enrollmentService.enrollInCourse(courseId);

            if (enrollmentResponse.status === 'success' || enrollmentResponse.enrollment_id) {
                setSuccessMessage('Successfully enrolled!');
                setTimeout(() => {
                    router.push(`/purchase-success?courseId=${courseId}&isPaid=false`);
                }, 1500);
            }
        } catch (err: any) {
            console.error('Enrollment error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to enroll in course';
            setError(errorMsg);
        } finally {
            setEnrollmentLoading(false);
        }
    };

    const handleCompleteAction = () => {
        const coursePrice = course ? (course.discounted_price && course.discounted_price > 0 ? course.discounted_price : course.price ?? 0) : 0;
        if (coursePrice > 0) {
            handleRazorpayPayment();
        } else {
            handleFreeEnrollment();
        }
    };

    const getThumbnailUrl = (thumbnail: string | null | undefined) => {
        if (!thumbnail) return '';
        if (thumbnail.startsWith('http')) return thumbnail;
        return `${STATIC_ASSETS_BASE_URL}/${thumbnail}`;
    };

    const originalPrice = course?.price ?? 0;
    const hasDiscount = !!(course?.discounted_price && course.discounted_price > 0 && course.discounted_price < originalPrice);
    const coursePrice = hasDiscount ? course!.discounted_price! : originalPrice;
    const isPaidCourse = coursePrice > 0;

    const formatINR = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Loading state
    if (courseLoading || profileLoading) {
        return (
            <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Already enrolled
    if (isEnrolled) {
        return (
            <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        borderRadius: 4,
                        textAlign: 'center',
                        maxWidth: 500,
                        animation: `${fadeIn} 0.5s ease-out`,
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Box sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <Typography variant="h3" sx={{ color: theme.palette.success.main }}>✓</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                        You Own This Course!
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                        You are already enrolled in <strong>{course?.title}</strong>. Redirecting to course in {countdown} seconds...
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => router.push(`/course/${courseId}/learn`)}
                        sx={{ fontWeight: 700, py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        Go to Course Now
                    </Button>
                </Paper>
            </Box>
        );
    }

    // Course unavailable
    if (courseUnavailable) {
        return (
            <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        borderRadius: 4,
                        textAlign: 'center',
                        maxWidth: 500,
                        animation: `${fadeIn} 0.5s ease-out`,
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Box sx={{ width: 80, height: 80, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <Typography variant="h3" sx={{ color: theme.palette.warning.main }}>!</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                        Course Not Available
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                        This course is currently not available for purchase. Please check back later.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => router.push('/')}
                        sx={{ fontWeight: 700, py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        Back to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    // Error state (no course loaded)
    if (courseError && !course) {
        return (
            <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        borderRadius: 4,
                        textAlign: 'center',
                        maxWidth: 500,
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {courseError?.message || 'Failed to load course'}
                    </Alert>
                    <Button variant="contained" onClick={() => router.push('/')} sx={{ fontWeight: 700 }}>
                        Back to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    // Main checkout form
    return (
        <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
                component="header"
                sx={{
                    height: 72,
                    bgcolor: 'background.paper',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: { xs: 3, lg: 10 },
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {orgLogo && (
                        <Box
                            component="img"
                            src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`}
                            alt={siteName}
                            sx={{ height: 56, width: 'auto', objectFit: 'contain' }}
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, color: 'text.secondary' }}>
                    <span style={{ fontFamily: 'Material Icons', fontSize: '20px' }}>🔒</span>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                        Secure Checkout
                    </Typography>
                </Box>
            </Box>

            <Container maxWidth={false} sx={{ maxWidth: 1280, py: { xs: 4, lg: 8 }, flex: 1 }}>
                {successMessage && <Alert severity="success" sx={{ mb: 3, animation: `${fadeIn} 0.3s ease-out` }}>{successMessage}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Grid container spacing={{ xs: 4, lg: 8 }}>
                    {/* Left Column: Forms */}
                    <Grid size={{ xs: 12, lg: 7 }}>
                        <Box sx={{ mb: 6 }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mb: 1.5 }}>
                                Checkout
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.125rem' }}>
                                Complete your {isPaidCourse ? 'purchase' : 'enrollment'} to start learning.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Personal Information Section */}
                            <Box component="section">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            bgcolor: theme.palette.primary.main,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                        }}
                                    >
                                        1
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        Personal Information
                                    </Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            First Name *
                                        </Typography>
                                        <TextField fullWidth name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="John" variant="outlined" required />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            Last Name *
                                        </Typography>
                                        <TextField fullWidth name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Doe" variant="outlined" required />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            Email Address *
                                        </Typography>
                                        <TextField fullWidth name="email" value={formData.email} onChange={handleInputChange} placeholder="john.doe@example.com" variant="outlined" required disabled />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            Phone Number
                                        </Typography>
                                        <TextField fullWidth name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 98765 43210" variant="outlined" />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Billing Address Section */}
                            <Box component="section">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            bgcolor: theme.palette.primary.main,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                        }}
                                    >
                                        2
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        Billing Address
                                    </Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            Street Address *
                                        </Typography>
                                        <TextField fullWidth name="address_line" value={formData.address_line} onChange={handleInputChange} placeholder="123 Education Lane" variant="outlined" required />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            City *
                                        </Typography>
                                        <TextField fullWidth name="city" value={formData.city} onChange={handleInputChange} placeholder="Mumbai" variant="outlined" required />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            State / Province *
                                        </Typography>
                                        <TextField fullWidth name="state" value={formData.state} onChange={handleInputChange} placeholder="Maharashtra" variant="outlined" required />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            PIN Code *
                                        </Typography>
                                        <TextField fullWidth name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="400001" variant="outlined" required />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
                                            Country *
                                        </Typography>
                                        <FormControl fullWidth>
                                            <Select value={formData.country} onChange={handleCountryChange} required>
                                                <MenuItem value="India">India</MenuItem>
                                                <MenuItem value="United States">United States</MenuItem>
                                                <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                                                <MenuItem value="Canada">Canada</MenuItem>
                                                <MenuItem value="Australia">Australia</MenuItem>
                                                <MenuItem value="Germany">Germany</MenuItem>
                                                <MenuItem value="France">France</MenuItem>
                                                <MenuItem value="Japan">Japan</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Payment Section */}
                            {isPaidCourse && (
                                <Box component="section" sx={{ pb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                        <Box
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                bgcolor: theme.palette.primary.main,
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.875rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            3
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                            Payment
                                        </Typography>
                                    </Box>

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 4,
                                            borderRadius: 3,
                                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                                            borderColor: alpha(theme.palette.primary.main, 0.2),
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 28,
                                                }}
                                            >
                                                💳
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                    Razorpay Secure Checkout
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Pay securely via UPI, Cards, Netbanking, Wallets & more
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                            {['UPI', 'Cards', 'Netbanking', 'Wallets'].map((method) => (
                                                <Box
                                                    key={method}
                                                    sx={{
                                                        px: 1.5,
                                                        py: 0.5,
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        borderRadius: 1.5,
                                                        bgcolor: 'background.paper',
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11 }}>
                                                        {method}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, color: 'text.secondary' }}>
                                        <span style={{ fontSize: 16 }}>🔒</span>
                                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                            Your transaction is secured with 256-bit SSL encryption
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Right Column: Order Summary */}
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <Box sx={{ position: 'sticky', top: 100 }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    borderRadius: 4,
                                    bgcolor: 'background.paper',
                                    boxShadow: theme.shadows[4],
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 4 }}>
                                    Order Summary
                                </Typography>

                                {/* Course Card */}
                                <Box sx={{ display: 'flex', gap: 3, mb: 4, pb: 4, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                    <Box
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 2,
                                            bgcolor: theme.palette.action.hover,
                                            backgroundImage: `url("${getThumbnailUrl(course?.thumbnail)}")`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.4 }}>
                                                {course?.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                                {course?.creator
                                                    ? `${course.creator.first_name || ''} ${course.creator.last_name || ''}`.trim()
                                                    : 'Instructor'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            {hasDiscount && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
                                                >
                                                    {formatINR(originalPrice)}
                                                </Typography>
                                            )}
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                {coursePrice === 0 ? 'Free' : formatINR(coursePrice)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Price Breakdown */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Subtotal
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                                            {hasDiscount && (
                                                <Typography component="span" variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled', mr: 1 }}>
                                                    {formatINR(originalPrice)}
                                                </Typography>
                                            )}
                                            {coursePrice === 0 ? 'Free' : formatINR(coursePrice)}
                                        </Typography>
                                    </Box>
                                    {isPaidCourse && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                Tax
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                Included
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Total */}
                                <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 3, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        Total
                                    </Typography>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                                            INR
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                            {coursePrice === 0 ? 'Free' : formatINR(coursePrice)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* CTA Button */}
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleCompleteAction}
                                    disabled={enrollmentLoading}
                                    sx={{
                                        fontWeight: 700,
                                        py: 2,
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        gap: 1.5,
                                    }}
                                >
                                    {enrollmentLoading ? <CircularProgress size={24} color="inherit" /> : (`${isPaidCourse ? 'Pay & Enroll' : 'Complete Enrollment'}`)}
                                </Button>

                                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', display: 'block', mt: 3 }}>
                                    By completing your {isPaidCourse ? 'purchase' : 'enrollment'}, you agree to our{' '}
                                    <Link href="#" sx={{ color: 'text.secondary', textDecoration: 'underline', '&:hover': { color: 'primary.main' } }}>
                                        Terms of Service
                                    </Link>
                                    .
                                </Typography>
                            </Paper>

                            {isPaidCourse && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4, opacity: 0.5, transition: 'all 0.3s', '&:hover': { opacity: 0.9 } }}>
                                    {['UPI', 'VISA', 'Mastercard', 'RuPay'].map((p) => (
                                        <Box key={p} sx={{ px: 1.5, py: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, bgcolor: 'background.paper' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 10 }}>
                                                {p}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Footer */}
            <Box component="footer" sx={{ py: 6, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    © {new Date().getFullYear()} {siteName}. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
}
