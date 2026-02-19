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
};
