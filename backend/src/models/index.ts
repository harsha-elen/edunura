import User from './User';
import Course from './Course';
import SystemSetting from './SystemSetting';
import CourseCategory from './CourseCategory';
import CourseSection from './CourseSection';
import Lesson from './Lesson';
import LiveSession from './LiveSession';
import { LessonResource } from './LessonResource';
import Enrollment from './Enrollment';
import LessonProgress from './LessonProgress';
import Payment from './Payment';
import LessonDiscussion from './LessonDiscussion';
import QuizQuestion from './QuizQuestion';
import QuizQuestionOption from './QuizQuestionOption';
import QuizAttempt from './QuizAttempt';
import AssignmentSubmission from './AssignmentSubmission';
import GenoToken from './GenoToken';

// Define associations
export const initializeAssociations = () => {
    // User - Course relationship (Creator)
    User.hasMany(Course, {
        foreignKey: 'created_by',
        as: 'created_courses',
    });

    Course.belongsTo(User, {
        foreignKey: 'created_by',
        as: 'creator',
    });

    // Course - CourseSection relationship (One-to-Many)
    Course.hasMany(CourseSection, {
        foreignKey: 'course_id',
        as: 'sections',
    });

    CourseSection.belongsTo(Course, {
        foreignKey: 'course_id',
        as: 'course',
    });

    // CourseSection - Lesson relationship (One-to-Many)
    CourseSection.hasMany(Lesson, {
        foreignKey: 'section_id',
        as: 'lessons',
    });

    Lesson.belongsTo(CourseSection, {
        foreignKey: 'section_id',
        as: 'section',
    });

    // Course - LiveSession relationship (One-to-Many)
    Course.hasMany(LiveSession, {
        foreignKey: 'course_id',
        as: 'live_sessions',
    });

    LiveSession.belongsTo(Course, {
        foreignKey: 'course_id',
        as: 'course',
    });

    // Course - Enrollment relationship (One-to-Many)
    Course.hasMany(Enrollment, {
        foreignKey: 'course_id',
        as: 'enrollments',
    });

    Enrollment.belongsTo(Course, {
        foreignKey: 'course_id',
        as: 'course',
    });

    // User - Enrollment relationship (One-to-Many, as student)
    User.hasMany(Enrollment, {
        foreignKey: 'student_id',
        as: 'enrollments',
    });

    Enrollment.belongsTo(User, {
        foreignKey: 'student_id',
        as: 'student',
    });

    // Course - LessonProgress relationship
    Course.hasMany(LessonProgress, {
        foreignKey: 'course_id',
        as: 'lesson_progress',
    });

    LessonProgress.belongsTo(Course, {
        foreignKey: 'course_id',
        as: 'course',
    });

    // User - LessonProgress relationship
    User.hasMany(LessonProgress, {
        foreignKey: 'student_id',
        as: 'lesson_progress',
    });

    LessonProgress.belongsTo(User, {
        foreignKey: 'student_id',
        as: 'student',
    });

    // Lesson - LessonProgress relationship
    Lesson.hasMany(LessonProgress, {
        foreignKey: 'lesson_id',
        as: 'progress',
    });

    LessonProgress.belongsTo(Lesson, {
        foreignKey: 'lesson_id',
        as: 'lesson',
    });

    // Course - Payment relationship (One-to-Many)
    Course.hasMany(Payment, {
        foreignKey: 'course_id',
        as: 'payments',
    });

    Payment.belongsTo(Course, {
        foreignKey: 'course_id',
        as: 'course',
    });

    // User - Payment relationship (One-to-Many)
    User.hasMany(Payment, {
        foreignKey: 'user_id',
        as: 'payments',
    });

    Payment.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
    });

    // Lesson - LessonDiscussion relationship
    Lesson.hasMany(LessonDiscussion, {
        foreignKey: 'lesson_id',
        as: 'discussions',
    });

    LessonDiscussion.belongsTo(Lesson, {
        foreignKey: 'lesson_id',
        as: 'lesson',
    });

    // User - LessonDiscussion relationship
    User.hasMany(LessonDiscussion, {
        foreignKey: 'user_id',
        as: 'discussions',
    });

    LessonDiscussion.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user',
    });

    // Lesson - QuizQuestion relationship
    Lesson.hasMany(QuizQuestion, {
        foreignKey: 'lesson_id',
        as: 'quiz_questions',
    });

    QuizQuestion.belongsTo(Lesson, {
        foreignKey: 'lesson_id',
        as: 'lesson',
    });

    // QuizQuestion - QuizQuestionOption relationship
    QuizQuestion.hasMany(QuizQuestionOption, {
        foreignKey: 'question_id',
        as: 'options',
    });

    QuizQuestionOption.belongsTo(QuizQuestion, {
        foreignKey: 'question_id',
        as: 'question',
    });

    // Lesson - QuizAttempt relationship
    Lesson.hasMany(QuizAttempt, {
        foreignKey: 'lesson_id',
        as: 'quiz_attempts',
    });

    QuizAttempt.belongsTo(Lesson, {
        foreignKey: 'lesson_id',
        as: 'lesson',
    });

    // User - QuizAttempt relationship
    User.hasMany(QuizAttempt, {
        foreignKey: 'student_id',
        as: 'quiz_attempts',
    });

    QuizAttempt.belongsTo(User, {
        foreignKey: 'student_id',
        as: 'student',
    });

    // Lesson - AssignmentSubmission relationship
    Lesson.hasMany(AssignmentSubmission, {
        foreignKey: 'lesson_id',
        as: 'assignment_submissions',
    });

    AssignmentSubmission.belongsTo(Lesson, {
        foreignKey: 'lesson_id',
        as: 'lesson',
    });

    // User - AssignmentSubmission relationship
    User.hasMany(AssignmentSubmission, {
        foreignKey: 'student_id',
        as: 'assignment_submissions',
    });

    AssignmentSubmission.belongsTo(User, {
        foreignKey: 'student_id',
        as: 'student',
    });
};

export {
    User,
    Course,
    SystemSetting,
    CourseCategory,
    CourseSection,
    Lesson,
    LiveSession,
    LessonResource,
    Enrollment,
    LessonProgress,
    Payment,
    LessonDiscussion,
    QuizQuestion,
    QuizQuestionOption,
    QuizAttempt,
    AssignmentSubmission,
    GenoToken,
};
