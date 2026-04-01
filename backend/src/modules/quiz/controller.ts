import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../../middleware/auth';
import { CourseSection, Enrollment, Lesson, QuizAttempt, QuizQuestion, QuizQuestionOption } from '../../models';
import { EnrollmentStatus } from '../../models/Enrollment';

const VALID_TYPES = ['multiple_choice', 'true_false', 'short_answer'] as const;
type QuizType = typeof VALID_TYPES[number];

const normalizeForComparison = (value: string): string =>
    value.trim().replace(/\s+/g, ' ').toLowerCase();

const parsePositiveInt = (value: string): number | null => {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
};

type EnsureQuizLessonResult =
    | { lesson: Lesson; courseId: number }
    | { error: { status: number; message: string } };

type QuizResultStatus = 'correct' | 'wrong' | 'review';

interface QuizAttemptResult {
    question_id: number;
    status: QuizResultStatus;
    correct_answer?: string;
    explanation?: string | null;
}

interface QuizSubmissionAnswerInput {
    question_id: number;
    student_answer: string;
}

const ensureQuizLesson = async (lessonId: number): Promise<EnsureQuizLessonResult> => {
    const lesson = await Lesson.findByPk(lessonId, {
        include: [{
            model: CourseSection,
            as: 'section',
            attributes: ['course_id'],
        }],
    });

    if (!lesson) {
        return { error: { status: 404, message: 'Lesson not found' } };
    }

    if (lesson.content_type !== 'quiz') {
        return { error: { status: 400, message: 'Lesson is not a quiz type' } };
    }

    const section = lesson.get('section') as CourseSection | null;
    if (!section) {
        return { error: { status: 404, message: 'Lesson section not found' } };
    }

    return { lesson, courseId: section.course_id };
};

const canBypassEnrollmentCheck = (role?: string): boolean =>
    role === 'admin' || role === 'teacher' || role === 'moderator';

const ensureQuizAccess = async (
    req: AuthRequest,
    courseId: number
): Promise<{ allowed: true } | { allowed: false; status: number; message: string }> => {
    if (!req.userId) {
        return { allowed: false, status: 401, message: 'Unauthorized' };
    }

    const enrollment = await Enrollment.findOne({
        where: {
            course_id: courseId,
            student_id: req.userId,
            status: {
                [Op.in]: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
            },
        },
    });

    if (!enrollment && !canBypassEnrollmentCheck(req.user?.role)) {
        return { allowed: false, status: 403, message: 'You are not enrolled in this course' };
    }

    return { allowed: true };
};

const normalizeSubmissionAnswers = (rawAnswers: unknown): QuizSubmissionAnswerInput[] => {
    if (!Array.isArray(rawAnswers)) return [];

    return rawAnswers
        .map((item) => {
            const questionId = Number((item as any)?.question_id);
            const studentAnswer = (item as any)?.student_answer;

            if (!Number.isInteger(questionId) || questionId <= 0 || typeof studentAnswer !== 'string') {
                return null;
            }

            return {
                question_id: questionId,
                student_answer: studentAnswer,
            };
        })
        .filter((item): item is QuizSubmissionAnswerInput => item !== null);
};

const safeParseJson = <T>(value: unknown, fallback: T): T => {
    if (value === null || value === undefined) return fallback;

    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }

    return value as T;
};

