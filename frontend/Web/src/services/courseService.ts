import apiClient, { STATIC_ASSETS_BASE_URL } from './apiClient';

// ─── Types ────────────────────────────────────────────────────

export interface Section {
    id: number;
    course_id: number;
    title: string;
    order: number;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateSectionData {
    title: string;
    order?: number;
    is_published?: boolean;
}

export interface LessonResource {
    id: number;
    lesson_id: number;
    title: string;
    file_path: string;
    file_size: string;
    file_type: string;
    created_at?: string;
    updated_at?: string;
}

export interface Lesson {
    id: number;
    section_id: number;
    title: string;
    content_type: 'video' | 'text' | 'quiz' | 'document' | 'live' | 'assignment';
    content_body?: string;
    file_path?: string;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
    content_platform?: 'zoom' | 'jitsi';
    jitsi_room_name?: string;
    jitsi_join_url?: string;
    order: number;
    duration?: number;
    is_free_preview: boolean;
    is_published: boolean;
    resources?: LessonResource[];
    start_time?: string;
    created_at?: string;
    updated_at?: string;
    is_locked?: boolean;
    lock_reason?: string;
}

export interface CreateLessonData {
    title: string;
    content_type: 'video' | 'text' | 'quiz' | 'document' | 'live' | 'assignment';
    content_body?: string;
    file_path?: string;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
    content_platform?: 'zoom' | 'jitsi';
    jitsi_room_name?: string;
    jitsi_join_url?: string;
    order?: number;
    duration?: number;
    is_free_preview?: boolean;
    is_published?: boolean;
    release_date?: string | null;
    drip_days?: number | null;
    prerequisite_lesson_id?: number | null;
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface CreateQuizQuestionData {
    question_text: string;
    question_type: QuizQuestionType;
    correct_answer: string;
    explanation?: string;
    options?: string[];
    order?: number;
}

export interface StudentQuizOption {
    id: number;
    question_id: number;
    option_text: string;
    option_order: number;
}

export interface StudentQuizQuestion {
    id: number;
    question_text: string;
    question_type: QuizQuestionType;
    order: number;
    options: StudentQuizOption[];
}

export interface StudentQuizResponse {
    lesson_id: number;
    questions: StudentQuizQuestion[];
    attempt: StudentQuizAttempt | null;
}

export interface StudentQuizAttemptResult {
    question_id: number;
    status: 'correct' | 'wrong' | 'review';
    correct_answer?: string;
    explanation?: string | null;
}

export interface StudentQuizAttempt {
    id: number;
    lesson_id: number;
    student_id: number;
    answers: Record<string, string>;
    results: StudentQuizAttemptResult[];
    total_questions: number;
    correct_count: number;
    wrong_count: number;
    review_count: number;
    submitted_at: string;
}

export type AssignmentSubmissionStatus = 'submitted' | 'reviewed' | 'resubmit_required';

export interface AssignmentSubmission {
    id: number;
    lesson_id: number;
    student_id: number;
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size: number;
    status: AssignmentSubmissionStatus;
    score?: number | null;
    feedback?: string | null;
    submitted_at: string;
    reviewed_at?: string | null;
    student?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        avatar?: string | null;
    };
}

export interface QuizCheckAnswerResponse {
    question_id: number;
    is_correct: boolean;
    correct_answer: string;
    explanation: string | null;
}

export interface LessonDiscussion {
    id: number;
    lesson_id: number;
    user_id: number;
    content: string;
    created_at: string;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
        avatar: string;
        role: string;
    };
}

// ─── Course CRUD ──────────────────────────────────────────────

export const getCourses = async (params?: Record<string, unknown>) => {
    const response = await apiClient.get('/courses', { params });
    return response.data;
};

export const getCourse = async (id: string | number, params?: Record<string, unknown>) => {
    const response = await apiClient.get(`/courses/${id}`, { params });
    return response.data;
};

export const createCourse = async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/courses', data);
    return response.data;
};

export const updateCourse = async (id: string | number, data: FormData | Record<string, unknown>) => {
    const response = await apiClient.patch(`/courses/${id}`, data);
    return response.data;
};

export const deleteCourse = async (id: string | number) => {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
};

// ─── Course Sections ──────────────────────────────────────────

export const getSections = async (courseId: number) => {
    const response = await apiClient.get(`/courses/${courseId}/sections`);
    return response.data;
};

export const createSection = async (courseId: number, data: CreateSectionData) => {
    const response = await apiClient.post(`/courses/${courseId}/sections`, data);
    return response.data;
};

