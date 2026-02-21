import React, { useState, useEffect } from 'react';
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
    alpha,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import courseService, { Course } from '../services/courseService';
import { profileService, ProfileData } from '../services/profileService';
import enrollmentService from '../services/enrollmentService';
import paymentService from '../services/paymentService';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';
import { useThemeContext } from '../context/ThemeContext';
import { getSettings } from '../services/settings';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const colors = {
    bgLight: '#f6f7f8',
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
};

const fontLexend = { fontFamily: "'Lexend', sans-serif" };

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

interface UserData {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    billing_address?: string | null;
    billing_city?: string | null;
    billing_state?: string | null;
    billing_zip?: string | null;
    billing_country?: string | null;
}

const Checkout: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { primaryColor } = useThemeContext();

    // Branding state
    const [siteName, setSiteName] = useState('LMS Portal');
    const [orgLogo, setOrgLogo] = useState<string | null>(null);
    const id = parseInt(courseId || '0');

    const [loading, setLoading] = useState(true);
    const [enrollmentLoading, setEnrollmentLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [courseUnavailable, setCourseUnavailable] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        billing_address: '',
        billing_city: '',
        billing_state: '',
        billing_zip: '',
        billing_country: 'India',
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id || isNaN(id)) {
                setError('Invalid course ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const [courseResponse, profileResponse, enrollmentStatus] = await Promise.all([
                    courseService.getCourseForCheckout(id),
                    profileService.getProfile(),
                    enrollmentService.checkEnrollmentStatus(id).catch(() => null),
                ]);

                const courseData = courseResponse.data;
                setCourse(courseData);

                // Check if course is available for checkout
                const courseStatus = courseData.status;
                const courseVisibility = courseData.visibility;
                
                if (courseStatus === 'draft' || courseVisibility === 'draft') {
                    setCourseUnavailable(true);
                    setLoading(false);
                    return;
                }

                if (enrollmentStatus) {
                    if (enrollmentStatus.is_enrolled) {
                        setIsEnrolled(true);
                        setLoading(false);
                        return;
                    }
                }

                const profile = profileResponse.data as ProfileData;
                setUserData(profile);

                setFormData({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    billing_address: profile.billing_address || '',
                    billing_city: profile.billing_city || '',
                    billing_state: profile.billing_state || '',
                    billing_zip: profile.billing_zip || '',
                    billing_country: profile.billing_country || 'India',
                });

            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || 'Failed to load checkout data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Load branding settings
    useEffect(() => {
        const loadBranding = async () => {
            try {
                const response = await getSettings();
                if (response.status === 'success' && response.data) {
                    if (response.data['site_name']) setSiteName(response.data['site_name']);
                    if (response.data['org_logo']) setOrgLogo(response.data['org_logo']);
                }
            } catch (e) {
                // branding is cosmetic, don't block checkout
            }
        };
        loadBranding();
    }, []);

    useEffect(() => {
        if (isEnrolled) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate(`/course/${id}/learn`);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isEnrolled, navigate, id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCountryChange = (e: any) => {
        setFormData((prev) => ({ ...prev, billing_country: e.target.value }));
    };

    const saveProfile = async () => {
        await profileService.updateProfile({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            billing_address: formData.billing_address,
            billing_city: formData.billing_city,
            billing_state: formData.billing_state,
            billing_zip: formData.billing_zip,
            billing_country: formData.billing_country,
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
            const orderData = await paymentService.createOrder(id);

            // Open Razorpay checkout modal
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: siteName,
                description: `Enrollment: ${orderData.course.title}`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    try {
                        // Verify payment on backend
                        const verifyResult = await paymentService.verifyPayment(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature
                        );

                        if (verifyResult.status === 'success') {
                            setSuccessMessage('Payment successful! Redirecting...');
                            setTimeout(() => {
                                navigate(`/purchase-success/${id}`, {
                                    state: {
                                        orderId: response.razorpay_order_id,
                                        paymentId: response.razorpay_payment_id,
                                        isPaid: true,
                                    },
                                });
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
                    course_id: id.toString(),
                },
                theme: {
                    color: primaryColor,
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

            const enrollmentResponse = await enrollmentService.enrollSelf(id);

            if (enrollmentResponse.status === 'success') {
                setSuccessMessage('Successfully enrolled!');
                setTimeout(() => {
                    navigate(`/purchase-success/${id}`, {
                        state: { isPaid: false },
                    });
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

    if (loading) {
        return (
            <Box sx={{ bgcolor: colors.bgLight, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isEnrolled) {
        return (
            <Box sx={{ bgcolor: colors.bgLight, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 500, animation: `${fadeIn} 0.5s ease-out` }}>
                    <Box sx={{ width: 80, height: 80, bgcolor: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#f59e0b' }}>school</span>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: colors.slate900, mb: 2, ...fontLexend }}>
                        You Own This Course!
                    </Typography>
                    <Typography sx={{ color: colors.slate600, mb: 4, ...fontLexend }}>
                        You are already enrolled in <strong>{course?.title}</strong>. Redirecting to course in {countdown} seconds...
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate(`/course/${id}/learn`)}
                        sx={{ bgcolor: primaryColor, color: 'white', fontWeight: 700, py: 1.5, px: 4, borderRadius: 2, ...fontLexend }}
                    >
                        Go to Course Now
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (courseUnavailable) {
        return (
            <Box sx={{ bgcolor: colors.bgLight, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 500, animation: `${fadeIn} 0.5s ease-out` }}>
                    <Box sx={{ width: 80, height: 80, bgcolor: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#f59e0b' }}>info</span>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: colors.slate900, mb: 2, ...fontLexend }}>
                        Course Not Available
                    </Typography>
                    <Typography sx={{ color: colors.slate600, mb: 4, ...fontLexend }}>
                        This course is currently not available for purchase. Please check back later.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/dashboard')}
                        sx={{ bgcolor: primaryColor, color: 'white', fontWeight: 700, py: 1.5, px: 4, borderRadius: 2, ...fontLexend }}
                    >
                        Back to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (error && !course) {
        return (
            <Box sx={{ bgcolor: colors.bgLight, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 500 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                    <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ bgcolor: primaryColor, color: 'white', fontWeight: 700, ...fontLexend }}>
                        Back to Dashboard
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: colors.bgLight, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box component="header" sx={{ height: 72, bgcolor: 'white', borderBottom: `1px solid ${colors.slate200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 3, lg: 10 }, position: 'sticky', top: 0, zIndex: 1100 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {orgLogo && (
                        <Box component="img" src={`${STATIC_ASSETS_BASE_URL}${orgLogo.startsWith('/') ? orgLogo : '/' + orgLogo}`} alt={siteName} sx={{ height: 56, width: 'auto', objectFit: 'contain' }} />
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, bgcolor: colors.slate100, borderRadius: 2, color: colors.slate600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' }, ...fontLexend }}>Secure Checkout</Typography>
                </Box>
            </Box>

            <Container maxWidth={false} sx={{ maxWidth: 1280, py: { xs: 4, lg: 8 }, flex: 1 }}>
                {successMessage && (
                    <Alert severity="success" sx={{ mb: 3, animation: `${fadeIn} 0.3s ease-out` }}>{successMessage}</Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                )}

                <Grid container spacing={{ xs: 4, lg: 8, xl: 16 }}>
                    <Grid item xs={12} lg={7.2}>
                        <Box sx={{ mb: 6 }}>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: colors.slate900, mb: 1.5, letterSpacing: '-0.02em', ...fontLexend }}>Checkout</Typography>
                            <Typography variant="body1" sx={{ color: colors.slate500, fontSize: '1.125rem', ...fontLexend }}>Complete your {isPaidCourse ? 'purchase' : 'enrollment'} to start learning.</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Box component="section">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, ...fontLexend }}>1</Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.slate900, ...fontLexend }}>Personal Information</Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>First Name *</Typography>
                                        <TextField fullWidth name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="John" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} required />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>Last Name *</Typography>
                                        <TextField fullWidth name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Doe" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} required />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>Email Address *</Typography>
                                        <TextField fullWidth name="email" value={formData.email} onChange={handleInputChange} placeholder="john.doe@example.com" InputProps={{ startAdornment: <span className="material-symbols-outlined" style={{ color: colors.slate400, marginRight: '12px', fontSize: '20px' }}>mail</span> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} required disabled />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>Phone Number</Typography>
                                        <TextField fullWidth name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 98765 43210" InputProps={{ startAdornment: <span className="material-symbols-outlined" style={{ color: colors.slate400, marginRight: '12px', fontSize: '20px' }}>phone</span> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box component="section">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, ...fontLexend }}>2</Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.slate900, ...fontLexend }}>Billing Address</Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>Street Address *</Typography>
                                        <TextField fullWidth name="billing_address" value={formData.billing_address} onChange={handleInputChange} placeholder="123 Education Lane" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} required />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>City *</Typography>
                                        <TextField fullWidth name="billing_city" value={formData.billing_city} onChange={handleInputChange} placeholder="Mumbai" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} required />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>State / Province *</Typography>
                                        <TextField fullWidth name="billing_state" value={formData.billing_state} onChange={handleInputChange} placeholder="Maharashtra" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} required />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>PIN Code *</Typography>
                                        <TextField fullWidth name="billing_zip" value={formData.billing_zip} onChange={handleInputChange} placeholder="400001" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }} required />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: colors.slate700, ...fontLexend }}>Country *</Typography>
                                        <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white', ...fontLexend } }}>
                                            <Select value={formData.billing_country} onChange={handleCountryChange} sx={{ ...fontLexend }}>
                                                <MenuItem value="India" sx={{ ...fontLexend }}>India</MenuItem>
                                                <MenuItem value="United States" sx={{ ...fontLexend }}>United States</MenuItem>
                                                <MenuItem value="United Kingdom" sx={{ ...fontLexend }}>United Kingdom</MenuItem>
                                                <MenuItem value="Canada" sx={{ ...fontLexend }}>Canada</MenuItem>
                                                <MenuItem value="Australia" sx={{ ...fontLexend }}>Australia</MenuItem>
                                                <MenuItem value="Germany" sx={{ ...fontLexend }}>Germany</MenuItem>
                                                <MenuItem value="France" sx={{ ...fontLexend }}>France</MenuItem>
                                                <MenuItem value="Japan" sx={{ ...fontLexend }}>Japan</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Box>

                            {isPaidCourse && (
                                <Box component="section" sx={{ pb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, ...fontLexend }}>3</Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.slate900, ...fontLexend }}>Payment</Typography>
                                    </Box>

                                    <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, bgcolor: alpha(primaryColor, 0.03), borderColor: alpha(primaryColor, 0.2) }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(primaryColor, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 28, color: primaryColor }}>account_balance_wallet</span>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.slate900, ...fontLexend }}>Razorpay Secure Checkout</Typography>
                                                <Typography variant="body2" sx={{ color: colors.slate500, ...fontLexend }}>
                                                    Pay securely via UPI, Cards, Netbanking, Wallets & more
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                            {['UPI', 'Cards', 'Netbanking', 'Wallets'].map((method) => (
                                                <Box key={method} sx={{ px: 1.5, py: 0.5, border: `1px solid ${colors.slate200}`, borderRadius: 1.5, bgcolor: 'white' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: colors.slate700, fontSize: 11 }}>{method}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, color: colors.slate400 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                                        <Typography variant="caption" sx={{ fontWeight: 500, ...fontLexend }}>Your transaction is secured with 256-bit SSL encryption</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} lg={4.8}>
                        <Box sx={{ position: 'sticky', top: 100 }}>
                            <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, bgcolor: 'white', borderColor: colors.slate200, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: colors.slate900, mb: 4, ...fontLexend }}>Order Summary</Typography>

                                <Box sx={{ display: 'flex', gap: 3, mb: 4, pb: 4, borderBottom: `1px solid ${colors.slate100}` }}>
                                    <Box sx={{ width: 80, height: 80, borderRadius: 2, bgcolor: colors.slate100, backgroundImage: `url("${getThumbnailUrl(course?.thumbnail)}")`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.slate900, lineHeight: 1.4, ...fontLexend }}>{course?.title}</Typography>
                                            <Typography variant="caption" sx={{ color: colors.slate500, mt: 0.5, display: 'block', ...fontLexend }}>
                                                {(course as any)?.creator ? `${(course as any).creator.first_name || ''} ${(course as any).creator.last_name || ''}`.trim() : ''}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            {hasDiscount && (
                                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: colors.slate400, ...fontLexend }}>
                                                    {formatINR(originalPrice)}
                                                </Typography>
                                            )}
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: colors.slate900, ...fontLexend }}>
                                                {coursePrice === 0 ? 'Free' : formatINR(coursePrice)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: colors.slate500, ...fontLexend }}>Subtotal</Typography>
                                        <Typography variant="body2" sx={{ color: colors.slate600, fontWeight: 500, ...fontLexend }}>
                                            {hasDiscount && (
                                                <Typography component="span" variant="body2" sx={{ textDecoration: 'line-through', color: colors.slate400, mr: 1, ...fontLexend }}>{formatINR(originalPrice)}</Typography>
                                            )}
                                            {coursePrice === 0 ? 'Free' : formatINR(coursePrice)}
                                        </Typography>
                                    </Box>
                                    {isPaidCourse && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 600, ...fontLexend }}>Tax</Typography>
                                            <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 600, ...fontLexend }}>Included</Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ borderTop: `1px solid ${colors.slate100}`, pt: 3, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.slate900, ...fontLexend }}>Total</Typography>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" sx={{ color: colors.slate500, fontWeight: 600, letterSpacing: '0.05em', display: 'block', mb: 0.5, ...fontLexend }}>INR</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, color: colors.slate900, letterSpacing: '-0.02em', ...fontLexend }}>{coursePrice === 0 ? 'Free' : formatINR(coursePrice)}</Typography>
                                    </Box>
                                </Box>

                                <Button fullWidth variant="contained" onClick={handleCompleteAction} disabled={enrollmentLoading} sx={{ bgcolor: primaryColor, color: 'white', fontWeight: 800, py: 2, borderRadius: 3, textTransform: 'none', fontSize: '1rem', boxShadow: `0 10px 15px -3px ${alpha(primaryColor, 0.2)}`, '&:hover': { bgcolor: alpha(primaryColor, 0.9), transform: 'translateY(-1px)' }, transition: 'all 0.2s', display: 'flex', gap: 1.5, ...fontLexend }}>
                                    {enrollmentLoading ? <CircularProgress size={24} color="inherit" /> : (<><span className="material-symbols-outlined">arrow_forward</span> {isPaidCourse ? 'Pay & Enroll' : 'Complete Enrollment'}</>)}
                                </Button>

                                <Typography variant="caption" sx={{ color: colors.slate400, textAlign: 'center', display: 'block', mt: 3, ...fontLexend }}>
                                    By completing your {isPaidCourse ? 'purchase' : 'enrollment'}, you agree to our <Link href="#" sx={{ color: colors.slate500, textDecoration: 'underline', '&:hover': { color: primaryColor } }}>Terms of Service</Link>.
                                </Typography>
                            </Paper>

                            {isPaidCourse && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 4, opacity: 0.5, transition: 'all 0.3s', '&:hover': { opacity: 0.9 } }}>
                                    {['UPI', 'VISA', 'Mastercard', 'RuPay'].map((p) => (
                                        <Box key={p} sx={{ px: 1.5, py: 0.5, border: `1px solid ${colors.slate300}`, borderRadius: 1.5, bgcolor: 'white' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: colors.slate800, fontSize: 10 }}>{p}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            <Box component="footer" sx={{ py: 6, borderTop: `1px solid ${colors.slate200}`, bgcolor: 'white', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: colors.slate500, ...fontLexend }}>© {new Date().getFullYear()} {siteName}. All rights reserved.</Typography>
            </Box>
        </Box>
    );
};

export default Checkout;