const serializeAttempt = (attempt: QuizAttempt) => ({
    id: attempt.id,
    lesson_id: attempt.lesson_id,
    student_id: attempt.student_id,
    answers: safeParseJson<Record<string, string>>(attempt.answers, {}),
    results: safeParseJson<QuizAttemptResult[]>(attempt.results, []),
    total_questions: attempt.total_questions,
    correct_count: attempt.correct_count,
    wrong_count: attempt.wrong_count,
    review_count: attempt.review_count,
    submitted_at: attempt.submitted_at,
});

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, lessonId } = req.params;
        const lessonIdNum = parsePositiveInt(lessonId);
        const courseIdNum = parsePositiveInt(courseId);

        if (!lessonIdNum || !courseIdNum) {
            res.status(400).json({ status: 'error', message: 'Invalid course or lesson ID' });
            return;
        }

        const quizCheck = await ensureQuizLesson(lessonIdNum);
        if ('error' in quizCheck) {
            const { status, message } = quizCheck.error;
            res.status(status).json({ status: 'error', message });
            return;
        }

        if (quizCheck.courseId !== courseIdNum) {
            res.status(400).json({ status: 'error', message: 'Lesson does not belong to this course' });
            return;
        }

        const {
            question_text,
            question_type,
            correct_answer,
            explanation,
            options,
            order,
        } = req.body;

        if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
            res.status(400).json({ status: 'error', message: 'Question text is required' });
            return;
        }

        if (!question_type || !VALID_TYPES.includes(question_type)) {
            res.status(400).json({ status: 'error', message: 'Invalid question type' });
            return;
        }

        if (typeof correct_answer !== 'string') {
            res.status(400).json({ status: 'error', message: 'correct_answer must be a string' });
            return;
        }

        if (question_type !== 'short_answer' && !correct_answer.trim()) {
            res.status(400).json({ status: 'error', message: 'Correct answer is required' });
            return;
        }

        const maxOrder = await QuizQuestion.max('order', { where: { lesson_id: lessonIdNum } });
        const questionOrder = typeof order === 'number' ? order : ((maxOrder as number | null) ?? 0) + 1;

        const createdQuestion = await QuizQuestion.create({
            lesson_id: lessonIdNum,
            question_text: question_text.trim(),
            question_type,
            correct_answer: correct_answer.trim(),
            explanation: typeof explanation === 'string' ? explanation.trim() : undefined,
            order: questionOrder,
        });

        const shouldPersistOptions = question_type === 'multiple_choice' || question_type === 'true_false';
        let createdOptions: QuizQuestionOption[] = [];

        if (shouldPersistOptions) {
            let normalizedOptions: string[] = [];

            if (question_type === 'true_false') {
                normalizedOptions = ['True', 'False'];
            } else if (Array.isArray(options)) {
                normalizedOptions = options
                    .filter((opt: unknown) => typeof opt === 'string')
                    .map((opt: string) => opt.trim())
                    .filter((opt: string) => opt.length > 0);
            }

            if (question_type === 'multiple_choice' && normalizedOptions.length < 2) {
                await createdQuestion.destroy();
                res.status(400).json({ status: 'error', message: 'Multiple choice question must include at least 2 options' });
                return;
            }

            if (question_type === 'true_false') {
                const normalizedAnswer = normalizeForComparison(correct_answer);
                if (normalizedAnswer !== 'true' && normalizedAnswer !== 'false') {
                    await createdQuestion.destroy();
                    res.status(400).json({ status: 'error', message: 'True/False question correct_answer must be true or false' });
                    return;
                }
            } else {
                const hasCorrectOption = normalizedOptions.some((opt) => normalizeForComparison(opt) === normalizeForComparison(correct_answer));
                if (!hasCorrectOption) {
                    await createdQuestion.destroy();
                    res.status(400).json({ status: 'error', message: 'correct_answer must match one of the provided options' });
                    return;
                }
            }

            createdOptions = await Promise.all(
                normalizedOptions.map((optionText, index) => QuizQuestionOption.create({
                    question_id: createdQuestion.id,
                    option_text: optionText,
                    option_order: index + 1,
                }))
            );
        }

        res.status(201).json({
            status: 'success',
            message: 'Question created successfully',
            data: {
                ...createdQuestion.toJSON(),
                options: createdOptions,
            },
        });
    } catch (error: any) {
        console.error('Create Quiz Question Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
};

export const getQuestionsForTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, lessonId } = req.params;
        const lessonIdNum = parsePositiveInt(lessonId);
        const courseIdNum = parsePositiveInt(courseId);

        if (!lessonIdNum || !courseIdNum) {
            res.status(400).json({ status: 'error', message: 'Invalid course or lesson ID' });
            return;
        }

        const quizCheck = await ensureQuizLesson(lessonIdNum);
        if ('error' in quizCheck) {
            const { status, message } = quizCheck.error;
            res.status(status).json({ status: 'error', message });
            return;
        }

        if (quizCheck.courseId !== courseIdNum) {
            res.status(400).json({ status: 'error', message: 'Lesson does not belong to this course' });
            return;
        }

        const questions = await QuizQuestion.findAll({
            where: { lesson_id: lessonIdNum },
            include: [{
                model: QuizQuestionOption,
                as: 'options',
            }],
            order: [['order', 'ASC'], [{ model: QuizQuestionOption, as: 'options' }, 'option_order', 'ASC']],
        });

        res.status(200).json({ status: 'success', data: questions });
    } catch (error: any) {
        console.error('Get Quiz Questions (Teacher) Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
};

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, lessonId, questionId } = req.params;
        const lessonIdNum = parsePositiveInt(lessonId);
        const courseIdNum = parsePositiveInt(courseId);
        const questionIdNum = parsePositiveInt(questionId);

        if (!lessonIdNum || !courseIdNum || !questionIdNum) {
            res.status(400).json({ status: 'error', message: 'Invalid course, lesson, or question ID' });
            return;
        }

        const quizCheck = await ensureQuizLesson(lessonIdNum);
        if ('error' in quizCheck) {
            const { status, message } = quizCheck.error;
            res.status(status).json({ status: 'error', message });
            return;
        }

        if (quizCheck.courseId !== courseIdNum) {
            res.status(400).json({ status: 'error', message: 'Lesson does not belong to this course' });
            return;
        }

        const question = await QuizQuestion.findOne({ where: { id: questionIdNum, lesson_id: lessonIdNum } });
        if (!question) {
            res.status(404).json({ status: 'error', message: 'Question not found' });
            return;
        }

        const {
            question_text,
            question_type,
            correct_answer,
            explanation,
            options,
            order,
        } = req.body;

        const nextType: QuizType = (question_type && VALID_TYPES.includes(question_type)) ? question_type : question.question_type;
        const nextCorrectAnswer: string = typeof correct_answer === 'string'
            ? correct_answer.trim()
            : question.correct_answer;

        if (question_text !== undefined) {
            if (typeof question_text !== 'string' || !question_text.trim()) {
                res.status(400).json({ status: 'error', message: 'Question text cannot be empty' });
                return;
            }
            question.question_text = question_text.trim();
        }

        if (question_type !== undefined) {
            if (!VALID_TYPES.includes(question_type)) {
                res.status(400).json({ status: 'error', message: 'Invalid question type' });
                return;
            }
            question.question_type = question_type;
        }

        if (correct_answer !== undefined) {
            if (typeof correct_answer !== 'string') {
                res.status(400).json({ status: 'error', message: 'correct_answer must be a string' });
                return;
            }

            if (nextType !== 'short_answer' && !correct_answer.trim()) {
                res.status(400).json({ status: 'error', message: 'correct_answer cannot be empty' });
                return;
            }
            question.correct_answer = correct_answer.trim();
        }

        if (explanation !== undefined) {
            question.explanation = typeof explanation === 'string' ? explanation.trim() : undefined;
        }

        if (order !== undefined && typeof order === 'number') {
            question.order = order;
        }

        const shouldPersistOptions = nextType === 'multiple_choice' || nextType === 'true_false';

        if (shouldPersistOptions) {
            let normalizedOptions: string[] = [];

            if (nextType === 'true_false') {
                normalizedOptions = ['True', 'False'];
                const normalizedAnswer = normalizeForComparison(nextCorrectAnswer);
                if (normalizedAnswer !== 'true' && normalizedAnswer !== 'false') {
                    res.status(400).json({ status: 'error', message: 'True/False question correct_answer must be true or false' });
                    return;
                }
            } else if (Array.isArray(options)) {
                normalizedOptions = options
                    .filter((opt: unknown) => typeof opt === 'string')
                    .map((opt: string) => opt.trim())
                    .filter((opt: string) => opt.length > 0);

                if (normalizedOptions.length < 2) {
                    res.status(400).json({ status: 'error', message: 'Multiple choice question must include at least 2 options' });
                    return;
                }

                const hasCorrectOption = normalizedOptions.some((opt) => normalizeForComparison(opt) === normalizeForComparison(nextCorrectAnswer));
                if (!hasCorrectOption) {
                    res.status(400).json({ status: 'error', message: 'correct_answer must match one of the provided options' });
                    return;
                }
            } else {
                const existingOptions = await QuizQuestionOption.findAll({ where: { question_id: question.id } });
                normalizedOptions = existingOptions.map((opt) => opt.option_text);

                if (nextType === 'multiple_choice' && normalizedOptions.length < 2) {
                    res.status(400).json({ status: 'error', message: 'Multiple choice question requires options' });
                    return;
                }
            }

            await QuizQuestionOption.destroy({ where: { question_id: question.id } });
            await Promise.all(
                normalizedOptions.map((optionText, index) => QuizQuestionOption.create({
                    question_id: question.id,
                    option_text: optionText,
                    option_order: index + 1,
                }))
            );
        } else {
            await QuizQuestionOption.destroy({ where: { question_id: question.id } });
        }

        await question.save();

        const updatedQuestion = await QuizQuestion.findByPk(question.id, {
            include: [{ model: QuizQuestionOption, as: 'options' }],
            order: [[{ model: QuizQuestionOption, as: 'options' }, 'option_order', 'ASC']],
        });

        res.status(200).json({
            status: 'success',
            message: 'Question updated successfully',
            data: updatedQuestion,
        });
    } catch (error: any) {
        console.error('Update Quiz Question Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
};

export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, lessonId, questionId } = req.params;
        const lessonIdNum = parsePositiveInt(lessonId);
        const courseIdNum = parsePositiveInt(courseId);
        const questionIdNum = parsePositiveInt(questionId);

        if (!lessonIdNum || !courseIdNum || !questionIdNum) {
            res.status(400).json({ status: 'error', message: 'Invalid course, lesson, or question ID' });
            return;
        }

        const quizCheck = await ensureQuizLesson(lessonIdNum);
        if ('error' in quizCheck) {
            const { status, message } = quizCheck.error;
            res.status(status).json({ status: 'error', message });
            return;
        }

        if (quizCheck.courseId !== courseIdNum) {
            res.status(400).json({ status: 'error', message: 'Lesson does not belong to this course' });
            return;
        }

        const deletedCount = await QuizQuestion.destroy({ where: { id: questionIdNum, lesson_id: lessonIdNum } });

        if (!deletedCount) {
            res.status(404).json({ status: 'error', message: 'Question not found' });
            return;
        }

        res.status(200).json({ status: 'success', message: 'Question deleted successfully' });
    } catch (error: any) {
        console.error('Delete Quiz Question Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
};

export const getStudentQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const lessonIdNum = parsePositiveInt(lessonId);

        if (!lessonIdNum) {
            res.status(400).json({ status: 'error', message: 'Invalid lesson ID' });
            return;
        }

        const quizCheck = await ensureQuizLesson(lessonIdNum);
        if ('error' in quizCheck) {
            const { status, message } = quizCheck.error;
            res.status(status).json({ status: 'error', message });
            return;
        }

        const access = await ensureQuizAccess(req, quizCheck.courseId);
        if (!access.allowed) {
            res.status(access.status).json({ status: 'error', message: access.message });
            return;
        }

        const questions = await QuizQuestion.findAll({
            where: { lesson_id: lessonIdNum },
            include: [{ model: QuizQuestionOption, as: 'options' }],
            order: [['order', 'ASC'], [{ model: QuizQuestionOption, as: 'options' }, 'option_order', 'ASC']],
        });

        const sanitizedQuestions = questions.map((question) => ({
            id: question.id,
            question_text: question.question_text,
            question_type: question.question_type,
            order: question.order,
            options: (question as any).options || [],
        }));

        const existingAttempt = await QuizAttempt.findOne({
            where: {
                lesson_id: lessonIdNum,
                student_id: req.userId,
            },
        });

        res.status(200).json({
            status: 'success',
            data: {
                lesson_id: lessonIdNum,
                questions: sanitizedQuestions,
                attempt: existingAttempt ? serializeAttempt(existingAttempt) : null,
            },
        });
    } catch (error: any) {
        console.error('Get Student Quiz Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
};

export const submitStudentQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const lessonIdNum = parsePositiveInt(lessonId);

        if (!lessonIdNum) {
            res.status(400).json({ status: 'error', message: 'Invalid lesson ID' });
            return;
        }

        const quizCheck = await ensureQuizLesson(lessonIdNum);
        if ('error' in quizCheck) {
            const { status, message } = quizCheck.error;
            res.status(status).json({ status: 'error', message });
            return;
        }

        const access = await ensureQuizAccess(req, quizCheck.courseId);
        if (!access.allowed) {
            res.status(access.status).json({ status: 'error', message: access.message });
            return;
        }

        const studentId = req.userId;
        if (!studentId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const existingAttempt = await QuizAttempt.findOne({
            where: {
                lesson_id: lessonIdNum,
                student_id: studentId,
            },
        });

        if (existingAttempt) {
            res.status(200).json({
                status: 'success',
                message: 'Quiz already submitted. Showing saved result.',
                data: {
                    lesson_id: lessonIdNum,
                    already_submitted: true,
                    attempt: serializeAttempt(existingAttempt),
                },
            });
            return;
        }

        const answersInput = normalizeSubmissionAnswers(req.body?.answers);
        const answerByQuestionId = new Map<number, string>();
        answersInput.forEach((entry) => {
            answerByQuestionId.set(entry.question_id, entry.student_answer);
        });

        const questions = await QuizQuestion.findAll({
            where: { lesson_id: lessonIdNum },
            order: [['order', 'ASC']],
        });

        if (!questions.length) {
            res.status(400).json({ status: 'error', message: 'No quiz questions found for this lesson' });
            return;
        }

        const results: QuizAttemptResult[] = [];
        const answers: Record<string, string> = {};
        let correctCount = 0;
        let wrongCount = 0;
        let reviewCount = 0;

        questions.forEach((question) => {
            const studentAnswer = (answerByQuestionId.get(question.id) || '').trim();
            answers[`${question.id}`] = studentAnswer;

            if (question.question_type === 'short_answer') {
                reviewCount += 1;
                results.push({
                    question_id: question.id,
                    status: 'review',
                    explanation: question.explanation || 'Short answer is held for teacher review.',
                });
                return;
            }

            const normalizedStudentAnswer = normalizeForComparison(studentAnswer);
            const normalizedCorrectAnswer = normalizeForComparison(question.correct_answer);
            const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;

            if (isCorrect) correctCount += 1;
            else wrongCount += 1;

            results.push({
                question_id: question.id,
                status: isCorrect ? 'correct' : 'wrong',
                correct_answer: question.correct_answer,
                explanation: question.explanation || null,
            });
        });

        const createdAttempt = await QuizAttempt.create({
            lesson_id: lessonIdNum,
            student_id: studentId,
            answers,
            results,
            total_questions: questions.length,
            correct_count: correctCount,
            wrong_count: wrongCount,
            review_count: reviewCount,
            submitted_at: new Date(),
        });

        res.status(201).json({
            status: 'success',
            message: 'Quiz submitted successfully',
            data: {
                lesson_id: lessonIdNum,
                already_submitted: false,
                attempt: serializeAttempt(createdAttempt),
            },
        });
    } catch (error: any) {
        console.error('Submit Student Quiz Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
};

export const checkStudentQuizAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const lessonIdNum = parsePositiveInt(lessonId);

        if (!lessonIdNum) {
            res.status(400).json({ status: 'error', message: 'Invalid lesson ID' });
            return;
        }

        const { question_id, student_answer } = req.body;
        const questionIdNum = Number(question_id);

        if (!Number.isInteger(questionIdNum) || questionIdNum <= 0) {
            res.status(400).json({ status: 'error', message: 'question_id is required' });
            return;
        }

        if (typeof student_answer !== 'string') {
            res.status(400).json({ status: 'error', message: 'student_answer must be a string' });
            return;
        }

        const quizCheck = await ensureQuizLesson(lessonIdNum);
        if ('error' in quizCheck) {
            const { status, message } = quizCheck.error;
            res.status(status).json({ status: 'error', message });
            return;
        }

        if (!req.userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const enrollment = await Enrollment.findOne({
            where: {
                course_id: quizCheck.courseId,
                student_id: req.userId,
                status: {
                    [Op.in]: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
                },
            },
        });

        if (!enrollment && req.user?.role !== 'admin' && req.user?.role !== 'teacher' && req.user?.role !== 'moderator') {
            res.status(403).json({ status: 'error', message: 'You are not enrolled in this course' });
            return;
        }

        const question = await QuizQuestion.findOne({
            where: {
                id: questionIdNum,
                lesson_id: lessonIdNum,
            },
            include: [{ model: QuizQuestionOption, as: 'options' }],
        });

        if (!question) {
            res.status(404).json({ status: 'error', message: 'Question not found' });
            return;
        }

        const normalizedStudentAnswer = normalizeForComparison(student_answer);
        const normalizedCorrectAnswer = normalizeForComparison(question.correct_answer);
        const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;

        res.status(200).json({
            status: 'success',
            data: {
                question_id: question.id,
                is_correct: isCorrect,
                correct_answer: question.correct_answer,
                explanation: question.explanation || null,
            },
        });
    } catch (error: any) {
        console.error('Check Quiz Answer Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
};