export const updateSection = async (sectionId: number, data: Partial<CreateSectionData>) => {
    const response = await apiClient.patch(`/courses/sections/${sectionId}`, data);
    return response.data;
};

export const deleteSection = async (sectionId: number) => {
    const response = await apiClient.delete(`/courses/sections/${sectionId}`);
    return response.data;
};

export const reorderSections = async (courseId: number, sections: { id: number; order: number }[]) => {
    const response = await apiClient.patch(`/courses/${courseId}/sections/reorder`, { sections });
    return response.data;
};

// ─── Lessons ──────────────────────────────────────────────────

export const getLessons = async (sectionId: number) => {
    const response = await apiClient.get(`/courses/sections/${sectionId}/lessons`);
    return response.data;
};

export const getLessonById = async (lessonId: number) => {
    const response = await apiClient.get(`/courses/lessons/${lessonId}`);
    return response.data;
};

export const createLesson = async (sectionId: number, data: CreateLessonData) => {
    const response = await apiClient.post(`/courses/sections/${sectionId}/lessons`, data);
    return response.data;
};

export const updateLesson = async (lessonId: number, data: Partial<CreateLessonData>) => {
    const response = await apiClient.patch(`/courses/lessons/${lessonId}`, data);
    return response.data;
};

export const deleteLesson = async (lessonId: number) => {
    const response = await apiClient.delete(`/courses/lessons/${lessonId}`);
    return response.data;
};

export const createQuizQuestion = async (courseId: number, lessonId: number, data: CreateQuizQuestionData) => {
    const response = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/questions`, data);
    return response.data;
};

export const getQuizQuestionsForTeacher = async (courseId: number, lessonId: number) => {
    const response = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}/questions`);
    return response.data;
};

export const updateQuizQuestion = async (courseId: number, lessonId: number, questionId: number, data: Partial<CreateQuizQuestionData>) => {
    const response = await apiClient.patch(`/courses/${courseId}/lessons/${lessonId}/questions/${questionId}`, data);
    return response.data;
};

export const deleteQuizQuestion = async (courseId: number, lessonId: number, questionId: number) => {
    const response = await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}/questions/${questionId}`);
    return response.data;
};

export const getStudentQuiz = async (lessonId: number): Promise<{ status: string; data: StudentQuizResponse }> => {
    const response = await apiClient.get(`/lessons/${lessonId}/quiz`);
    return response.data;
};

export const checkStudentQuizAnswer = async (
    lessonId: number,
    questionId: number,
    studentAnswer: string
): Promise<{ status: string; data: QuizCheckAnswerResponse }> => {
    const response = await apiClient.post(`/lessons/${lessonId}/quiz/check-answer`, {
        question_id: questionId,
        student_answer: studentAnswer,
    });
    return response.data;
};

export const submitStudentQuiz = async (
    lessonId: number,
    answers: Array<{ question_id: number; student_answer: string }>
): Promise<{ status: string; data: { lesson_id: number; already_submitted: boolean; attempt: StudentQuizAttempt } }> => {
    const response = await apiClient.post(`/lessons/${lessonId}/quiz/submit`, { answers });
    return response.data;
};

export const submitAssignment = async (
    lessonId: number,
    assignmentFile: File
): Promise<{ status: string; message: string; data: AssignmentSubmission }> => {
    const formData = new FormData();
    formData.append('assignment_pdf', assignmentFile);
    const response = await apiClient.post(`/courses/lessons/${lessonId}/assignment/submission`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getMyAssignmentSubmission = async (
    lessonId: number
): Promise<{ status: string; data: AssignmentSubmission | null }> => {
    const response = await apiClient.get(`/courses/lessons/${lessonId}/assignment/submission/my`);
    return response.data;
};

export const getAssignmentSubmissionsForTeacher = async (
    lessonId: number
): Promise<{ status: string; data: AssignmentSubmission[] }> => {
    const response = await apiClient.get(`/courses/lessons/${lessonId}/assignment/submissions`);
    return response.data;
};

export const reviewAssignmentSubmission = async (
    submissionId: number,
    payload: {
        status?: AssignmentSubmissionStatus;
        feedback?: string;
        score?: number | null;
    }
): Promise<{ status: string; message: string; data: AssignmentSubmission }> => {
    const response = await apiClient.patch(`/courses/assignment-submissions/${submissionId}/review`, payload);
    return response.data;
};

export const reorderLessons = async (sectionId: number, lessons: { id: number; order: number }[]) => {
    const response = await apiClient.patch(`/courses/sections/${sectionId}/lessons/reorder`, { lessons });
    return response.data;
};

export const uploadLessonVideo = async (lessonId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('video', file);
    const response = await apiClient.patch(`/courses/lessons/${lessonId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
        },
    });
    return response.data;
};

