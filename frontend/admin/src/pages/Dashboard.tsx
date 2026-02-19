import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Divider,
    Button,
    Grid,
    Paper,
    // Table, TableBody, etc are used
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar, // Import Avatar correctly from @mui/material
    useTheme,
    Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    School as SchoolIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    LibraryBooks as LibraryBooksIcon,
    AttachMoney as AttachMoneyIcon,
    CheckCircle as CheckCircleIcon,
    FilterList as FilterListIcon,
    Star as StarIcon,
    ExpandMore as ExpandMoreIcon,
    UploadFile as UploadFileIcon,
    Warning as WarningIcon,
    NavigateNext as NavigateNextIcon
} from '@mui/icons-material';

// NOTE: Layout (Sidebar/Header) is now handled by AdminLayout in App.tsx

const Dashboard: React.FC = () => {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* Page Header (Optional, if we want specific page title inside the content area) */}
            <Box>
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' } }}
                >
                    <MuiLink component={RouterLink} underline="hover" color="inherit" to="/dashboard">
                        Home
                    </MuiLink>
                    <Typography color="text.primary">Dashboard</Typography>
                </Breadcrumbs>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d141b' }}>Dashboard Overview</Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3}>
                {[
                    { title: 'Total Students', value: '12,450', change: '+12%', icon: <SchoolIcon />, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.1) },
                    { title: 'Active Courses', value: '48', change: '+5%', icon: <LibraryBooksIcon />, color: '#9333ea', bg: '#f3e8ff' },
                    { title: 'Total Revenue', value: '$124k', change: '+8%', icon: <AttachMoneyIcon />, color: '#059669', bg: '#ecfdf5' },
                    { title: 'Completion Rate', value: '78.4%', change: '-2%', icon: <CheckCircleIcon />, color: '#ea580c', bg: '#fff7ed', trendDown: true },
                ].map((stat, index) => (
                    <Grid item xs={12} sm={6} lg={3} key={index}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 3,
                            border: '1px solid #e7edf3',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' }
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ bgcolor: stat.bg, color: stat.color, p: 1, borderRadius: 2 }}>
                                    {stat.icon}
                                </Box>
                                <Box sx={{
                                    bgcolor: stat.trendDown ? '#fef2f2' : '#f0fdf4',
                                    color: stat.trendDown ? '#dc2626' : '#16a34a',
                                    px: 1, py: 0.5, borderRadius: 10,
                                    fontSize: '0.75rem', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: 0.5
                                }}>
                                    {stat.trendDown ? <TrendingDownIcon sx={{ fontSize: 14 }} /> : <TrendingUpIcon sx={{ fontSize: 14 }} />}
                                    {stat.change}
                                </Box>
                            </Box>
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ color: '#4c739a', fontWeight: 500 }}>{stat.title}</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b', mt: 0.5 }}>{stat.value}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Middle Section: Chart & Activity */}
            <Grid container spacing={4}>
                {/* Chart Area */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Student Enrollment Trends</Typography>
                                <Typography variant="body2" sx={{ color: '#4c739a', mt: 0.5 }}>New students joined over the last 7 days</Typography>
                            </Box>
                            <Button
                                endIcon={<ExpandMoreIcon />}
                                sx={{ bgcolor: '#e7edf3', color: '#0d141b', textTransform: 'none', fontWeight: 500, borderRadius: 2, px: 2 }}
                            >
                                Last 7 Days
                            </Button>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 3 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b' }}>2,450</Typography>
                                <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TrendingUpIcon sx={{ fontSize: 16 }} />
                                    +15% vs last week
                                </Typography>
                            </Box>
                            {/* Chart Placeholder / SVG from HTML */}
                            <Box sx={{ position: 'relative', height: 256, width: '100%' }}>
                                {/* Grid Lines */}
                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    {[...Array(5)].map((_, i) => <Divider key={i} sx={{ borderStyle: 'dashed' }} />)}
                                </Box>
                                {/* SVG Chart */}
                                <svg style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 800 200">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.2"></stop>
                                            <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0"></stop>
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,150 C50,150 50,100 100,90 C150,80 150,120 200,110 C250,100 250,60 300,50 C350,40 350,80 400,70 C450,60 450,100 500,90 C550,80 550,30 600,20 C650,10 650,60 700,50 C750,40 750,80 800,70" fill="none" stroke={theme.palette.primary.main} strokeLinecap="round" strokeWidth="3"></path>
                                    <path d="M0,150 C50,150 50,100 100,90 C150,80 150,120 200,110 C250,100 250,60 300,50 C350,40 350,80 400,70 C450,60 450,100 500,90 C550,80 550,30 600,20 C650,10 650,60 700,50 C750,40 750,80 800,70 V200 H0 Z" fill="url(#chartGradient)" stroke="none"></path>
                                    {/* Data Points */}
                                    {[
                                        { cx: 100, cy: 90 }, { cx: 200, cy: 110 }, { cx: 300, cy: 50 },
                                        { cx: 400, cy: 70 }, { cx: 500, cy: 90 }, { cx: 600, cy: 20 }, { cx: 700, cy: 50 }
                                    ].map((pt, i) => (
                                        <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="white" stroke={theme.palette.primary.main} strokeWidth="2" />
                                    ))}
                                </svg>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, color: '#4c739a', fontSize: '0.75rem', fontWeight: 500, px: 2 }}>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 480 }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Recent Activity</Typography>
                            <Button sx={{ color: theme.palette.primary.main, textTransform: 'none', fontWeight: 600 }}>View All</Button>
                        </Box>
                        <Box sx={{ p: 2, overflowY: 'auto' }}>
                            {[
                                { user: 'Sarah Jenkins', action: 'Completed "UX Design Masterclass"', time: '2m ago', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNWXmxazerzZxI_RLjFy9sqpgOYoY9n25mW96Zc4XXt-VzR57T22lXR178C8MIDv9qSwf-QFwOpBFSfSe6EP9HaxR8EGkVbKHDTHoGoOl2NSOjftWFFNrrG3jBbY4gotfLGHGVckuBLWSOe35u3eOwx_BSEfN3fN1QVK9mQy5DvpQoynz2gteY_1RKfxTo91cFLCa6fSigIlpC_CDwl8-240lrPmcWSb6E0V8ztlYg_3wfhFk9Y-mCEJHQdXeCYEdXakS_6Jsb1DLC' },
                                { user: 'Course Update', sub: 'Instructor Mike uploaded "Advanced React"', time: '1h ago', icon: <UploadFileIcon sx={{ fontSize: 20 }} />, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.1) },
                                { user: 'David Chen', action: 'Enrolled in "Python for Data Science"', time: '3h ago', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7P5Zfnio8dLwbxN_kKlarbmDd9odR-KGrsIrLF5a062pcmZDm7jBdBu05x0N-hswdwYHKk3BRWVc6j8iGRKXTocM6ZUJtoMe_1vXDhNned_xFyA7VwsP_Gq7BwKbPr4DUyytvF9QpwjlBj4N20XivUP3zYrRlRQgM0D3M7lUqlZjw2F3GD_4k5YY0P4zdyPyev22_FDoGiQMmWQCr9-inJA_Gslk7uX2_jxak6NSMtr_fDe8ZevHIHRb5HOQJZW5V8CXhu1Ovt1X0' },
                                { user: 'System Alert', sub: 'Server backup completed successfully', time: '4h ago', icon: <WarningIcon sx={{ fontSize: 20 }} />, color: '#ea580c', bg: '#fff7ed' },
                                { user: 'Emily Rose', action: 'Posted a new question in Forum', time: '5h ago', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATmDf4lNjUh1mx7wL_OevHVJQI7PWLDTX5blr4ZS9tTRYRCfAXRuKJfBoWIcGWYlTakWXEOkfdhuHlYwK5KBR--i3rqSOvpSKCsPG_6zWrFCQr8XNsHsxjMtjADlMPwOwMavgzihdjy7lKY8n9lpZP9kVTXPI-tfuo5XC41f88epKGslGM_mMbPZdSX2XfKjPlJb-K10C1StCcg9RfFKyP3KDJg5eaYVXDlQePDsz3n6L0JZbVXqqZS1ddSo9gDxVB9998U2kCNG7r' },
                            ].map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 2, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f6f7f8' }, cursor: 'pointer', mb: 1 }}>
                                    <Box sx={{ position: 'relative' }}>
                                        {item.img ? (
                                            <Avatar src={item.img} sx={{ width: 40, height: 40, border: '2px solid white' }} />
                                        ) : (
                                            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.icon}
                                            </Box>
                                        )}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d141b' }}>{item.user}</Typography>
                                        <Typography variant="caption" sx={{ color: '#4c739a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {item.action || item.sub}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#4c739a', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.time}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Top Courses Table */}
            <Paper sx={{ borderRadius: 3, border: '1px solid #e7edf3', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden', mb: 4 }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>Top Performing Courses</Typography>
                    <Button startIcon={<FilterListIcon />} sx={{ color: '#4c739a', textTransform: 'none', '&:hover': { color: theme.palette.primary.main } }}>Filter</Button>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f6f7f8' }}>
                            <TableRow>
                                {['Course Name', 'Instructor', 'Enrolled', 'Rating', 'Status'].map(head => (
                                    <TableCell key={head} sx={{ color: '#4c739a', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{head}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[
                                { name: 'UX Design Masterclass', code: 'UX', color: '#2563eb', bg: '#dbeafe', inst: 'Michael Scott', enrolled: '1,240', rate: 4.9, active: true },
                                { name: 'Python for Data Science', code: 'PY', color: '#9333ea', bg: '#f3e8ff', inst: 'Angela Martin', enrolled: '890', rate: 4.8, active: true },
                                { name: 'Digital Marketing 101', code: 'DM', color: '#ea580c', bg: '#ffedd5', inst: 'Jim Halpert', enrolled: '654', rate: 4.6, active: false },
                            ].map((row, i) => (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f6f7f8' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: row.bg, color: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{row.code}</Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0d141b' }}>{row.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#4c739a' }}>{row.inst}</TableCell>
                                    <TableCell sx={{ color: '#4c739a' }}>{row.enrolled}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#eab308' }}>
                                            <StarIcon fontSize="small" />
                                            <Typography variant="body2" sx={{ color: '#0d141b' }}>{row.rate}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.active ? 'Active' : 'Draft'}
                                            size="small"
                                            sx={{
                                                bgcolor: row.active ? '#f0fdf4' : '#fefce8',
                                                color: row.active ? '#15803d' : '#a16207',
                                                fontWeight: 500,
                                                borderRadius: 4,
                                                '& .MuiChip-label': { px: 1.5 }
                                            }}
                                            icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: row.active ? '#22c55e' : '#eab308' }} />}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default Dashboard;
