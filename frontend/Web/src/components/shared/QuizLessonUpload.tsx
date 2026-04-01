'use client';

import React, { useMemo, useState } from 'react';
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    MenuItem,
    Menu,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    Quiz as QuizIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ReactSortable } from 'react-sortablejs';
import type { QuizQuestionType } from '@/services/courseService';

interface QuizQuestionForm {
    id: string;
    sourceQuestionId?: number;
    question_text: string;
    question_type: QuizQuestionType;
    options: string[];
    correct_answer: string;
    explanation: string;
}

interface InitialQuizQuestion {
    id: number;
    question_text: string;
    question_type: QuizQuestionType;
    correct_answer: string;
    explanation?: string;
    options?: Array<{ option_text: string; option_order?: number }>;
}

interface QuizLessonUploadProps {
    open: boolean;
    onClose: () => void;
    onBack?: () => void;
    onSave: (data: {
        title: string;
        questions: Array<{
            id?: number;
            question_text: string;
            question_type: QuizQuestionType;
            options?: string[];
            correct_answer: string;
            explanation?: string;
            order: number;
        }>;
    }) => void;
    initialData?: {
        title?: string;
        questions?: InitialQuizQuestion[];
    };
}

const createEmptyQuestion = (questionType: QuizQuestionType = 'multiple_choice'): QuizQuestionForm => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question_text: '',
    question_type: questionType,
    options: questionType === 'multiple_choice' ? [''] : ['', ''],
    correct_answer: questionType === 'true_false' ? 'true' : '',
    explanation: '',
});

