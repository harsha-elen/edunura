'use client';

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
    Publish as PublishIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import PricingSection from './courses/PricingSection';
import InstructorSection from './courses/InstructorSection';
import type { Instructor } from './courses/InstructorSection';
import SettingsSection from './courses/SettingsSection';
import StudentsSection from './courses/StudentsSection';
import CurriculumSection from './courses/CurriculumSection';
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });
import { createCourse, updateCourse, getCourse, uploadCourseFile } from '@/services/courseService';
import { getCategories, CourseCategory } from '@/services/categories';
import { STATIC_ASSETS_BASE_URL } from '@/services/apiClient';

interface SortableItem {
    id: string;
    name: string;
}

interface CreateCourseProps {
    editCourseId?: string;
}

const CreateCourse: React.FC<CreateCourseProps> = ({ editCourseId }) => {
    const router = useRouter();
    const isEditMode = !!editCourseId;
    const [activeTab, setActiveTab] = useState(0);
    const [courseId, setCourseId] = useState<number | null>(editCourseId ? parseInt(editCourseId) : null);
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loadingCourse, setLoadingCourse] = useState(isEditMode);

    // Form State
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('beginner');
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
    const [validityPeriod, setValidityPeriod] = useState<string>('');

    // Instructors State
    const [instructors, setInstructors] = useState<Instructor[]>([]);

    // Settings State
    const [forumEnabled, setForumEnabled] = useState(true);
    const [ratingEnabled, setRatingEnabled] = useState(false);
    const [certEnabled, setCertEnabled] = useState(true);
    const [visibility, setVisibility] = useState<'draft' | 'published'>('draft');
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');

    // UI State
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

    // Load course data in edit mode
    useEffect(() => {
        if (!editCourseId) return;
        const loadCourse = async () => {
            setLoadingCourse(true);
            try {
                const response = await getCourse(editCourseId);
                const course = response.data;

                setTitle(course.title || '');
                setShortDescription(course.short_description || '');
                setDescription(course.description || '');
                setCategory(course.category || '');
                setLevel(course.level || 'beginner');
                setVisibility(course.status === 'published' ? 'published' : 'draft');

                // Outcomes
                const parsedOutcomes = typeof course.outcomes === 'string'
                    ? JSON.parse(course.outcomes || '[]')
                    : (course.outcomes || []);
                setOutcomes(parsedOutcomes.map((name: string, i: number) => ({ id: String(i), name })));

                // Prerequisites
                const parsedPrereqs = typeof course.prerequisites === 'string'
                    ? JSON.parse(course.prerequisites || '[]')
                    : (course.prerequisites || []);
                setPrerequisites(parsedPrereqs.map((name: string, i: number) => ({ id: String(i), name })));

                // Thumbnail
                if (course.thumbnail) {
                    setThumbnail(`${STATIC_ASSETS_BASE_URL}/${course.thumbnail}`);
                }

                // Intro video
                if (course.intro_video) {
                    const isUrl = course.intro_video.startsWith('http');
                    if (isUrl) {
                        setVideoSourceType('url');
                        setIntroVideo(course.intro_video);
                    } else {
                        setVideoSourceType('upload');
                        setIntroVideo(course.intro_video);
                        setIntroVideoPreviewUrl(`${STATIC_ASSETS_BASE_URL}/${course.intro_video}`);
                    }
                }

                // Pricing
                setPrice(course.price != null ? String(course.price) : '');
                setDiscountedPrice(course.discounted_price != null ? String(course.discounted_price) : '');
                setIsFree(!!course.is_free);
                setValidityPeriod(course.validity_period != null ? String(course.validity_period) : '');

                // Instructors
                const parsedInstructors = typeof course.instructors === 'string'
                    ? JSON.parse(course.instructors || '[]')
                    : (course.instructors || []);
                setInstructors(parsedInstructors);

                // Settings
                setForumEnabled(course.enable_discussion_forum ?? true);
                setRatingEnabled(course.show_course_rating ?? false);
                setCertEnabled(course.enable_certificate ?? true);
                setMetaTitle(course.meta_title || '');
                setMetaDescription(course.meta_description || '');

                setCourseId(course.id);
            } catch (error) {
                console.error('Failed to load course:', error);
                showSnackbar('Failed to load course data', 'error');
            } finally {
                setLoadingCourse(false);
            }
        };
        loadCourse();
    }, [editCourseId]);

    // Video preview URL lifecycle
    useEffect(() => {
        if (!introVideoFile) {
            setIntroVideoPreviewUrl(null);
            return;
        }
        const previewUrl = URL.createObjectURL(introVideoFile);
        setIntroVideoPreviewUrl(previewUrl);
        return () => { URL.revokeObjectURL(previewUrl); };
    }, [introVideoFile]);

    const addOutcome = () => {
        if (newOutcome.trim()) {
            setOutcomes([...outcomes, { id: Date.now().toString(), name: newOutcome.trim() }]);
            setNewOutcome('');
        }
    };

    const removeOutcome = (index: number) => {
        setOutcomes(outcomes.filter((_, i) => i !== index));
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

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnail(URL.createObjectURL(file));
        }
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIntroVideoFile(file);
            setIntroVideo(file.name);
        }
    };

    const buildCourseData = (status: string): Record<string, unknown> => {
        const data: Record<string, unknown> = {
            title,
            short_description: shortDescription,
            description: description || 'No description provided',
            category,
            level,
            status,
            outcomes: outcomes.map(o => o.name),
            prerequisites: prerequisites.map(p => p.name),
            price: isFree ? 0 : parseFloat(price) || 0,
            discounted_price: isFree ? 0 : parseFloat(discountedPrice) || 0,
            is_free: isFree,
            instructors,
            enable_discussion_forum: forumEnabled,
            show_course_rating: ratingEnabled,
            enable_certificate: certEnabled,
            visibility,
            meta_title: metaTitle,
            meta_description: metaDescription,
        };
        if (videoSourceType === 'url' && introVideo) {
            data.intro_video = introVideo;
        }
        if (validityPeriod) {
            data.validity_period = parseInt(validityPeriod);
        }
        return data;
    };

    const uploadFiles = async (courseId: number) => {
        if (videoSourceType === 'upload' && introVideoFile) {
            setUploadingVideo(true);
            setVideoUploadProgress(0);
            try {
                const videoFormData = new FormData();
                videoFormData.append('intro_video', introVideoFile);
                await uploadCourseFile(courseId, videoFormData);
                setIntroVideoFile(null);
                setVideoUploadProgress(100);
            } catch (error) {
                console.error('Failed to upload intro video:', error);
                showSnackbar('Failed to upload intro video', 'error');
            } finally {
                setUploadingVideo(false);
            }
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const data = buildCourseData(visibility);
            let savedCourse;

            if (courseId) {
                const response = await updateCourse(courseId, data);
                savedCourse = response.data;
            } else {
                const response = await createCourse(data);
                savedCourse = response.data;
            }

            const id = savedCourse?.id || courseId;
            if (id) {
                await uploadFiles(id);
                setCourseId(id);
            }

            showSnackbar(isEditMode ? 'Course updated successfully!' : 'Course saved as draft!', 'success');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('Failed to save draft:', error);
            showSnackbar(`Error saving draft: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const data = buildCourseData('published');
            let savedCourse;

            if (courseId) {
                const response = await updateCourse(courseId, data);
                savedCourse = response.data;
            } else {
                const response = await createCourse(data);
                savedCourse = response.data;
            }

            const id = savedCourse?.id || courseId;
            if (id) {
                setCourseId(id);
                await uploadFiles(id);
            }

            showSnackbar('Course published successfully!', 'success');

            if (id) {
                setTimeout(() => router.push('/admin/courses'), 1500);
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('Failed to publish course:', error);
            showSnackbar(`Error publishing course: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setPublishing(false);
        }
    };

    const tabLabels = ['Basic Information', 'Curriculum', 'Pricing', 'Instructors', 'Students', 'Settings'];

    if (loadingCourse) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', m: -4, width: 'calc(100% + 64px)' }}>
            {/* Header Section */}
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
                            <MuiLink component={Link} underline="hover" color="inherit" href="/admin">
                                Home
                            </MuiLink>
                            <MuiLink component={Link} underline="hover" color="inherit" href="/admin/courses">
                                Courses
                            </MuiLink>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {isEditMode ? 'Edit Course' : 'Create New Course'}
                            </Typography>
                        </Breadcrumbs>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0d141b' }}>
                            {isEditMode ? 'Edit Course' : 'Course Manager'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
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
                            {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Draft'}
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
                            {publishing ? 'Publishing...' : 'Publish'}
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
                        aria-label="create course tabs"
                    >
                        {tabLabels.map((label) => (
                            <Tab key={label} label={label} sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }} />
                        ))}
                    </Tabs>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f6f7f8', px: 3, py: 3 }}>
                {/* Tab 0: Basic Information */}
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
                                            What you&apos;ll learn
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {outcomes.map((outcome, index) => (
                                                <Box key={outcome.id} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
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
                                            {prerequisites.map((prerequisite, index) => (
                                                <Box key={prerequisite.id} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
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
                                                        sx={{ p: 0.75, '&:hover': { bgcolor: '#f1f5f9' }, color: '#0d141b' }}
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
                                                        sx={{ p: 0.75, '&:hover': { bgcolor: '#f1f5f9' }, color: '#0d141b' }}
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
                                                        sx={{ p: 0.75, '&:hover': { bgcolor: '#f1f5f9' }, color: '#0d141b' }}
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
                                    </Box>
                                </Box>
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
                                                        src={thumbnail}
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
                                                            {thumbnailFile ? thumbnailFile.name : 'course-thumbnail.jpg'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                            {thumbnailFile ? `${(thumbnailFile.size / 1024).toFixed(1)} KB` : 'Selected'} &bull; 1280x720 recommended
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

                                                    {introVideoPreviewUrl && (
                                                        <Box sx={{ mt: 2, width: '100%', minWidth: 0 }}>
                                                            <Box sx={{ width: '100%', mb: 2 }}>
                                                                <VideoPlayer
                                                                    src={introVideoPreviewUrl}
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
                                                                        {introVideoFile ? introVideoFile.name : 'intro-video.mp4'}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                                        {introVideoFile ? `${(introVideoFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Selected'} &bull; MP4 or WebM
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
                                                            <Box sx={{ width: '100%', mb: 2 }}>
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

                {/* Tab 1: Curriculum */}
                {activeTab === 1 && (
                    courseId ? (
                        <CurriculumSection courseId={courseId} />
                    ) : (
                        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 8, px: 3, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                                Save the course first
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#4c739a' }}>
                                You need to save the course before managing the curriculum.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleSaveDraft}
                                disabled={saving}
                                sx={{ mt: 3, textTransform: 'none', fontWeight: 600, bgcolor: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.dark } }}
                            >
                                {saving ? 'Saving...' : 'Save Course Now'}
                            </Button>
                        </Box>
                    )
                )}

                {/* Tab 2: Pricing */}
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

                {/* Tab 3: Instructors */}
                {activeTab === 3 && (
                    <InstructorSection instructors={instructors} setInstructors={setInstructors} />
                )}

                {/* Tab 4: Students */}
                {activeTab === 4 && (
                    courseId ? (
                        <StudentsSection
                            courseId={courseId}
                            enrollmentLimit={validityPeriod ? parseInt(validityPeriod) : undefined}
                        />
                    ) : (
                        <Box sx={{ maxWidth: '1152px', mx: 'auto', py: 8, px: 3, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                                Save the course first
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#4c739a' }}>
                                You need to save the course before managing student enrollments.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleSaveDraft}
                                disabled={saving}
                                sx={{ mt: 3, textTransform: 'none', fontWeight: 600, bgcolor: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.dark } }}
                            >
                                {saving ? 'Saving...' : 'Save Course Now'}
                            </Button>
                        </Box>
                    )
                )}

                {/* Tab 5: Settings */}
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
                            if (activeTab < tabLabels.length - 1) {
                                setActiveTab(activeTab + 1);
                            } else {
                                await handleSaveDraft();
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
                        {activeTab < tabLabels.length - 1
                            ? `Next: ${tabLabels[activeTab + 1]}`
                            : 'Save Course'}
                    </Button>
                </Box>
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

export default CreateCourse;
