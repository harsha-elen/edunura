import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Typography,
    Button,
    Breadcrumbs,
    Link as MuiLink,
    Paper,
    TextField,
    Select,
    MenuItem,
    Tabs,
    Tab,
    IconButton,
    CircularProgress,
    LinearProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    NavigateNext as NavigateNextIcon,
    DeleteOutline as DeleteOutlineIcon,
    AddCircle as AddCircleIcon,
    CloudUpload as CloudUploadIcon,
    FormatBold as FormatBoldIcon,
    FormatItalic as FormatItalicIcon,
    FormatListBulleted as FormatListBulletedIcon,
    FormatListNumbered as FormatListNumberedIcon,
    Link as LinkIcon,
    Image as ImageIconOutlined,
    DragIndicator as DragIndicatorIcon,
    Publish as PublishIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { ReactSortable } from "react-sortablejs";
import CurriculumSection from '../components/courses/CurriculumSection';
import PricingSection from '../components/courses/PricingSection';
import InstructorSection from '../components/courses/InstructorSection';
import StudentsSection from '../components/courses/StudentsSection';
import SettingsSection from '../components/courses/SettingsSection';
import { courseService, Instructor } from '../services/courseService';
import { getCategories, CourseCategory } from '../services/categories';
import { STATIC_ASSETS_BASE_URL } from '../services/apiClient';
import VideoPlayer from '../components/VideoPlayer';

interface SortableItem {
    id: string;
    name: string;
}

const CourseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState(0);
    const [courseId, setCourseId] = useState<number | null>(id ? parseInt(id) : null);
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const isEditMode = !!id;

    // Form State
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('beginner');
    const [status, setStatus] = useState('draft');
    const [outcomes, setOutcomes] = useState<SortableItem[]>([]);
    const [newOutcome, setNewOutcome] = useState('');
    const [prerequisites, setPrerequisites] = useState<SortableItem[]>([]);
    const [newPrerequisite, setNewPrerequisite] = useState('');
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [introVideo, setIntroVideo] = useState<string | null>(null);
    const [introVideoFile, setIntroVideoFile] = useState<File | null>(null);
    const [videoSourceType, setVideoSourceType] = useState<'upload' | 'url'>('upload');
    const [introVideoPreviewUrl, setIntroVideoPreviewUrl] = useState<string | null>(null);

    // Pricing State
    const [price, setPrice] = useState('');
    const [discountedPrice, setDiscountedPrice] = useState('');
    const [isFree, setIsFree] = useState(false);
    const [validityPeriod, setValidityPeriod] = useState<string>(''); // empty = lifetime, else days

    // Instructors State
    const [instructors, setInstructors] = useState<Instructor[]>([]);

    // Settings State
    const [forumEnabled, setForumEnabled] = useState(true);
    const [ratingEnabled, setRatingEnabled] = useState(false);
    const [certEnabled, setCertEnabled] = useState(true);
    const [visibility, setVisibility] = useState<'draft' | 'published'>('draft');
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [videoUploadProgress, setVideoUploadProgress] = useState(0);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const theme = useTheme();
    const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
    const videoInputRef = React.useRef<HTMLInputElement>(null);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories();
                setCategories(response.data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch course data if editing
    useEffect(() => {
        const fetchCourseData = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await courseService.getCourseById(parseInt(id));
                const course = response.data;

                // Populate form fields
                setTitle(course.title || '');
                setShortDescription(course.short_description || '');
                setDescription(course.description || '');
                setCategory(course.category || '');
                setLevel(course.level || 'beginner');
                setStatus(course.status || 'draft');

                // Handle outcomes
                if (course.outcomes) {
                    const outcomesArray = typeof course.outcomes === 'string'
                        ? JSON.parse(course.outcomes)
                        : course.outcomes;
                    setOutcomes(outcomesArray.map((o: string, i: number) => ({
                        id: Date.now().toString() + i,
                        name: o
                    })));
                }

                // Handle prerequisites
                if (course.prerequisites) {
                    const prereqArray = typeof course.prerequisites === 'string'
                        ? JSON.parse(course.prerequisites)
                        : course.prerequisites;
                    setPrerequisites(prereqArray.map((p: string, i: number) => ({
                        id: Date.now().toString() + i + 1000,
                        name: p
                    })));
                }

                // Media
                if (course.thumbnail) {
                    setThumbnail(course.thumbnail);
                }
                if (course.intro_video) {
                    setIntroVideo(course.intro_video);
                    // Determine if it's a URL or uploaded file
                    if (course.intro_video.startsWith('http')) {
                        setVideoSourceType('url');
                    }
                }

                // Pricing
                setPrice(course.price?.toString() || '');
                setDiscountedPrice(course.discounted_price?.toString() || '');
                setIsFree(course.is_free || course.price === 0);
                setValidityPeriod(course.validity_period?.toString() || '');

                // Instructors
                if (course.instructors) {
                    const instructorsArray = typeof course.instructors === 'string'
                        ? JSON.parse(course.instructors)
                        : course.instructors;
                    setInstructors(instructorsArray || []);
                }

                // Settings
                setForumEnabled(course.enable_discussion_forum ?? true);
                setRatingEnabled(course.show_course_rating ?? false);
                setCertEnabled(course.enable_certificate ?? true);
                setVisibility(course.visibility || 'draft');
                setMetaTitle(course.meta_title || '');
                setMetaDescription(course.meta_description || '');

            } catch (error: any) {
                console.error('Failed to fetch course:', error);
                showSnackbar(`Error loading course: ${error.response?.data?.message || error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [id]);

    const addOutcome = () => {
        if (newOutcome.trim()) {
            setOutcomes([...outcomes, { id: Date.now().toString(), name: newOutcome.trim() }]);
            setNewOutcome('');
        }
    };

    const removeOutcome = (index: number) => {
        setOutcomes(outcomes.filter((_, i) => i !== index));
    };

    const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnail(URL.createObjectURL(file));

            // Immediate upload if course exists
            if (courseId) {
                setUploadingThumbnail(true);
                setThumbnailUploadProgress(0);
                try {
                    const response = await courseService.uploadThumbnail(courseId, file, (progress) => {
                        setThumbnailUploadProgress(progress);
                    });
                    setThumbnail(response.data.path);
                    setThumbnailFile(null); // Clear after upload
                    showSnackbar('Thumbnail updated successfully', 'success');
                } catch (error: any) {
                    console.error('Failed to upload thumbnail:', error);
                    showSnackbar('Failed to upload thumbnail', 'error');
                } finally {
                    setUploadingThumbnail(false);
                }
            }
        }
    };

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIntroVideoFile(file);
            setIntroVideo(file.name);

            // Immediate upload if course exists
            if (courseId) {
                setUploadingVideo(true);
                setVideoUploadProgress(0);
                try {
                    const response = await courseService.uploadIntroVideo(courseId, file, (progress) => {
                        setVideoUploadProgress(progress);
                    });
                    setIntroVideo(response.data.path);
                    setIntroVideoFile(null); // Clear after upload
                    showSnackbar('Intro video updated successfully', 'success');
                } catch (error: any) {
                    console.error('Failed to upload intro video:', error);
                    showSnackbar('Failed to upload intro video', 'error');
                } finally {
                    setUploadingVideo(false);
                }
            }
        }
    };

    useEffect(() => {
        if (!introVideoFile) {
            setIntroVideoPreviewUrl(null);
            return;
        }

        const previewUrl = URL.createObjectURL(introVideoFile);
        setIntroVideoPreviewUrl(previewUrl);

        return () => {
            URL.revokeObjectURL(previewUrl);
        };
}, [introVideoFile]);

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const courseData = {
                title,
                short_description: shortDescription,
                description: description || 'No description provided',
                category,
                level,
                status: visibility,
                outcomes: outcomes.map(o => o.name),
                prerequisites: prerequisites.map(p => p.name),
                intro_video: videoSourceType === 'url' ? (introVideo ?? undefined) : undefined,
                price: isFree ? 0 : parseFloat(price),
                discounted_price: isFree ? 0 : (discountedPrice ? parseFloat(discountedPrice) : 0),
                is_free: isFree,
                validity_period: validityPeriod ? parseInt(validityPeriod) : null,
                instructors: instructors,
                enable_discussion_forum: forumEnabled,
                show_course_rating: ratingEnabled,
                enable_certificate: certEnabled,
                visibility: visibility,
                meta_title: metaTitle,
                meta_description: metaDescription,
            };

            let savedCourse;
            if (courseId) {
                const response = await courseService.updateCourse(courseId, courseData);
                savedCourse = response.data;
            } else {
                const response = await courseService.createCourse(courseData);
                savedCourse = response.data;
                setCourseId(savedCourse.id);
            }

            if (savedCourse && savedCourse.id) {
                if (thumbnailFile) {
                    setUploadingThumbnail(true);
                    setThumbnailUploadProgress(0);
                    try {
                        await courseService.uploadThumbnail(savedCourse.id, thumbnailFile, (progress) => {
                            setThumbnailUploadProgress(progress);
                        });
                        setThumbnailFile(null);
                    } finally {
                        setUploadingThumbnail(false);
                    }
                }
                if (videoSourceType === 'upload' && introVideoFile) {
                    setUploadingVideo(true);
                    setVideoUploadProgress(0);
                    try {
                        await courseService.uploadIntroVideo(savedCourse.id, introVideoFile, (progress) => {
                            setVideoUploadProgress(progress);
                        });
                        setIntroVideoFile(null);
                    } finally {
                        setUploadingVideo(false);
                    }
                }
            }

            setStatus('draft');
            showSnackbar('Course saved as draft!', 'success');
        } catch (error: any) {
            console.error('Failed to save draft:', error);
            showSnackbar(`Error saving draft: ${error.response?.data?.message || error.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const courseData = {
                title,
                short_description: shortDescription,
                description: description || 'No description provided',
                category,
                level,
                status: 'published',
                outcomes: outcomes.map(o => o.name),
                prerequisites: prerequisites.map(p => p.name),
                intro_video: videoSourceType === 'url' ? (introVideo ?? undefined) : undefined,
                price: isFree ? 0 : parseFloat(price),
                discounted_price: isFree ? 0 : (discountedPrice ? parseFloat(discountedPrice) : 0),
                is_free: isFree,
                validity_period: validityPeriod ? parseInt(validityPeriod) : null,
                instructors: instructors,
                enable_discussion_forum: forumEnabled,
                show_course_rating: ratingEnabled,
                enable_certificate: certEnabled,
                visibility: visibility,
                meta_title: metaTitle,
                meta_description: metaDescription,
            };

            let savedCourse;
            if (courseId) {
                const response = await courseService.updateCourse(courseId, courseData);
                savedCourse = response.data;
            } else {
                const response = await courseService.createCourse(courseData);
                savedCourse = response.data;
                setCourseId(savedCourse.id);
            }

            if (savedCourse && savedCourse.id) {
                if (thumbnailFile) {
                    setUploadingThumbnail(true);
                    setThumbnailUploadProgress(0);
                    try {
                        await courseService.uploadThumbnail(savedCourse.id, thumbnailFile, (progress) => {
                            setThumbnailUploadProgress(progress);
                        });
                        setThumbnailFile(null);
                    } finally {
                        setUploadingThumbnail(false);
                    }
                }
                if (videoSourceType === 'upload' && introVideoFile) {
                    setUploadingVideo(true);
                    setVideoUploadProgress(0);
                    try {
                        await courseService.uploadIntroVideo(savedCourse.id, introVideoFile, (progress) => {
                            setVideoUploadProgress(progress);
                        });
                        setIntroVideoFile(null);
                    } finally {
                        setUploadingVideo(false);
                    }
                }
            }

            setStatus('published');
            showSnackbar('Course published successfully!', 'success');
        } catch (error: any) {
            console.error('Failed to publish course:', error);
            showSnackbar(`Error publishing course: ${error.response?.data?.message || error.message}`, 'error');
        } finally {
            setPublishing(false);
        }
    };

    const addPrerequisite = () => {
        if (newPrerequisite.trim()) {
            setPrerequisites([...prerequisites, { id: Date.now().toString(), name: newPrerequisite.trim() }]);
            setNewPrerequisite('');
        }
    };

    const removePrerequisite = (index: number) => {
        setPrerequisites(prerequisites.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', m: -4, width: 'calc(100% + 64px)' }}>
            {/* Header Section - Attached to AdminLayout */}
            <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e7edf3', px: 0, py: 2, width: '100%', margin: 0 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { md: 'center' },
                        justifyContent: 'space-between',
                        gap: 2, px: 3,
                    }}
                >
                    <Box>
                        <Breadcrumbs
                            separator={<NavigateNextIcon fontSize="small" />}
                            aria-label="breadcrumb"
                            sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.75rem' } }}
                        >
                            <MuiLink component={Link} underline="hover" color="inherit" to="/dashboard">
                                Home
                            </MuiLink>
                            <MuiLink component={Link} underline="hover" color="inherit" to="/courses">
                                Courses
                            </MuiLink>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {isEditMode ? 'Edit Course' : 'Create New Course'}
                            </Typography>
                        </Breadcrumbs>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                            Course Manager
                        </Typography>
                    </Box>
<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: { xs: 'none', sm: 'inline' } }}>
                            Draft saved 2m ago
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={handleSaveDraft}
                            disabled={saving || publishing}
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                py: 0.75,
                                px: 2,
                                borderColor: '#e2e8f0',
                                color: '#475569',
                                '&:hover': { borderColor: '#475569', color: '#0f172a' },
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handlePublish}
                            disabled={saving || publishing}
                            startIcon={publishing ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                py: 0.75,
                                px: 2,
                                bgcolor: theme.palette.primary.main,
                                '&:hover': { bgcolor: theme.palette.primary.dark },
                            }}
                        >
                            {publishing ? 'Publishing...' : status === 'published' ? 'Update Published' : 'Publish'}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Hidden file inputs */}
            <input
                type="file"
                ref={thumbnailInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleThumbnailChange}
            />
            <input
                type="file"
                ref={videoInputRef}
                style={{ display: 'none' }}
                accept="video/*"
                onChange={handleVideoChange}
            />

            {/* Tabs Section */}
            <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e7edf3', margin: 0, width: '100%' }}>
                <Box sx={{ px: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_event, value) => setActiveTab(value)}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="course detail tabs"
                    >
                        <Tab label="Basic Information" sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                        <Tab label="Curriculum" sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                        <Tab label="Pricing" sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                        <Tab label="Instructors" sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                        <Tab label="Students" sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                        <Tab label="Settings" sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                    </Tabs>
                </Box>
            </Box>

            {/* Main Content - Full Width */}
            <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f6f7f8', px: 3, py: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {activeTab === 0 && (
                            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
                                {/* Left Column - Course Details */}
                                <Box sx={{ flex: { xs: '0 0 100%', lg: '1 1 60%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Paper sx={{ borderRadius: 2, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                                        <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                                Course Details
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                                Provide the essential text content for your course.
                                            </Typography>
                                        </Box>
                                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {/* Course Title */}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#0d141b' }}>
                                                    Course Title <span style={{ color: '#dc2626' }}>*</span>
                                                </Typography>
                                                <TextField
                                                    placeholder="e.g., Advanced React Patterns"
                                                    fullWidth
                                                    size="small"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: '#f6f7f8',
                                                            borderRadius: 1.5,
                                                            '& fieldset': { borderColor: '#e7edf3' },
                                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                                        },
                                                        '& .MuiOutlinedInput-input::placeholder': {
                                                            color: 'rgba(74, 115, 154, 0.5)',
                                                            opacity: 1,
                                                        },
                                                    }}
                                                />
                                            </Box>

                                            {/* Short Description */}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#0d141b' }}>
                                                    Short Description
                                                </Typography>
                                                <TextField
                                                    placeholder="Brief summary of what students will learn..."
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    size="small"
                                                    value={shortDescription}
                                                    onChange={(e) => setShortDescription(e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: '#f6f7f8',
                                                            borderRadius: 1.5,
                                                            '& fieldset': { borderColor: '#e7edf3' },
                                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                                        },
                                                        '& .MuiOutlinedInput-input::placeholder': {
                                                            color: 'rgba(74, 115, 154, 0.5)',
                                                            opacity: 1,
                                                        },
                                                    }}
                                                />
                                            </Box>

                                            {/* What you'll learn */}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#0d141b' }}>
                                                    What you'll learn
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <ReactSortable list={outcomes} setList={setOutcomes} handle=".drag-handle" animation={150}>
                                                        {outcomes.map((outcome, index) => (
                                                            <Box key={outcome.id} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
                                                                <Box className="drag-handle" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0, cursor: 'grab', color: '#64748b', '&:hover': { color: '#0d141b' }, p: 0.5 }}>
                                                                    <DragIndicatorIcon fontSize="small" />
                                                                </Box>
                                                                <TextField
                                                                    placeholder="e.g., Master Hooks and Context API"
                                                                    fullWidth
                                                                    size="small"
                                                                    value={outcome.name}
                                                                    disabled
                                                                    sx={{
                                                                        '& .MuiOutlinedInput-root': {
                                                                            backgroundColor: '#f6f7f8',
                                                                            borderRadius: 1.5,
                                                                            '& fieldset': { borderColor: '#e7edf3' },
                                                                        },
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => removeOutcome(index)}
                                                                    sx={{ color: '#64748b', '&:hover': { color: '#dc2626' }, flexShrink: 0 }}
                                                                >
                                                                    <DeleteOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        ))}
                                                    </ReactSortable>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <TextField
                                                            placeholder="e.g., Master Hooks and Context API"
                                                            fullWidth
                                                            size="small"
                                                            value={newOutcome}
                                                            onChange={(e) => setNewOutcome(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addOutcome();
                                                                }
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: '#f6f7f8',
                                                                    borderRadius: 1.5,
                                                                    '& fieldset': { borderColor: '#e7edf3' },
                                                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                                                },
                                                                '& .MuiOutlinedInput-input::placeholder': {
                                                                    color: 'rgba(74, 115, 154, 0.5)',
                                                                    opacity: 1,
                                                                },
                                                            }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={addOutcome}
                                                            sx={{ color: theme.palette.primary.main, flexShrink: 0 }}
                                                        >
                                                            <AddCircleIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    <Button
                                                        startIcon={<AddCircleIcon />}
                                                        onClick={addOutcome}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            color: theme.palette.primary.main,
                                                            fontSize: '0.875rem',
                                                            justifyContent: 'flex-start',
                                                            pl: 0,
                                                            '&:hover': { bgcolor: 'transparent' },
                                                        }}
                                                    >
                                                        Add another outcome
                                                    </Button>
                                                </Box>
                                            </Box>

                                            {/* Prerequisites */}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#0d141b' }}>
                                                    Prerequisites
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <ReactSortable list={prerequisites} setList={setPrerequisites} handle=".drag-handle" animation={150}>
                                                        {prerequisites.map((prerequisite, index) => (
                                                            <Box key={prerequisite.id} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
                                                                <Box className="drag-handle" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0, cursor: 'grab', color: '#64748b', '&:hover': { color: '#0d141b' }, p: 0.5 }}>
                                                                    <DragIndicatorIcon fontSize="small" />
                                                                </Box>
                                                                <TextField
                                                                    placeholder="e.g., JavaScript Basics"
                                                                    fullWidth
                                                                    size="small"
                                                                    value={prerequisite.name}
                                                                    disabled
                                                                    sx={{
                                                                        '& .MuiOutlinedInput-root': {
                                                                            backgroundColor: '#f6f7f8',
                                                                            borderRadius: 1.5,
                                                                            '& fieldset': { borderColor: '#e7edf3' },
                                                                        },
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => removePrerequisite(index)}
                                                                    sx={{ color: '#64748b', '&:hover': { color: '#dc2626' }, flexShrink: 0 }}
                                                                >
                                                                    <DeleteOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        ))}
                                                    </ReactSortable>
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <TextField
                                                            placeholder="e.g., JavaScript Basics"
                                                            fullWidth
                                                            size="small"
                                                            value={newPrerequisite}
                                                            onChange={(e) => setNewPrerequisite(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addPrerequisite();
                                                                }
                                                            }}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: '#f6f7f8',
                                                                    borderRadius: 1.5,
                                                                    '& fieldset': { borderColor: '#e7edf3' },
                                                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                                                },
                                                                '& .MuiOutlinedInput-input::placeholder': {
                                                                    color: 'rgba(74, 115, 154, 0.5)',
                                                                    opacity: 1,
                                                                },
                                                            }}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={addPrerequisite}
                                                            sx={{ color: theme.palette.primary.main, flexShrink: 0 }}
                                                        >
                                                            <AddCircleIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    <Button
                                                        startIcon={<AddCircleIcon />}
                                                        onClick={addPrerequisite}
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            color: theme.palette.primary.main,
                                                            fontSize: '0.875rem',
                                                            justifyContent: 'flex-start',
                                                            pl: 0,
                                                            '&:hover': { bgcolor: 'transparent' },
                                                        }}
                                                    >
                                                        Add another requisite
                                                    </Button>
                                                </Box>
                                            </Box>

                                            {/* Long Description */}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#0d141b' }}>
                                                    Long Description
                                                </Typography>
                                                <Paper variant="outlined" sx={{ borderRadius: 1.5, borderColor: '#e7edf3', overflow: 'hidden' }}>
                                                    <Box
                                                        sx={{
                                                            bgcolor: '#ffffff',
                                                            borderBottom: '1px solid #e7edf3',
                                                            p: 1,
                                                            display: 'flex',
                                                            gap: 0.5,
                                                            alignItems: 'center',
                                                            overflowX: 'auto',
                                                            flexWrap: 'wrap',
                                                        }}
                                                    >
                                                        {[
                                                            { icon: FormatBoldIcon, label: 'Bold' },
                                                            { icon: FormatItalicIcon, label: 'Italic' },
                                                        ].map((btn, i) => (
                                                            <IconButton
                                                                key={i}
                                                                size="small"
                                                                sx={{
                                                                    p: 0.75,
                                                                    '&:hover': { bgcolor: '#f1f5f9' },
                                                                    color: '#0d141b',
                                                                }}
                                                            >
                                                                <btn.icon fontSize="small" />
                                                            </IconButton>
                                                        ))}
                                                        <Box sx={{ width: '1px', height: 16, bgcolor: '#e7edf3', mx: 0.5 }} />
                                                        {[
                                                            { icon: FormatListBulletedIcon, label: 'Bulleted' },
                                                            { icon: FormatListNumberedIcon, label: 'Numbered' },
                                                        ].map((btn, i) => (
                                                            <IconButton
                                                                key={i}
                                                                size="small"
                                                                sx={{
                                                                    p: 0.75,
                                                                    '&:hover': { bgcolor: '#f1f5f9' },
                                                                    color: '#0d141b',
                                                                }}
                                                            >
                                                                <btn.icon fontSize="small" />
                                                            </IconButton>
                                                        ))}
                                                        <Box sx={{ width: '1px', height: 16, bgcolor: '#e7edf3', mx: 0.5 }} />
                                                        {[
                                                            { icon: LinkIcon, label: 'Link' },
                                                            { icon: ImageIconOutlined, label: 'Image' },
                                                        ].map((btn, i) => (
                                                            <IconButton
                                                                key={i}
                                                                size="small"
                                                                sx={{
                                                                    p: 0.75,
                                                                    '&:hover': { bgcolor: '#f1f5f9' },
                                                                    color: '#0d141b',
                                                                }}
                                                            >
                                                                <btn.icon fontSize="small" />
                                                            </IconButton>
                                                        ))}
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            position: 'relative',
                                                            minHeight: '200px',
                                                            height: '300px',
                                                            overflow: 'auto',
                                                            resize: 'vertical',
                                                        }}
                                                    >
                                                        <TextField
                                                            placeholder="Detailed information about the course content..."
                                                            fullWidth
                                                            multiline
                                                            rows={12}
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            sx={{
                                                                height: '100%',
                                                                p: 2,
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: 'transparent',
                                                                    borderRadius: 0,
                                                                    height: '100%',
                                                                    '& fieldset': { borderColor: 'transparent' },
                                                                    '&:hover fieldset': { borderColor: 'transparent' },
                                                                    '&.Mui-focused fieldset': { borderColor: 'transparent' },
                                                                },
                                                                '& .MuiOutlinedInput-input': { color: '#0d141b', height: '100%', resize: 'none' },
                                                                '& .MuiOutlinedInput-input::placeholder': {
                                                                    color: 'rgba(74, 115, 154, 0.5)',
                                                                    opacity: 1,
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </Paper>
                                            </Box>                                </Box>
                                    </Paper>
                                </Box>

                                {/* Right Column - Course Media */}
                                <Box sx={{ flex: { xs: '0 0 100%', lg: '1 1 40%' }, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                                    <Paper sx={{ borderRadius: 2, border: '1px solid #e7edf3', overflow: 'hidden' }}>
                                        <Box sx={{ p: 3, borderBottom: '1px solid #e7edf3' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                                                Course Media
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                                Upload visual assets and promotional video.
                                            </Typography>
                                        </Box>
                                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                                            {/* Course Thumbnail */}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#0d141b' }}>
                                                    Course Thumbnail
                                                </Typography>
                                                <Box
                                                    onClick={() => thumbnailInputRef.current?.click()}
                                                    sx={{
                                                        border: '2px dashed #e7edf3',
                                                        borderRadius: 2,
                                                        p: 3,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        textAlign: 'center',
                                                        gap: 1,
                                                        bgcolor: '#ffffff',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { bgcolor: '#f8fafc', borderColor: theme.palette.primary.main },
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: '50%',
                                                            bgcolor: 'rgba(43, 140, 238, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <CloudUploadIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                                                    </Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d141b' }}>
                                                        Click to upload thumbnail
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                        JPG, PNG (1280x720 recommended)
                                                    </Typography>
                                                </Box>

                                                {uploadingThumbnail && (
                                                    <Box sx={{ mt: 2, width: '100%' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <Box sx={{ flexGrow: 1, mr: 1 }}>
                                                                <LinearProgress variant="determinate" value={thumbnailUploadProgress} sx={{ height: 8, borderRadius: 4 }} />
                                                            </Box>
                                                            <Box sx={{ minWidth: 35 }}>
                                                                <Typography variant="body2" color="text.secondary">{`${Math.round(thumbnailUploadProgress)}%`}</Typography>
                                                            </Box>
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            Uploading thumbnail...
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {thumbnail && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Box sx={{ mb: 1.5 }}>
                                                            <Box
                                                                component="img"
                                                                src={thumbnail?.startsWith('blob:') ? thumbnail : `${STATIC_ASSETS_BASE_URL}/${thumbnail}`}
                                                                alt="Thumbnail Preview"
                                                                sx={{
                                                                    width: '100%',
                                                                    height: 'auto',
                                                                    borderRadius: 1.5,
                                                                    border: '1px solid #e7edf3',
                                                                    display: 'block',
                                                                    objectFit: 'cover',
                                                                    maxHeight: 300
                                                                }}
                                                            />
                                                        </Box>
                                                        <Paper
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: 1.5,
                                                                border: '1px solid #e7edf3',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 2,
                                                                bgcolor: '#f8fafc',
                                                            }}
                                                        >
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d141b', display: 'block' }} noWrap>
                                                                    {thumbnailFile ? thumbnailFile.name : (thumbnail && !thumbnail.startsWith('blob:') ? thumbnail.split('/').pop() : 'course-thumbnail.jpg')}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                    {thumbnailFile ? `${(thumbnailFile.size / 1024).toFixed(1)} KB` : 'Uploaded'} • 1280x720 recommended
                                                                </Typography>
                                                            </Box>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => { setThumbnail(null); setThumbnailFile(null); }}
                                                                sx={{ color: '#64748b', '&:hover': { color: '#dc2626' } }}
                                                            >
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Paper>
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* Course Intro Video */}
                                            <Box sx={{ width: '100%', minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#0d141b' }}>
                                                    Course Intro Video
                                                </Typography>

                                                {/* Video Source Toggle */}
                                                <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                                                    <Box
                                                        onClick={() => setVideoSourceType('upload')}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            cursor: 'pointer',
                                                            color: videoSourceType === 'upload' ? theme.palette.primary.main : '#64748b'
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            width: 18,
                                                            height: 18,
                                                            borderRadius: '50%',
                                                            border: videoSourceType === 'upload' ? `5px solid ${theme.palette.primary.main}` : '2px solid #cbd5e1',
                                                            boxSizing: 'border-box'
                                                        }} />
                                                        <Typography variant="body2" fontWeight={videoSourceType === 'upload' ? 600 : 400}>
                                                            Upload Video
                                                        </Typography>
                                                    </Box>
                                                    <Box
                                                        onClick={() => setVideoSourceType('url')}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            cursor: 'pointer',
                                                            color: videoSourceType === 'url' ? theme.palette.primary.main : '#64748b'
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            width: 18,
                                                            height: 18,
                                                            borderRadius: '50%',
                                                            border: videoSourceType === 'url' ? `5px solid ${theme.palette.primary.main}` : '2px solid #cbd5e1',
                                                            boxSizing: 'border-box'
                                                        }} />
                                                        <Typography variant="body2" fontWeight={videoSourceType === 'url' ? 600 : 400}>
                                                            External URL
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, width: '100%' }}>
                                                    {videoSourceType === 'upload' ? (
                                                        <>
                                                            <Box
                                                                onClick={() => videoInputRef.current?.click()}
                                                                sx={{
                                                                    border: '2px dashed #e7edf3',
                                                                    borderRadius: 2,
                                                                    p: 3,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    textAlign: 'center',
                                                                    gap: 1,
                                                                    bgcolor: '#ffffff',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': { bgcolor: '#f8fafc', borderColor: theme.palette.primary.main },
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 48,
                                                                        height: 48,
                                                                        borderRadius: '50%',
                                                                        bgcolor: 'rgba(43, 140, 238, 0.1)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <CloudUploadIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                                                                </Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d141b' }}>
                                                                    Upload preview video
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                    MP4, WebM (Max. 50MB)
                                                                </Typography>
                                                            </Box>

                                                            {uploadingVideo && (
                                                                <Box sx={{ mt: 2, width: '100%' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                        <Box sx={{ flexGrow: 1, mr: 1 }}>
                                                                            <LinearProgress variant="determinate" value={videoUploadProgress} sx={{ height: 8, borderRadius: 4 }} />
                                                                        </Box>
                                                                        <Box sx={{ minWidth: 35 }}>
                                                                            <Typography variant="body2" color="text.secondary">{`${Math.round(videoUploadProgress)}%`}</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                        Uploading video... please wait.
                                                                    </Typography>
                                                                </Box>
                                                            )}

                                                            {(introVideoPreviewUrl || (introVideo && !introVideo.startsWith('http'))) && (
                                                                <Box sx={{ mt: 2, width: '100%', minWidth: 0 }}>
                                                                    <Box sx={{ width: '100%', borderRadius: 1.5, overflow: 'hidden', bgcolor: '#000', mb: 2, aspectRatio: '16/9' }}>
                                                                        <VideoPlayer
                                                                            src={introVideoPreviewUrl || (introVideo ? (introVideo.startsWith('blob:') ? introVideo : `${STATIC_ASSETS_BASE_URL}/${introVideo}`) : '')}
                                                                            autoPlay={false}
                                                                        />
                                                                    </Box>
                                                                    <Paper
                                                                        sx={{
                                                                            p: 1.5,
                                                                            borderRadius: 1.5,
                                                                            border: '1px solid #e7edf3',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 2,
                                                                            bgcolor: '#f8fafc',
                                                                        }}
                                                                    >
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d141b', display: 'block' }} noWrap>
                                                                                {introVideoFile ? introVideoFile.name : (introVideo && !introVideo.startsWith('blob:') ? introVideo.split('/').pop() : 'intro-video.mp4')}
                                                                            </Typography>
                                                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                                {introVideoFile ? `${(introVideoFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Uploaded'} • MP4 or WebM
                                                                            </Typography>
                                                                        </Box>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => { setIntroVideo(null); setIntroVideoFile(null); }}
                                                                            sx={{ color: '#64748b', '&:hover': { color: '#dc2626' } }}
                                                                        >
                                                                            <DeleteOutlineIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Paper>
                                                                </Box>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TextField
                                                                placeholder="Or paste video URL (YouTube, Vimeo...)"
                                                                fullWidth
                                                                size="small"
                                                                value={introVideo && introVideo.startsWith('http') ? introVideo : ''}
                                                                onChange={(e) => {
                                                                    setIntroVideo(e.target.value);
                                                                    setIntroVideoFile(null);
                                                                }}
                                                                sx={{
                                                                    minWidth: 0,
                                                                    width: '100%',
                                                                    '& .MuiOutlinedInput-root': {
                                                                        backgroundColor: '#f6f7f8',
                                                                        borderRadius: 1.5,
                                                                        '& fieldset': { borderColor: '#e7edf3' },
                                                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                                                    },
                                                                    '& .MuiOutlinedInput-input': {
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    },
                                                                    '& .MuiOutlinedInput-input::placeholder': {
                                                                        color: 'rgba(74, 115, 154, 0.5)',
                                                                        opacity: 1,
                                                                    },
                                                                }}
                                                            />
                                                            {introVideo && introVideo.startsWith('http') && (
                                                                <Box sx={{ mt: 2, width: '100%', minWidth: 0 }}>
                                                                    <Box sx={{ width: '100%', borderRadius: 1.5, overflow: 'hidden', bgcolor: '#000', mb: 2, aspectRatio: '16/9' }}>
                                                                        <VideoPlayer
                                                                            src={introVideo}
                                                                            autoPlay={false}
                                                                        />
                                                                    </Box>
                                                                    <Paper
                                                                        sx={{
                                                                            p: 1.5,
                                                                            borderRadius: 1.5,
                                                                            border: '1px solid #e7edf3',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 2,
                                                                            bgcolor: '#f8fafc',
                                                                        }}
                                                                    >
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d141b', display: 'block' }} noWrap>
                                                                                External Video URL
                                                                            </Typography>
                                                                            <Typography variant="caption" sx={{ color: '#64748b', wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'auto' }}>
                                                                                {introVideo}
                                                                            </Typography>
                                                                        </Box>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => { setIntroVideo(null); }}
                                                                            sx={{ color: '#64748b', '&:hover': { color: '#dc2626' } }}
                                                                        >
                                                                            <DeleteOutlineIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Paper>
                                                                </Box>
                                                            )}
                                                        </>
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Category and Level */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, borderTop: '1px solid #e7edf3' }}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#0d141b' }}>
                                                        Category <span style={{ color: '#dc2626' }}>*</span>
                                                    </Typography>
                                                    <Select
                                                        displayEmpty
                                                        value={category}
                                                        onChange={(e) => setCategory(e.target.value)}
                                                        fullWidth
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#f6f7f8',
                                                            borderRadius: 1.5,
                                                            '& fieldset': { borderColor: '#e7edf3' },
                                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                                        }}
                                                    >
                                                        <MenuItem disabled value="">
                                                            Select a category
                                                        </MenuItem>
                                                        {categories.map((cat) => (
                                                            <MenuItem key={cat.id} value={cat.slug}>
                                                                {cat.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#0d141b' }}>
                                                        Level
                                                    </Typography>
                                                    <Select
                                                        value={level}
                                                        onChange={(e) => setLevel(e.target.value)}
                                                        fullWidth
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#f6f7f8',
                                                            borderRadius: 1.5,
                                                            '& fieldset': { borderColor: '#e7edf3' },
                                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                                        }}
                                                    >
                                                        <MenuItem value="beginner">Beginner</MenuItem>
                                                        <MenuItem value="intermediate">Intermediate</MenuItem>
                                                        <MenuItem value="advanced">Advanced</MenuItem>
                                                    </Select>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Box>
                            </Box>
                        )}

                        {activeTab === 1 && (
                            <>
                                {courseId ? (
                                    <CurriculumSection courseId={courseId} onCourseIdChange={setCourseId} />
                                ) : (
                                    <CurriculumSection courseId={0} onCourseIdChange={setCourseId} />
                                )}
                            </>
                        )}

                        {activeTab === 2 && (
                            <PricingSection
                                price={price}
                                setPrice={setPrice}
                                discountedPrice={discountedPrice}
                                setDiscountedPrice={setDiscountedPrice}
                                isFree={isFree}
                                setIsFree={setIsFree}
                                validityPeriod={validityPeriod}
                                setValidityPeriod={setValidityPeriod}
                            />
                        )}

                        {activeTab === 3 && (
                            <InstructorSection instructors={instructors} setInstructors={setInstructors} />
                        )}

                        {activeTab === 4 && courseId && (
                            <StudentsSection 
                                courseId={courseId} 
                                enrollmentLimit={parseInt(validityPeriod) || undefined}
                            />
                        )}

                        {activeTab === 5 && (
                            <SettingsSection
                                forumEnabled={forumEnabled}
                                setForumEnabled={setForumEnabled}
                                ratingEnabled={ratingEnabled}
                                setRatingEnabled={setRatingEnabled}
                                certEnabled={certEnabled}
                                setCertEnabled={setCertEnabled}
                                visibility={visibility}
                                setVisibility={setVisibility}
                                metaTitle={metaTitle}
                                setMetaTitle={setMetaTitle}
                                metaDescription={metaDescription}
                                setMetaDescription={setMetaDescription}
                            />
                        )}

{/* Bottom Action Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pb: 4 }}>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    await handleSaveDraft();
                                    if (activeTab < 4) {
                                        setActiveTab(activeTab + 1);
                                    }
                                }}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 4,
                                    py: 1.5,
                                    bgcolor: theme.palette.primary.main,
                                    '&:hover': { bgcolor: theme.palette.primary.dark },
                                }}
                            >
                                Next: {activeTab === 0 ? 'Curriculum' : activeTab === 1 ? 'Pricing' : activeTab === 2 ? 'Instructors' : activeTab === 3 ? 'Students' : activeTab === 4 ? 'Settings' : 'Save Course'}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CourseDetails;