const QuizLessonUpload: React.FC<QuizLessonUploadProps> = ({ open, onClose, onBack, onSave, initialData }) => {
    const theme = useTheme();
    const [title, setTitle] = useState(initialData?.title || '');
    const [questions, setQuestions] = useState<QuizQuestionForm[]>([createEmptyQuestion()]);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
    const [addTypeAnchorEl, setAddTypeAnchorEl] = useState<null | HTMLElement>(null);
    const [error, setError] = useState('');

    const mapInitialQuestion = (question: InitialQuizQuestion): QuizQuestionForm => {
        const sortedOptions = (question.options || [])
            .slice()
            .sort((a, b) => (a.option_order || 0) - (b.option_order || 0))
            .map((option) => option.option_text || '');

        return {
            id: `${question.id}`,
            sourceQuestionId: question.id,
            question_text: question.question_text || '',
            question_type: question.question_type,
            options: question.question_type === 'multiple_choice'
                ? (sortedOptions.length ? sortedOptions : [''])
                : ['True', 'False'],
            correct_answer: question.correct_answer || (question.question_type === 'true_false' ? 'true' : ''),
            explanation: question.explanation || '',
        };
    };

    React.useEffect(() => {
        if (open) {
            const mappedQuestions = (initialData?.questions || []).map(mapInitialQuestion);
            const initialQuestion = mappedQuestions.length ? mappedQuestions[0] : createEmptyQuestion();
            setTitle(initialData?.title || '');
            setQuestions(mappedQuestions.length ? mappedQuestions : [initialQuestion]);
            setSelectedQuestionId(initialQuestion.id);
            setError('');
        }
    }, [open, initialData]);

    React.useEffect(() => {
        if (!questions.length) return;
        const selectedExists = questions.some((q) => q.id === selectedQuestionId);
        if (!selectedExists) {
            setSelectedQuestionId(questions[0].id);
        }
    }, [questions, selectedQuestionId]);

    const addQuestion = (questionType: QuizQuestionType) => {
        const nextQuestion = createEmptyQuestion(questionType);
        setQuestions((prev) => [...prev, nextQuestion]);
        setSelectedQuestionId(nextQuestion.id);
        setError('');
    };

    const removeQuestion = (id: string) => {
        setQuestions((prev) => {
            if (prev.length <= 1) return prev;
            const idx = prev.findIndex((q) => q.id === id);
            const filtered = prev.filter((q) => q.id !== id);

            if (selectedQuestionId === id) {
                const fallbackIdx = idx > 0 ? idx - 1 : 0;
                setSelectedQuestionId(filtered[fallbackIdx].id);
            }

            return filtered;
        });
        setError('');
    };

    const updateQuestion = (id: string, updater: (q: QuizQuestionForm) => QuizQuestionForm) => {
        setQuestions((prev) => prev.map((q) => (q.id === id ? updater(q) : q)));
        setError('');
    };

    const canAddOption = (options: string[]) => options.length < 6;

    const selectedQuestion = useMemo(
        () => questions.find((q) => q.id === selectedQuestionId) || null,
        [questions, selectedQuestionId]
    );

    const selectedQuestionIndex = useMemo(
        () => questions.findIndex((q) => q.id === selectedQuestionId),
        [questions, selectedQuestionId]
    );

    const validationError = useMemo(() => {
        if (!title.trim()) return 'Quiz title is required.';
        if (!questions.length) return 'Add at least one question.';

        for (let i = 0; i < questions.length; i += 1) {
            const q = questions[i];
            const questionNo = i + 1;

            if (!q.question_text.trim()) return `Question ${questionNo}: text is required.`;
            if (q.question_type !== 'short_answer' && !q.correct_answer.trim()) {
                return `Question ${questionNo}: correct answer is required.`;
            }

            if (q.question_type === 'multiple_choice') {
                const options = q.options.map((o) => o.trim()).filter(Boolean);
                if (options.length < 2) return `Question ${questionNo}: add at least 2 options.`;
                const hasMatch = options.some((o) => o.toLowerCase() === q.correct_answer.trim().toLowerCase());
                if (!hasMatch) return `Question ${questionNo}: correct answer must match an option.`;
            }

            if (q.question_type === 'true_false') {
                const normalized = q.correct_answer.trim().toLowerCase();
                if (normalized !== 'true' && normalized !== 'false') {
                    return `Question ${questionNo}: correct answer must be True or False.`;
                }
            }

        }

        return '';
    }, [title, questions]);

    const handleSave = () => {
        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = questions.map((q, index) => {
            const options = q.question_type === 'multiple_choice'
                ? q.options.map((o) => o.trim()).filter(Boolean)
                : undefined;

            return {
                id: q.sourceQuestionId,
                question_text: q.question_text.trim(),
                question_type: q.question_type,
                options,
                correct_answer: q.correct_answer.trim(),
                explanation: q.explanation.trim() || undefined,
                order: index + 1,
            };
        });

        onSave({
            title: title.trim(),
            questions: payload,
        });
    };

    const openAddTypeMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAddTypeAnchorEl(event.currentTarget);
    };

    const closeAddTypeMenu = () => {
        setAddTypeAnchorEl(null);
    };

    const handleAddQuestionByType = (questionType: QuizQuestionType) => {
        addQuestion(questionType);
        closeAddTypeMenu();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: {
                    maxWidth: '1152px',
                    height: '90vh',
                    borderRadius: '1rem',
                    bgcolor: 'background.paper',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                },
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {onBack && (
                        <IconButton size="small" onClick={onBack} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9', color: theme.palette.primary.main } }}>
                            <ArrowBackIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    )}
                    <Box sx={{ width: 38, height: 38, borderRadius: '0.5rem', bgcolor: alpha(theme.palette.primary.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.primary.main }}>
                        <QuizIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1.05rem' }}>
                            Quiz Builder
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Add quiz questions for this lesson.
                        </Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8' }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 4, bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 2 }}>
                        <TextField
                            label="Quiz Title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError('');
                            }}
                            fullWidth
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: theme.palette.background.paper,
                                    borderRadius: '0.75rem',
                                    '& fieldset': { borderColor: theme.palette.divider },
                                },
                                '& .MuiInputBase-root': {
                                    minHeight: 56,
                                },
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, minHeight: { md: 440 } }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: '1rem',
                                borderColor: theme.palette.divider,
                                width: { xs: '100%', md: '25%' },
                                maxWidth: { md: 300 },
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                bgcolor: theme.palette.background.paper,
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, px: 0.5 }}>
                                Questions
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: { md: 360 }, overflowY: 'auto', pr: 0.5 }}>
                                {questions.map((question, index) => {
                                    const isActive = question.id === selectedQuestionId;
                                    return (
                                        <Paper
                                            key={question.id}
                                            variant="outlined"
                                            sx={{
                                                borderRadius: '0.5rem',
                                                borderColor: isActive ? theme.palette.primary.main : theme.palette.divider,
                                                bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : theme.palette.background.paper,
                                                px: 1.25,
                                                py: 0.9,
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Button
                                                    onClick={() => setSelectedQuestionId(question.id)}
                                                    sx={{
                                                        textTransform: 'none',
                                                        justifyContent: 'flex-start',
                                                        color: theme.palette.text.primary,
                                                        fontWeight: isActive ? 700 : 500,
                                                        p: 0,
                                                        minWidth: 0,
                                                        flex: 1,
                                                    }}
                                                >
                                                    <Box sx={{ textAlign: 'left', width: '100%' }}>
                                                        <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                                                            Question {index + 1}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {question.question_text.trim() || 'Untitled question'}
                                                        </Typography>
                                                    </Box>
                                                </Button>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeQuestion(question.id);
                                                    }}
                                                    disabled={questions.length === 1}
                                                    sx={{
                                                        color: theme.palette.text.disabled,
                                                        '&:hover': {
                                                            color: theme.palette.error.main,
                                                            bgcolor: alpha(theme.palette.error.main, 0.08),
                                                        },
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>

                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                onClick={openAddTypeMenu}
                                sx={{ textTransform: 'none', fontWeight: 600, borderStyle: 'dashed', borderRadius: '0.75rem', mt: 'auto' }}
                            >
                                Add New Question
                            </Button>
                            <Menu
                                anchorEl={addTypeAnchorEl}
                                open={Boolean(addTypeAnchorEl)}
                                onClose={closeAddTypeMenu}
                                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            >
                                <MenuItem onClick={() => handleAddQuestionByType('multiple_choice')}>Multiple Choice</MenuItem>
                                <MenuItem onClick={() => handleAddQuestionByType('true_false')}>True/False</MenuItem>
                                <MenuItem onClick={() => handleAddQuestionByType('short_answer')}>Short Answer</MenuItem>
                            </Menu>
                        </Paper>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                borderRadius: '1rem',
                                borderColor: theme.palette.divider,
                                width: { xs: '100%', md: '75%' },
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                                bgcolor: theme.palette.background.paper,
                            }}
                        >
                            {selectedQuestion ? (
                                <>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>
                                        Question Data {selectedQuestionIndex >= 0 ? `#${selectedQuestionIndex + 1}` : ''}
                                    </Typography>

                                    <TextField
                                        label="Question text"
                                        value={selectedQuestion.question_text}
                                        onChange={(e) => updateQuestion(selectedQuestion.id, (q) => ({ ...q, question_text: e.target.value }))}
                                        fullWidth
                                        size="small"
                                        multiline
                                        minRows={2}
                                    />

                                    {selectedQuestion.question_type === 'multiple_choice' && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                Options
                                            </Typography>
                                            {(() => {
                                                const optionItems = selectedQuestion.options.map((value, idx) => ({
                                                    id: `${selectedQuestion.id}-opt-${idx}`,
                                                    value,
                                                }));

                                                return (
                                            <ReactSortable
                                                list={optionItems}
                                                setList={(nextItems) => updateQuestion(selectedQuestion.id, (q) => ({
                                                    ...q,
                                                    options: nextItems.map((item) => item.value),
                                                }))}
                                                animation={150}
                                                handle=".option-drag-handle"
                                            >
                                                {optionItems.map((item, optIndex) => (
                                                    <Box key={item.id} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                        <IconButton className="option-drag-handle" size="small" sx={{ color: theme.palette.text.secondary, cursor: 'grab' }}>
                                                            <DragIndicatorIcon fontSize="small" />
                                                        </IconButton>
                                                        <TextField
                                                            value={item.value}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                updateQuestion(selectedQuestion.id, (q) => {
                                                                    const nextOptions = [...q.options];
                                                                    nextOptions[optIndex] = value;
                                                                    return { ...q, options: nextOptions };
                                                                });
                                                            }}
                                                            fullWidth
                                                            size="small"
                                                            placeholder={`Option ${optIndex + 1}`}
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                updateQuestion(selectedQuestion.id, (q) => {
                                                                    if (q.options.length <= 1) return q;
                                                                    return { ...q, options: q.options.filter((_, i) => i !== optIndex) };
                                                                });
                                                            }}
                                                            disabled={selectedQuestion.options.length <= 1}
                                                            sx={{
                                                                color: theme.palette.text.disabled,
                                                                '&:hover': {
                                                                    color: theme.palette.error.main,
                                                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                                                },
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </ReactSortable>
                                                );
                                            })()}
                                            <Button
                                                startIcon={<AddIcon />}
                                                onClick={() => {
                                                    updateQuestion(selectedQuestion.id, (q) => ({ ...q, options: [...q.options, ''] }));
                                                }}
                                                disabled={!canAddOption(selectedQuestion.options)}
                                                sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Add Option
                                            </Button>
                                        </Box>
                                    )}

                                    {selectedQuestion.question_type === 'true_false' && (
                                        <TextField
                                            select
                                            label="Correct answer"
                                            value={selectedQuestion.correct_answer || 'true'}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, (q) => ({ ...q, correct_answer: e.target.value }))}
                                            fullWidth
                                            size="small"
                                        >
                                            <MenuItem value="true">True</MenuItem>
                                            <MenuItem value="false">False</MenuItem>
                                        </TextField>
                                    )}

                                    {selectedQuestion.question_type === 'multiple_choice' && (
                                        <TextField
                                            select
                                            label="Correct answer"
                                            value={selectedQuestion.correct_answer}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, (q) => ({ ...q, correct_answer: e.target.value }))}
                                            fullWidth
                                            size="small"
                                        >
                                            {selectedQuestion.options
                                                .map((option) => option.trim())
                                                .filter((option) => option.length > 0)
                                                .map((option) => (
                                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                                ))}
                                        </TextField>
                                    )}

                                    {selectedQuestion.question_type === 'short_answer' && (
                                        <TextField
                                            label="Correct answer"
                                            value={selectedQuestion.correct_answer}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, (q) => ({ ...q, correct_answer: e.target.value }))}
                                            fullWidth
                                            size="small"
                                        />
                                    )}

                                    <TextField
                                        label="Explanation (optional)"
                                        value={selectedQuestion.explanation}
                                        onChange={(e) => updateQuestion(selectedQuestion.id, (q) => ({ ...q, explanation: e.target.value }))}
                                        fullWidth
                                        size="small"
                                        multiline
                                        minRows={2}
                                    />
                                </>
                            ) : (
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    Select a question to edit.
                                </Typography>
                            )}
                        </Paper>
                    </Box>

                    {error && (
                        <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 4, py: 2.5, bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc', borderTop: `1px solid ${theme.palette.divider}`, gap: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', color: '#64748b', px: 3, py: 1.25, borderRadius: '0.5rem', '&:hover': { bgcolor: theme.palette.action.hover } }}>
                    Cancel
                </Button>
                <Button onClick={handleSave} variant="contained" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', px: 4, py: 1.25, borderRadius: '0.5rem', boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
                    Save Quiz Lesson
                </Button>
            </DialogActions>
            </Box>
        </Dialog>
    );
};

export default QuizLessonUpload;
