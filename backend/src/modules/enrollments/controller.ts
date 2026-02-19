import { Request, Response } from 'express';
import Enrollment from '../../models/Enrollment';
import LessonProgress from '../../models/LessonProgress';
import User from '../../models/User';
import Course from '../../models/Course';
import CourseSection from '../../models/CourseSection';
import Lesson from '../../models/Lesson';
import { EnrollmentStatus } from '../../models/Enrollment';
import { Op } from 'sequelize';
import { AuthRequest } from '../../middleware/auth';

// Get all enrollments for a course
export const getCourseEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const course_id = parseInt(courseId);

        if (isNaN(course_id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid course ID',
            });
            return;
        }

        const enrollments = await Enrollment.findAll({
            where: { course_id },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'avatar'],
                    required: true, // Only include enrollments where student exists
                },
            ],
            order: [['enrollment_date', 'DESC']],
        });

        // Calculate statistics
        const stats = {
            total: enrollments.length,
            active: enrollments.filter(e => e.status === EnrollmentStatus.ACTIVE).length,
            completed: enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length,
            suspended: enrollments.filter(e => e.status === EnrollmentStatus.SUSPENDED).length,
        };

        res.status(200).json({
            status: 'success',
            data: {
                enrollments,
                stats,
            },
        });
    } catch (error: any) {
        console.error('Get course enrollments error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch enrollments',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Enroll a student in a course
export const enrollStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const { student_id } = req.body;
        const course_id = parseInt(courseId);

        if (isNaN(course_id) || !student_id) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid course ID or student ID',
            });
            return;
        }

        // Check if course exists
        const course = await Course.findByPk(course_id);
        if (!course) {
            res.status(404).json({
                status: 'error',
                message: 'Course not found',
            });
            return;
        }

        // Check if student exists and is a student
        const student = await User.findByPk(student_id);
        if (!student) {
            res.status(404).json({
                status: 'error',
                message: 'Student not found',
            });
            return;
        }

        if (student.role !== 'student') {
            res.status(400).json({
                status: 'error',
                message: 'User is not a student',
            });
            return;
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (existingEnrollment) {
            res.status(400).json({
                status: 'error',
                message: 'Student is already enrolled in this course',
            });
            return;
        }

        // Check enrollment limit
        if (course.enrollment_limit && course.enrollment_limit > 0) {
            const currentEnrollments = await Enrollment.count({
                where: { course_id },
            });

            if (currentEnrollments >= course.enrollment_limit) {
                res.status(400).json({
                    status: 'error',
                    message: 'Course enrollment limit has been reached',
                });
                return;
            }
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            course_id,
            student_id,
            status: EnrollmentStatus.ACTIVE,
            enrollment_date: new Date(),
            progress_percentage: 0,
        });

        // Update course total_enrollments
        await Course.increment('total_enrollments', {
            where: { id: course_id },
        });

        // Fetch the enrollment with student details
        const enrollmentWithStudent = await Enrollment.findByPk(enrollment.id, {
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'avatar'],
                },
            ],
        });

        res.status(201).json({
            status: 'success',
            message: 'Student enrolled successfully',
            data: enrollmentWithStudent,
        });
    } catch (error: any) {
        console.error('Enroll student error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to enroll student',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Unenroll a student from a course
export const unenrollStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId, studentId } = req.params;
        const course_id = parseInt(courseId);
        const student_id = parseInt(studentId);

        if (isNaN(course_id) || isNaN(student_id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid course ID or student ID',
            });
            return;
        }

        const enrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (!enrollment) {
            res.status(404).json({
                status: 'error',
                message: 'Enrollment not found',
            });
            return;
        }

        await enrollment.destroy();

        // Update course total_enrollments
        await Course.decrement('total_enrollments', {
            where: { id: course_id },
        });

        res.status(200).json({
            status: 'success',
            message: 'Student unenrolled successfully',
        });
    } catch (error: any) {
        console.error('Unenroll student error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to unenroll student',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Update enrollment status
export const updateEnrollmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId, studentId } = req.params;
        const { status } = req.body;
        const course_id = parseInt(courseId);
        const student_id = parseInt(studentId);

        if (isNaN(course_id) || isNaN(student_id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid course ID or student ID',
            });
            return;
        }

        if (!status || !Object.values(EnrollmentStatus).includes(status)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid status. Must be active, completed, or suspended',
            });
            return;
        }

        const enrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (!enrollment) {
            res.status(404).json({
                status: 'error',
                message: 'Enrollment not found',
            });
            return;
        }

        enrollment.status = status;
        
        if (status === EnrollmentStatus.COMPLETED) {
            enrollment.completion_date = new Date();
            enrollment.progress_percentage = 100;
        }

        await enrollment.save();

        res.status(200).json({
            status: 'success',
            message: 'Enrollment status updated successfully',
            data: enrollment,
        });
    } catch (error: any) {
        console.error('Update enrollment status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update enrollment status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Search for students not enrolled in a course
export const searchAvailableStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const { search = '', page = 1, limit = 10 } = req.query;
        const course_id = parseInt(courseId as string);

        if (isNaN(course_id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid course ID',
            });
            return;
        }

        // Get already enrolled student IDs
        const enrolledStudents = await Enrollment.findAll({
            where: { course_id },
            attributes: ['student_id'],
        });
        const enrolledStudentIds = enrolledStudents.map(e => e.student_id);

        // Build search query
        const whereClause: any = {
            role: 'student',
            is_active: true,
        };

        if (enrolledStudentIds.length > 0) {
            whereClause.id = {
                [Op.notIn]: enrolledStudentIds,
            };
        }

        if (search) {
            whereClause[Op.or] = [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const { count, rows: students } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'first_name', 'last_name', 'email', 'avatar'],
            limit: parseInt(limit as string),
            offset,
            order: [['first_name', 'ASC']],
        });

        res.status(200).json({
            status: 'success',
            data: {
                students,
                pagination: {
                    total: count,
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    totalPages: Math.ceil(count / parseInt(limit as string)),
                },
            },
        });
    } catch (error: any) {
        console.error('Search available students error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to search students',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Get all enrolled courses for the current student
export const getMyEnrolledCourses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student_id = req.userId;

        if (!student_id) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized',
            });
            return;
        }

        // Get all enrollments for the student with course details
        const enrollments = await Enrollment.findAll({
            where: { student_id },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'slug', 'description', 'short_description', 'thumbnail', 'category', 'level', 'total_enrollments', 'rating', 'total_reviews', 'instructors', 'created_by'],
                },
            ],
            order: [['enrollment_date', 'DESC']],
        });

        // Get creator info for fallback
        const creatorIds = [...new Set(enrollments.map((e: any) => e.course?.created_by).filter(Boolean))];
        const creators = await User.findAll({
            where: { id: creatorIds },
            attributes: ['id', 'first_name', 'last_name', 'email'],
        });
        const creatorMap = new Map(creators.map((u: any) => [u.id, `${u.first_name} ${u.last_name}`]));

        // Get lesson counts for each course
        const coursesWithLessons = await Promise.all(
            enrollments.map(async (enrollment: any) => {
                const course = enrollment.course;
                
                // Get total lessons count
                const totalLessons = await Lesson.count({
                    include: [
                        {
                            model: CourseSection,
                            as: 'section',
                            where: { course_id: course.id },
                            required: true,
                        },
                    ],
                });

                // For now, we'll use a simplified completed_lessons calculation
                // In a real app, you'd track this in a separate table
                const completedLessons = Math.round((enrollment.progress_percentage / 100) * totalLessons);

                // Get instructor names from JSON field
                // Format: [{ id: number, name: string, email: string, avatar?: string }]
                let instructorNames = '';
                
                if (course.instructors && Array.isArray(course.instructors) && course.instructors.length > 0) {
                    instructorNames = course.instructors
                        .map((inst: any) => inst.name || inst.email || 'Instructor')
                        .join(', ');
                } 
                
                // Fallback to course creator if no instructors assigned
                if (!instructorNames && course.created_by) {
                    instructorNames = creatorMap.get(course.created_by) || '';
                }
                
                // Final fallback
                if (!instructorNames) {
                    instructorNames = 'Unknown Instructor';
                }

                return {
                    enrollment_id: enrollment.id,
                    course_id: course.id,
                    status: enrollment.status,
                    enrollment_date: enrollment.enrollment_date,
                    completion_date: enrollment.completion_date,
                    progress_percentage: enrollment.progress_percentage,
                    title: course.title,
                    slug: course.slug,
                    description: course.description,
                    short_description: course.short_description,
                    thumbnail: course.thumbnail,
                    category: course.category,
                    level: course.level,
                    instructors: instructorNames,
                    total_lessons: totalLessons || 0,
                    completed_lessons: completedLessons || 0,
                };
            })
        );

        res.status(200).json({
            status: 'success',
            data: coursesWithLessons,
        });
    } catch (error: any) {
        console.error('Get my enrolled courses error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch enrolled courses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Get student progress for a specific course
export const getCourseProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const student_id = req.userId;
        const course_id = parseInt(courseId);

        if (!student_id) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (isNaN(course_id)) {
            res.status(400).json({ status: 'error', message: 'Invalid course ID' });
            return;
        }

        // Check if enrolled
        const enrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (!enrollment) {
            res.status(404).json({ status: 'error', message: 'Not enrolled in this course' });
            return;
        }

        // Get all lessons for the course
        const sections = await CourseSection.findAll({
            where: { course_id },
            attributes: ['id'],
            order: [['order', 'ASC']],
        });

        let totalLessons = 0;
        let completedLessonIds: number[] = [];
        let completedCount = 0;

        if (sections.length > 0) {
            const sectionIds = sections.map(s => s.id);
            totalLessons = await Lesson.count({
                where: {
                    section_id: { [Op.in]: sectionIds },
                },
            });

            // Get completed lessons
            const completedProgress = await LessonProgress.findAll({
                where: { course_id, student_id, completed: true },
                attributes: ['lesson_id', 'completed_at'],
            });

            completedLessonIds = completedProgress.map(p => p.lesson_id);
            completedCount = completedProgress.length;
        }

        // Calculate progress percentage
        const progressPercentage = totalLessons > 0 
            ? Math.round((completedCount / totalLessons) * 100) 
            : 0;

        // Update enrollment progress
        if (enrollment.progress_percentage !== progressPercentage) {
            enrollment.progress_percentage = progressPercentage;
            
            // If 100%, mark as completed
            if (progressPercentage === 100) {
                enrollment.status = EnrollmentStatus.COMPLETED;
                enrollment.completion_date = new Date();
            } else if (enrollment.status === EnrollmentStatus.COMPLETED) {
                enrollment.status = EnrollmentStatus.ACTIVE;
                enrollment.completion_date = undefined;
            }
            
            await enrollment.save();
        }

        res.status(200).json({
            status: 'success',
            data: {
                course_id,
                total_lessons: totalLessons,
                completed_lessons: completedCount,
                progress_percentage: progressPercentage,
                completed_lesson_ids: completedLessonIds,
                enrollment_status: enrollment.status,
            },
        });
    } catch (error: any) {
        console.error('Get course progress error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch course progress',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Mark a lesson as complete
export const markLessonComplete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, lessonId } = req.params;
        const student_id = req.userId;
        const course_id = parseInt(courseId);
        const lesson_id = parseInt(lessonId);

        if (!student_id) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (isNaN(course_id) || isNaN(lesson_id)) {
            res.status(400).json({ status: 'error', message: 'Invalid course ID or lesson ID' });
            return;
        }

        // Check if enrolled
        const enrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (!enrollment) {
            res.status(404).json({ status: 'error', message: 'Not enrolled in this course' });
            return;
        }

        // Check if lesson exists
        const lesson = await Lesson.findByPk(lesson_id);
        if (!lesson) {
            res.status(404).json({ status: 'error', message: 'Lesson not found' });
            return;
        }

        // Check if already completed
        let progress = await LessonProgress.findOne({
            where: { course_id, student_id, lesson_id },
        });

        if (progress) {
            if (!progress.completed) {
                progress.completed = true;
                progress.completed_at = new Date();
                await progress.save();
            }
        } else {
            // Create new progress record
            progress = await LessonProgress.create({
                course_id,
                student_id,
                lesson_id,
                completed: true,
                completed_at: new Date(),
            });
        }

        // Recalculate overall progress
        const sections = await CourseSection.findAll({
            where: { course_id },
            attributes: ['id'],
        });

        const sectionIds = sections.map(s => s.id);
        const totalLessons = await Lesson.count({
            where: { section_id: { [Op.in]: sectionIds } },
        });

        const completedCount = await LessonProgress.count({
            where: { course_id, student_id, completed: true },
        });

        const progressPercentage = totalLessons > 0 
            ? Math.round((completedCount / totalLessons) * 100) 
            : 0;

        // Update enrollment
        enrollment.progress_percentage = progressPercentage;
        
        if (progressPercentage === 100) {
            enrollment.status = EnrollmentStatus.COMPLETED;
            enrollment.completion_date = new Date();
        } else if (enrollment.status === EnrollmentStatus.COMPLETED) {
            enrollment.status = EnrollmentStatus.ACTIVE;
            enrollment.completion_date = undefined;
        }
        
        await enrollment.save();

        res.status(200).json({
            status: 'success',
            message: 'Lesson marked as complete',
            data: {
                lesson_id,
                completed: true,
                progress_percentage: progressPercentage,
                completed_lessons: completedCount,
                total_lessons: totalLessons,
            },
        });
    } catch (error: any) {
        console.error('Mark lesson complete error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to mark lesson as complete',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Mark a lesson as incomplete (undo)
export const markLessonIncomplete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, lessonId } = req.params;
        const student_id = req.userId;
        const course_id = parseInt(courseId);
        const lesson_id = parseInt(lessonId);

        if (!student_id) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (isNaN(course_id) || isNaN(lesson_id)) {
            res.status(400).json({ status: 'error', message: 'Invalid course ID or lesson ID' });
            return;
        }

        // Check if enrolled
        const enrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (!enrollment) {
            res.status(404).json({ status: 'error', message: 'Not enrolled in this course' });
            return;
        }

        // Update progress to incomplete
        const progress = await LessonProgress.findOne({
            where: { course_id, student_id, lesson_id },
        });

        if (progress) {
            progress.completed = false;
            progress.completed_at = undefined;
            await progress.save();
        }

        // Recalculate overall progress
        const sections = await CourseSection.findAll({
            where: { course_id },
            attributes: ['id'],
        });

        const sectionIds = sections.map(s => s.id);
        const totalLessons = await Lesson.count({
            where: { section_id: { [Op.in]: sectionIds } },
        });

        const completedCount = await LessonProgress.count({
            where: { course_id, student_id, completed: true },
        });

        const progressPercentage = totalLessons > 0 
            ? Math.round((completedCount / totalLessons) * 100) 
            : 0;

        // Update enrollment
        enrollment.progress_percentage = progressPercentage;
        
        if (enrollment.status === EnrollmentStatus.COMPLETED) {
            enrollment.status = EnrollmentStatus.ACTIVE;
            enrollment.completion_date = undefined;
        }
        
        await enrollment.save();

        res.status(200).json({
            status: 'success',
            message: 'Lesson marked as incomplete',
            data: {
                lesson_id,
                completed: false,
                progress_percentage: progressPercentage,
                completed_lessons: completedCount,
                total_lessons: totalLessons,
            },
        });
    } catch (error: any) {
        console.error('Mark lesson incomplete error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to mark lesson as incomplete',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Get lesson completion status for a specific lesson
export const getLessonProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, lessonId } = req.params;
        const student_id = req.userId;
        const course_id = parseInt(courseId);
        const lesson_id = parseInt(lessonId);

        if (!student_id) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (isNaN(course_id) || isNaN(lesson_id)) {
            res.status(400).json({ status: 'error', message: 'Invalid course ID or lesson ID' });
            return;
        }

        // Check if enrolled
        const enrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (!enrollment) {
            res.status(404).json({ status: 'error', message: 'Not enrolled in this course' });
            return;
        }

        // Get lesson progress
        const progress = await LessonProgress.findOne({
            where: { course_id, student_id, lesson_id },
        });

        res.status(200).json({
            status: 'success',
            data: {
                lesson_id,
                completed: progress?.completed || false,
                completed_at: progress?.completed_at || null,
            },
        });
    } catch (error: any) {
        console.error('Get lesson progress error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get lesson progress',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Student self-enrollment (for free courses)
export const enrollSelf = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const student_id = req.userId;
        const course_id = parseInt(courseId);

        if (!student_id) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (isNaN(course_id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid course ID',
            });
            return;
        }

        // Check if course exists
        const course = await Course.findByPk(course_id);
        if (!course) {
            res.status(404).json({
                status: 'error',
                message: 'Course not found',
            });
            return;
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        if (existingEnrollment) {
            res.status(400).json({
                status: 'error',
                message: 'Already enrolled in this course',
                data: { already_enrolled: true },
            });
            return;
        }

        // Check if course requires payment
        const coursePrice = course.discounted_price || course.price;
        if (coursePrice > 0) {
            res.status(402).json({
                status: 'error',
                message: 'This course requires payment',
                data: { requires_payment: true, price: coursePrice },
            });
            return;
        }

        // Create enrollment (free course)
        const enrollment = await Enrollment.create({
            course_id,
            student_id,
            status: EnrollmentStatus.ACTIVE,
            enrollment_date: new Date(),
            progress_percentage: 0,
        });

        // Update course total_enrollments
        await Course.increment('total_enrollments', {
            where: { id: course_id },
        });

        res.status(201).json({
            status: 'success',
            message: 'Successfully enrolled in course',
            data: {
                enrollment_id: enrollment.id,
                course_id: course.id,
                course_title: course.title,
            },
        });
    } catch (error: any) {
        console.error('Self enrollment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to enroll in course',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Check enrollment status for a course
export const checkEnrollmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const student_id = req.userId;
        const course_id = parseInt(courseId);

        if (!student_id) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (isNaN(course_id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid course ID',
            });
            return;
        }

        // Check if course exists
        const course = await Course.findByPk(course_id);
        if (!course) {
            res.status(404).json({
                status: 'error',
                message: 'Course not found',
            });
            return;
        }

        // Check if enrolled
        const enrollment = await Enrollment.findOne({
            where: { course_id, student_id },
        });

        const coursePrice = course.discounted_price || course.price;

        res.status(200).json({
            status: 'success',
            data: {
                is_enrolled: !!enrollment,
                enrollment_status: enrollment?.status || null,
                course_id: course.id,
                course_title: course.title,
                price: coursePrice,
                requires_payment: coursePrice > 0,
            },
        });
    } catch (error: any) {
        console.error('Check enrollment status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check enrollment status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