export const uploadLessonResource = async (lessonId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('resource', file);
    const response = await apiClient.post(`/courses/lessons/${lessonId}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
        },
    });
    return response.data;
};

export const deleteLessonResource = async (resourceId: number) => {
    const response = await apiClient.delete(`/courses/lessons/resources/${resourceId}`);
    return response.data;
};

export const getLiveClassSignature = async (meetingId: string) => {
    const response = await apiClient.get(`/live-classes/${meetingId}/join-token`);
    return response.data;
};

export const getJitsiConfig = async (sessionId: string | number) => {
    const response = await apiClient.get(`/live-classes/${sessionId}/jitsi-config`);
    return response.data;
};

export const getLiveClassStatus = async (sessionId: string | number): Promise<{ isLive: boolean }> => {
    const response = await apiClient.get(`/live-classes/${sessionId}/status`);
    return response.data.data;
};

export const sendHostHeartbeat = async (sessionId: string | number): Promise<void> => {
    try {
        await apiClient.post(`/live-classes/${sessionId}/heartbeat`);
    } catch { /* silently ignore — non-critical */ }
};

export const endLiveClassSession = async (sessionId: string | number): Promise<void> => {
    try {
        await apiClient.post(`/live-classes/${sessionId}/end-session`);
    } catch { /* best-effort */ }
};

// ─── Lesson Discussions ──────────────────────────────────────────

export const getLessonDiscussions = async (lessonId: number) => {
    const response = await apiClient.get(`/courses/lessons/${lessonId}/discussions`);
    return response.data;
};

export const createLessonDiscussion = async (lessonId: number, content: string) => {
    const response = await apiClient.post(`/courses/lessons/${lessonId}/discussions`, { content });
    return response.data;
};

// ─── Student Progress ─────────────────────────────────────────

export interface CourseWithSections {
    id: number;
    title: string;
    slug: string;
    description?: string;
    short_description?: string;
    thumbnail?: string;
    category?: string;
    level?: string;
    duration_hours?: number;
    price?: number;
    discounted_price?: number;
    is_free?: boolean;
    instructors?: any[];
    sections: (Section & { lessons: Lesson[] })[];
    status?: string;
    visibility?: string;
}

export interface CourseProgress {
    course_id: number;
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
    completed_lesson_ids: number[];
    enrollment_status: string;
}

export const getCourseWithCurriculum = async (courseId: number): Promise<{ status: string; data: CourseWithSections }> => {
    const response = await apiClient.get(`/courses/${courseId}`);
    return response.data;
};

export const getCourseProgress = async (courseId: number): Promise<{ status: string; data: CourseProgress }> => {
    const response = await apiClient.get(`/courses/${courseId}/progress`);
    return response.data;
};

export const markLessonComplete = async (courseId: number, lessonId: number) => {
    const response = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
    return response.data;
};

export const markLessonIncomplete = async (courseId: number, lessonId: number) => {
    const response = await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}/complete`);
    return response.data;
};

export const getVideoUrl = (videoPath: string | null | undefined): string | null => {
    if (!videoPath) return null;
    if (videoPath.startsWith('http')) return videoPath;
    return `${STATIC_ASSETS_BASE_URL}/${videoPath}`;
};

export const getResourceUrl = (resourcePath: string): string => {
    if (resourcePath.startsWith('http')) return resourcePath;
    return `${STATIC_ASSETS_BASE_URL}/${resourcePath}`;
};

export const getThumbnailUrl = (thumbnail: string | null | undefined): string | null => {
    if (!thumbnail) return null;
    if (thumbnail.startsWith('http')) return thumbnail;
    return `${STATIC_ASSETS_BASE_URL}/${thumbnail}`;
};

// ─── Upload ───────────────────────────────────────────────────

export const uploadCourseThumbnail = async (
    courseId: string | number,
    formData: FormData,
    onProgress?: (progress: number) => void
) => {
    const response = await apiClient.patch(`/courses/${courseId}/thumbnail`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
        },
    });
    return response.data;
};

export const uploadCourseIntroVideo = async (
    courseId: string | number,
    formData: FormData,
    onProgress?: (progress: number) => void
) => {
    const response = await apiClient.patch(`/courses/${courseId}/intro-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
        },
    });
    return response.data;
};

export const uploadCourseFile = async (courseId: string | number, formData: FormData) => {
    return uploadCourseIntroVideo(courseId, formData);
};
