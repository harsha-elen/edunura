import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Dialog,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
    Switch,
    Paper,
} from '@mui/material';
import {
    Close as CloseIcon,
    Description as DescriptionIcon,
    PictureAsPdf as PictureAsPdfIcon,
    DescriptionOutlined as DescriptionOutlinedIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    Attachment as AttachmentIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Snackbar,
    Alert,
} from '@mui/material';
import { courseService } from '../../services/courseService';
import { STATIC_ASSETS_BASE_URL } from '../../services/apiClient';
// @ts-ignore
import EditorJS from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import Paragraph from '@editorjs/paragraph';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Quote from '@editorjs/quote';
// @ts-ignore
import LinkTool from '@editorjs/link';
// @ts-ignore
import Image from '@editorjs/image';
// @ts-ignore
import Code from '@editorjs/code';
// @ts-ignore
import Embed from '@editorjs/embed';
// @ts-ignore
import Table from '@editorjs/table';
// @ts-ignore
import Delimiter from '@editorjs/delimiter';
// @ts-ignore
import Checklist from '@editorjs/checklist';
// @ts-ignore
import Marker from '@editorjs/marker';
// @ts-ignore
import InlineCode from '@editorjs/inline-code';
// @ts-ignore
import Raw from '@editorjs/raw';

interface TextMediaLessonUploadProps {
    open: boolean;
    onClose: () => void;
    onBack: () => void;
    onSave: (lessonData: {
        title: string;
        description: string;
        allowPreview: boolean;
        resources: Array<{ name: string; size: string; type: string }>; // For display/metadata if needed
        resourceFiles: File[];
        resourcesToDelete: number[];
    }) => void;
    initialData?: {
        lessonId?: number;
        title: string;
        description: string;
        allowPreview: boolean;
        resources: Array<{ id?: number; name: string; size: string; type: string }>;
    };
}

interface UploadedFile {
    id?: number;
    name: string;
    size: string;
    type: string;
}

const TextMediaLessonUpload: React.FC<TextMediaLessonUploadProps> = ({ open, onClose, onBack, onSave, initialData }) => {
    const theme = useTheme();
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [allowPreview, setAllowPreview] = useState(initialData?.allowPreview || false);
    const [lessonId, setLessonId] = useState<number | null>(initialData?.lessonId ?? null);

    // Existing resources from DB
    const [existingResources, setExistingResources] = useState<UploadedFile[]>([]);
    // New files to upload
    const [resourceFiles, setResourceFiles] = useState<File[]>([]);
    // IDs of resources to delete
    const [resourcesToDelete, setResourcesToDelete] = useState<number[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'warning' | 'success' });

    const [errors, setErrors] = useState<{ title?: string }>({});

    const showSnackbar = (message: string, severity: 'error' | 'warning' | 'success' = 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const editorRef = useRef<any>(null);
    const initialDescriptionRef = useRef<string>('');
    const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const titleRef = useRef(title);
    const allowPreviewRef = useRef(allowPreview);

    const draftKey = useMemo(() => {
        return lessonId ? `text-lesson-draft-${lessonId}` : 'text-lesson-draft-new';
    }, [lessonId]);

    useEffect(() => {
        titleRef.current = title;
    }, [title]);

    useEffect(() => {
        allowPreviewRef.current = allowPreview;
    }, [allowPreview]);

    React.useEffect(() => {
        if (open && initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setAllowPreview(initialData.allowPreview || false);
            setLessonId(initialData.lessonId ?? null);
            initialDescriptionRef.current = initialData.description || '';
            if (initialData.resources) {
                setExistingResources(initialData.resources as UploadedFile[]);
            } else {
                setExistingResources([]);
            }
            setResourceFiles([]);
            setResourcesToDelete([]);
        } else if (open && !initialData) {
            setTitle('');
            setDescription('');
            setAllowPreview(false);
            setLessonId(null);
            initialDescriptionRef.current = '';
            setExistingResources([]);
            setResourceFiles([]);
            setResourcesToDelete([]);
        }

        if (open) {
            const draftRaw = localStorage.getItem(draftKey);
            if (draftRaw) {
                try {
                    const draft = JSON.parse(draftRaw);
                    const hasInitialDescription = initialData?.description && initialData.description.trim().length > 0;
                    if (!hasInitialDescription && draft?.description) {
                        const restored = typeof draft.description === 'string' ? draft.description : JSON.stringify(draft.description);
                        setDescription(restored);
                        initialDescriptionRef.current = restored;
                    }
                    if (!initialData && draft?.title) {
                        setTitle(draft.title);
                    }
                    if (!initialData && typeof draft?.allowPreview === 'boolean') {
                        setAllowPreview(draft.allowPreview);
                    }
                } catch {
                    // Ignore invalid draft data
                }
            }
        }
    }, [open, initialData]);

    useEffect(() => {
        if (!open) return;

        let isMounted = true;

        const getInitialEditorData = () => {
            const seed = initialDescriptionRef.current || '';
            if (!seed) {
                return {
                    time: Date.now(),
                    blocks: [
                        {
                            type: 'paragraph',
                            data: { text: '' },
                        },
                    ],
                    version: '2.28.2',
                };
            }
            try {
                const parsed = JSON.parse(seed);
                if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
                    return parsed;
                }
                return {
                    time: Date.now(),
                    blocks: [
                        {
                            type: 'paragraph',
                            data: { text: '' },
                        },
                    ],
                    version: '2.28.2',
                };
            } catch {
                const text = seed.trim();
                return {
                    time: Date.now(),
                    blocks: [
                        {
                            type: 'paragraph',
                            data: { text },
                        },
                    ],
                    version: '2.28.2',
                };
            }
        };

        const initializeEditor = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 100));

                const holderElement = document.getElementById('editorjs-holder');
                if (!holderElement) {
                    console.error('Editor.js holder element not found');
                    return;
                }

                holderElement.innerHTML = '';

                if (editorRef.current && editorRef.current.destroy) {
                    try {
                        await editorRef.current.destroy();
                    } catch (e) {
                        console.error('Error destroying editor:', e);
                    }
                    editorRef.current = null;
                }

                const parsedData = getInitialEditorData();

                // @ts-ignore
                const editor = new EditorJS({
                    holder: 'editorjs-holder',
                    inlineToolbar: true,
                    tools: {
                        // @ts-ignore - Editor.js type definitions are strict
                        header: { class: Header, inlineToolbar: true },
                        // @ts-ignore
                        paragraph: { class: Paragraph, inlineToolbar: true },
                        list: { class: List, inlineToolbar: true },
                        checklist: { class: Checklist, inlineToolbar: true },
                        quote: { class: Quote, inlineToolbar: true },
                        code: { class: Code, inlineToolbar: false },
                        link: { class: LinkTool, inlineToolbar: false },
                        image: {
                            class: Image,
                            inlineToolbar: false,
                            config: {
                                uploader: {
                                    uploadByFile: async (file: File) => {
                                        if (!lessonId) {
                                            return { success: 0, message: 'Save the lesson first to upload images.' } as any;
                                        }
                                        try {
                                            const response = await courseService.uploadLessonResource(lessonId, file);
                                            const resource = response.data;
                                            const url = `${STATIC_ASSETS_BASE_URL}/${resource.file_path}`;
                                            return {
                                                success: 1,
                                                file: {
                                                    url,
                                                    name: resource.title,
                                                    size: resource.file_size,
                                                    mime: resource.file_type,
                                                },
                                            } as any;
                                        } catch (error) {
                                            return { success: 0, message: 'Image upload failed.' } as any;
                                        }
                                    },
                                },
                            },
                        },
                        embed: { class: Embed, inlineToolbar: false },
                        // @ts-ignore
                        table: { class: Table, inlineToolbar: false },
                        marker: { class: Marker, inlineToolbar: true },
                        inlineCode: { class: InlineCode, inlineToolbar: true },
                        delimiter: { class: Delimiter, inlineToolbar: false },
                        raw: { class: Raw, inlineToolbar: false },
                    },
                    data: parsedData,
                    onChange: async () => {
                        if (!editorRef.current) return;
                        try {
                            const outputData = await editorRef.current.save();
                            const serialized = JSON.stringify(outputData);
                            setDescription(serialized);
                            if (draftSaveTimeoutRef.current) {
                                clearTimeout(draftSaveTimeoutRef.current);
                            }
                            draftSaveTimeoutRef.current = setTimeout(() => {
                                const payload = {
                                    title: titleRef.current,
                                    allowPreview: allowPreviewRef.current,
                                    description: serialized,
                                    updatedAt: Date.now(),
                                };
                                localStorage.setItem(draftKey, JSON.stringify(payload));
                            }, 400);
                        } catch (error) {
                            console.error('Editor.js onChange error:', error);
                        }
                    },
                });

                if (isMounted) {
                    editorRef.current = editor;
                    await editor.isReady;
                }
            } catch (error) {
                console.error('Editor.js initialization error:', error);
            }
        };

        if (!editorRef.current) {
            initializeEditor();
        }

        return () => {
            isMounted = false;
            if (editorRef.current && editorRef.current.destroy) {
                try {
                    editorRef.current.destroy();
                } catch (e) {
                    console.error('Error destroying editor:', e);
                }
                editorRef.current = null;
            }
        };
    }, [open]);

    const handleResourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                showSnackbar('Resource file must be under 50MB. Please choose a smaller file.', 'error');
                event.target.value = '';
                return;
            }
            setResourceFiles([...resourceFiles, file]);
        }
        // Reset input
        event.target.value = '';
    };

    const handleRemoveByFile = (index: number) => {
        setResourceFiles(resourceFiles.filter((_, i) => i !== index));
    };

    const handleRemoveExisting = (index: number) => {
        const resource = existingResources[index];
        if (resource.id) {
            setResourcesToDelete([...resourcesToDelete, resource.id]);
        }
        setExistingResources(existingResources.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setErrors({ title: 'Lesson title is required' });
            return;
        }

        let descriptionJson = description;
        if (editorRef.current && editorRef.current.save) {
            try {
                const outputData = await editorRef.current.save();
                descriptionJson = JSON.stringify(outputData);
            } catch (error) {
                console.error('Error saving editor content:', error);
            }
        }

        onSave({
            title: title.trim(),
            description: descriptionJson,
            allowPreview,
            resources: existingResources,
            resourceFiles,
            resourcesToDelete,
        });
        localStorage.removeItem(draftKey);
        onClose();
    };

    const handleCloseModal = () => {
        setTitle('');
        setErrors({});
        setAllowPreview(false);
        if (draftSaveTimeoutRef.current) {
            clearTimeout(draftSaveTimeoutRef.current);
            draftSaveTimeoutRef.current = null;
        }
        onClose();
    };

    const handleBackClick = () => {
        setTitle('');
        setErrors({});
        setAllowPreview(false);
        if (draftSaveTimeoutRef.current) {
            clearTimeout(draftSaveTimeoutRef.current);
            draftSaveTimeoutRef.current = null;
        }
        onBack();
    };

    return (
        <Dialog
            open={open}
            onClose={handleCloseModal}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: {
                    maxWidth: '1152px',
                    height: '90vh',
                    borderRadius: '1rem',
                    bgcolor: 'background.paper',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <Box sx={{
                    px: 4,
                    py: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    bgcolor: '#fff',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {!initialData && (
                            <IconButton
                                onClick={handleBackClick}
                                sx={{
                                    color: '#64748b',
                                    '&:hover': { bgcolor: '#f1f5f9', color: theme.palette.primary.main }
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                {initialData ? 'Edit Text Lesson' : 'Create Text Lesson'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                Add rich text content and attachment to your lesson
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleCloseModal} sx={{ color: '#94a3b8' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', bgcolor: '#f8fafc' }}>
                    {/* Main Content Area */}
                    <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                    }}>
                        {/* Title Section */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 4, height: 16, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
                                Lesson Title
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="e.g., Introduction to the Project"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (errors.title) setErrors({});
                                }}
                                error={!!errors.title}
                                helperText={errors.title}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#fff',
                                        borderRadius: '0.75rem',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    }
                                }}
                            />
                        </Box>

                        {/* Content Editor Section */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 4, height: 16, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
                                Lesson Content
                            </Typography>
                            <Paper sx={{
                                flex: 1,
                                p: 3,
                                borderRadius: '1rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: 'none',
                                overflow: 'auto',
                                minHeight: '400px',
                                '& #editorjs-holder': {
                                    paddingLeft: '32px',
                                    paddingRight: '32px',
                                },
                                '& .ce-toolbar': {
                                    left: '0 !important',
                                    right: '0 !important',
                                    width: '100% !important',
                                    paddingLeft: '32px',
                                    paddingRight: '32px',
                                },
                                '& .ce-toolbar__content': {
                                    maxWidth: '100% !important',
                                    width: '100% !important',
                                },
                                '& .ce-toolbar__plus, & .ce-toolbar__settings-btn': {
                                    color: '#64748b',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                }
                            }}>
                                <div id="editorjs-holder" />
                            </Paper>
                        </Box>
                    </Box>

                    {/* Right Sidebar */}
                    <Box sx={{
                        width: 360,
                        borderLeft: '1px solid #e2e8f0',
                        bgcolor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                            {/* Settings */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2 }}>
                                    Lesson Settings
                                </Typography>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: '0.75rem',
                                    border: '1px solid #f1f5f9',
                                    bgcolor: '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                            Free Preview
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            Allow students to view without enrolling
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={allowPreview}
                                        onChange={(e) => setAllowPreview(e.target.checked)}
                                    />
                                </Box>
                            </Box>

                            {/* Resources */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 2 }}>
                                    Resources
                                </Typography>

                                <Box
                                    onClick={() => document.getElementById('admin-sidebar-resource-input')?.click()}
                                    sx={{
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: '0.75rem',
                                        p: 3,
                                        textAlign: 'center',
                                        bgcolor: '#f8fafc',
                                        cursor: 'pointer',
                                        mb: 3,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                                        }
                                    }}
                                >
                                    <input
                                        id="admin-sidebar-resource-input"
                                        type="file"
                                        style={{ display: 'none' }}
                                        onChange={handleResourceFileChange}
                                    />
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#ffffff',
                                        borderRadius: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 1.5,
                                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <AttachmentIcon sx={{ color: theme.palette.primary.main }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                                        Click to upload or drag and drop resources
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        PDF, ZIP, DOCX (Max 50MB)
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {/* Existing Resources */}
                                    {existingResources.map((file, index) => (
                                        <Paper
                                            key={`existing-${index}`}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '0.75rem',
                                                border: '1px solid #f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                boxShadow: 'none',
                                                bgcolor: '#ffffff',
                                                '&:hover': { bgcolor: '#f8fafc' }
                                            }}
                                        >
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '0.5rem',
                                                bgcolor: file.type === 'pdf' ? '#fee2e2' : '#dbeafe',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {file.type === 'pdf' ?
                                                    <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 20 }} /> :
                                                    <DescriptionOutlinedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                                                }
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                    {file.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    {file.size} • Existing
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveExisting(index)}
                                                sx={{ color: '#94a3b8' }}
                                            >
                                                <CloseIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Paper>
                                    ))}

                                    {/* New Resources */}
                                    {resourceFiles.map((file, index) => (
                                        <Paper
                                            key={`new-${index}`}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '0.75rem',
                                                border: '1px solid #bae6fd',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                boxShadow: 'none',
                                                bgcolor: '#f0f9ff',
                                                '&:hover': { bgcolor: '#e0f2fe' }
                                            }}
                                        >
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '0.5rem',
                                                bgcolor: '#dbeafe',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <DescriptionOutlinedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                    {file.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB • New
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveByFile(index)}
                                                sx={{ color: '#94a3b8' }}
                                            >
                                                <CloseIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Paper>
                                    ))}
                                </Box>
                            </Box>

                            <Box sx={{
                                mt: 4,
                                p: 2,
                                borderRadius: '0.75rem',
                                bgcolor: 'rgba(59, 130, 246, 0.05)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                display: 'flex',
                                gap: 2,
                            }}>
                                <DescriptionIcon sx={{ color: '#3b82f6', flexShrink: 0 }} />
                                <Box>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af', mb: 0.5 }}>
                                        Quick Tip
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.5 }}>
                                        Use text lessons for theory, case studies, or reading assignments. Embed external images or links to make it interactive.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{
                    px: 4,
                    py: 2.5,
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 2,
                    borderTop: '1px solid #e2e8f0',
                }}>
                    <Button
                        onClick={handleCloseModal}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: '#64748b',
                            px: 3,
                            py: 1.25,
                            borderRadius: '0.5rem',
                            '&:hover': {
                                bgcolor: '#e2e8f0',
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        startIcon={<SaveIcon sx={{ fontSize: '0.875rem' }} />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            bgcolor: theme.palette.primary.main,
                            px: 4,
                            py: 1.25,
                            borderRadius: '0.5rem',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: theme.palette.primary.dark,
                                boxShadow: 'none',
                            }
                        }}
                    >
                        Save Lesson
                    </Button>
                </Box>
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Dialog>
    );
};

export default TextMediaLessonUpload;
