import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../../middleware/auth';
import { Course, CourseSection, Lesson, LessonResource, Enrollment } from '../../models';
import { createCourseFolders, generateSlug, deleteCourseFolders, deleteFile } from '../../utils/folderService';
import path from 'path';
import ZoomService from '../../services/zoomService';

// ========================================
// COURSE CONTROLLERS
// ========================================

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            title,
            description,
            short_description,
            category,
            level,
            outcomes,
            prerequisites,
            status,
            instructors,
            price,
            discounted_price,
            is_free,
            validity_period,
            intro_video,
            enable_discussion_forum,
            show_course_rating,
            enable_certificate,
            visibility,
            meta_title,
            meta_description,
        } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!title) {
            res.status(400).json({ status: 'error', message: 'Course title is required' });
            return;
        }

        // Generate slug
        let slug = generateSlug(title);
        // Check for duplicate slug
        const existingSlug = await Course.findOne({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Date.now()}`;
        }

        const course = await Course.create({
            title: title.trim(),
            slug,
            description: description ? description.trim() : '',
            short_description: short_description ? short_description.trim() : undefined,
            category: category || 'Uncategorized',
            level: level || 'beginner',
            status: status || 'draft',
            created_by: userId,
            outcomes: outcomes || [],
            prerequisites: prerequisites || [],
            instructors: instructors || [],
            price: price !== undefined ? price : 0,
            discounted_price: discounted_price || 0,
            is_free: is_free !== undefined ? is_free : true,
            validity_period: validity_period || null,
            thumbnail: undefined, // Will be updated via separate endpoint
            intro_video: intro_video || undefined,
            is_published: false,
            enable_discussion_forum: enable_discussion_forum !== undefined ? enable_discussion_forum : true,
            show_course_rating: show_course_rating !== undefined ? show_course_rating : false,
            enable_certificate: enable_certificate !== undefined ? enable_certificate : true,
            visibility: visibility || 'draft',
            meta_title: meta_title || null,
            meta_description: meta_description || null,
        });

        // Create course folder structure
        createCourseFolders(course.id);

        res.status(201).json({
            status: 'success',
            message: 'Course created successfully',
            data: course,
        });
    } catch (error: any) {
        console.error('Create Course Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const getAllCourses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10, search, status, category } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const whereClause: any = {};
        if (search) {
            whereClause.title = { [Op.like]: `%${search}%` };
        }
        if (status) {
            whereClause.status = status;
        }
        if (category) {
            whereClause.category = category;
        }

        const { count, rows } = await Course.findAndCountAll({
            where: whereClause,
            limit: Number(limit),
            offset,
            order: [['created_at', 'DESC']],
        });

        res.status(200).json({
            status: 'success',
            data: {
                courses: rows,
                total: count,
                page: Number(page),
                pages: Math.ceil(count / Number(limit)),
            },
        });
    } catch (error: any) {
        console.error('Get All Courses Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const getCourseById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const course = await Course.findByPk(id, {
            include: [
                {
                    model: CourseSection,
                    as: 'sections',
                    include: [
                        {
                            model: Lesson,
                            as: 'lessons',
                            include: [
                                {
                                    model: LessonResource,
                                    as: 'resources',
                                },
                            ],
                        },
                    ],
                },
            ],
            order: [
                [{ model: CourseSection, as: 'sections' }, 'order', 'ASC'],
                [{ model: CourseSection, as: 'sections' }, { model: Lesson, as: 'lessons' }, 'order', 'ASC'],
            ],
        });

        if (!course) {
            res.status(404).json({ status: 'error', message: 'Course not found' });
            return;
        }

        // Check if user is enrolled (unless admin)
        // Allow students to view course for checkout purposes even if not enrolled
        const userRole = req.user?.role;
        const isCheckoutFlow = req.query.checkout === 'true';
        
        if (userRole !== 'admin' && userRole !== 'teacher' && !isCheckoutFlow) {
            const enrollment = await Enrollment.findOne({
                where: { course_id: parseInt(id), student_id: userId },
            });

            if (!enrollment) {
                res.status(403).json({ status: 'error', message: 'You are not enrolled in this course' });
                return;
            }
        }

        // For checkout flow, only expose public course information (no sensitive data)
        if (isCheckoutFlow) {
            const publicCourseData = {
                id: course.id,
                title: course.title,
                short_description: course.short_description,
                description: course.description,
                thumbnail: course.thumbnail,
                price: course.price,
                discounted_price: course.discounted_price,
                is_free: course.is_free,
                validity_period: course.validity_period,
                category: course.category,
                level: course.level,
                total_enrollments: course.total_enrollments,
                rating: course.rating,
                total_reviews: course.total_reviews,
                created_at: course.created_at,
                status: course.status,
                visibility: course.visibility,
            };
            
            res.status(200).json({
                status: 'success',
                data: publicCourseData,
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: course,
        });
    } catch (error: any) {
        console.error('Get Course Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            short_description,
            category,
            level,
            outcomes,
            prerequisites,
            status,
            is_published,
            instructors,
            price,
            discounted_price,
            is_free,
            validity_period,
            intro_video,
            enable_discussion_forum,
            show_course_rating,
            enable_certificate,
            visibility,
            meta_title,
            meta_description,
        } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const course = await Course.findByPk(id);
        if (!course) {
            res.status(404).json({ status: 'error', message: 'Course not found' });
            return;
        }

        // Update fields
        if (title) course.title = title.trim();
        if (description !== undefined) course.description = description ? description.trim() : null;
        if (short_description !== undefined) course.short_description = short_description ? short_description.trim() : null;
        if (category) course.category = category;
        if (level) course.level = level;
        if (outcomes) {
            course.outcomes = outcomes;
            course.changed('outcomes', true);
        }
        if (prerequisites) {
            course.prerequisites = prerequisites;
            course.changed('prerequisites', true);
        }
        if (status) course.status = status;
        if (is_published !== undefined) course.is_published = is_published;

        // Instructors
        if (instructors !== undefined) {
            course.instructors = instructors;
            // Explicitly mark the field as changed for Sequelize to save JSON fields
            course.changed('instructors', true);
        }

        // Pricing
        if (price !== undefined) course.price = price;
        if (discounted_price !== undefined) course.discounted_price = discounted_price;
        if (is_free !== undefined) course.is_free = is_free;
        if (validity_period !== undefined) course.validity_period = validity_period;

        // Media - intro video
        if (intro_video !== undefined && intro_video !== course.intro_video) {
            // Delete old intro video file if it exists and is a local file
            if (course.intro_video && course.intro_video.startsWith('uploads/')) {
                try {
                    deleteFile(course.intro_video);
                    console.log('Deleted old intro video file:', course.intro_video);
                } catch (err) {
                    console.error('Failed to delete old intro video file:', err);
                }
            }
            course.intro_video = intro_video;
        }

        // Settings
        if (enable_discussion_forum !== undefined) course.enable_discussion_forum = enable_discussion_forum;
        if (show_course_rating !== undefined) course.show_course_rating = show_course_rating;
        if (enable_certificate !== undefined) course.enable_certificate = enable_certificate;
        if (visibility !== undefined) course.visibility = visibility;
        if (meta_title !== undefined) course.meta_title = meta_title;
        if (meta_description !== undefined) course.meta_description = meta_description;

        await course.save();

        res.status(200).json({
            status: 'success',
            message: 'Course updated successfully',
            data: course,
        });
    } catch (error: any) {
        console.error('Update Course Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const course = await Course.findByPk(id);
        if (!course) {
            res.status(404).json({ status: 'error', message: 'Course not found' });
            return;
        }

        // Delete course folder and assets
        try {
            deleteCourseFolders(course.id);
        } catch (e) {
            console.warn(`Failed to delete course folder for course ${id}`, e);
        }

        await course.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Course deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete Course Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const uploadCourseAsset = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'thumbnail' or 'preview'
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'No file uploaded' });
            return;
        }

        const course = await Course.findByPk(id);
        if (!course) {
            // Delete uploaded file if course not found
            if (req.file) deleteFile(req.file.path);
            res.status(404).json({ status: 'error', message: 'Course not found' });
            return;
        }

        // Extract relative path starting from 'uploads/'
        const relativePath = req.file.path
            .split('uploads')[1] // Get everything after 'uploads'
            .replace(/\\/g, '/') // Convert backslashes to forward slashes
            .replace(/^\//, ''); // Remove leading slash
        const storagePath = `uploads/${relativePath}`;

        if (type === 'thumbnail') {
            // Delete old thumbnail if exists
            if (course.thumbnail) {
                deleteFile(course.thumbnail);
            }
            course.thumbnail = storagePath;
        } else if (type === 'preview') {
            // Delete old preview if exists
            if (course.intro_video) {
                deleteFile(course.intro_video);
            }
            course.intro_video = storagePath;
        } else {
            // Invalid type, delete uploaded file
            if (req.file) deleteFile(req.file.path);
            res.status(400).json({ status: 'error', message: 'Invalid asset type' });
            return;
        }

        await course.save();

        res.status(200).json({
            status: 'success',
            message: 'File uploaded successfully',
            data: {
                path: storagePath,
                type,
            },
        });
    } catch (error: any) {
        console.error('Upload Asset Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

// ========================================
// COURSE SECTIONS (MODULES) CONTROLLERS
// ========================================

export const createSection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const { title, order, is_published } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const course = await Course.findByPk(courseId);
        if (!course) {
            res.status(404).json({ status: 'error', message: 'Course not found' });
            return;
        }

        const section = await CourseSection.create({
            course_id: parseInt(courseId),
            title: title.trim(),
            order: order !== undefined ? order : 0, // Default to 0 or calculate last
            is_published: is_published !== undefined ? is_published : false,
        });

        res.status(201).json({
            status: 'success',
            message: 'Section created successfully',
            data: section,
        });
    } catch (error: any) {
        console.error('Create Section Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

// ... existing imports

export const getAllSections = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;

        const sections = await CourseSection.findAll({
            where: { course_id: courseId },
            include: [
                {
                    model: Lesson,
                    as: 'lessons',
                }
            ],
            order: [
                ['order', 'ASC'],
                [{ model: Lesson, as: 'lessons' }, 'order', 'ASC']
            ],
        });

        res.status(200).json({
            status: 'success',
            data: sections,
        });
    } catch (error: any) {
        console.error('Get Sections Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const getSectionById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { sectionId } = req.params;

        const section = await CourseSection.findByPk(sectionId, {
            include: [
                {
                    model: Lesson,
                    as: 'lessons',
                }
            ],
            order: [
                [{ model: Lesson, as: 'lessons' }, 'order', 'ASC']
            ],
        });

        if (!section) {
            res.status(404).json({ status: 'error', message: 'Section not found' });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: section,
        });
    } catch (error: any) {
        console.error('Get Section By Id Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const uploadThumbnail = async (req: AuthRequest, res: Response): Promise<void> => {
    req.query.type = 'thumbnail';
    await uploadCourseAsset(req, res);
};

export const uploadIntroVideo = async (req: AuthRequest, res: Response): Promise<void> => {
    req.query.type = 'preview';
    await uploadCourseAsset(req, res);
};

export const updateSection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { sectionId } = req.params;
        const { title, order, is_published } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const section = await CourseSection.findByPk(sectionId);
        if (!section) {
            res.status(404).json({ status: 'error', message: 'Section not found' });
            return;
        }

        if (title !== undefined) section.title = title.trim();
        if (order !== undefined) section.order = order;
        if (is_published !== undefined) section.is_published = is_published;

        await section.save();

        res.status(200).json({
            status: 'success',
            message: 'Section updated successfully',
            data: section,
        });
    } catch (error: any) {
        console.error('Update Section Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const deleteSection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { sectionId } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const section = await CourseSection.findByPk(sectionId);
        if (!section) {
            res.status(404).json({ status: 'error', message: 'Section not found' });
            return;
        }

        await section.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Section deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete Section Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const reorderSections = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const { sections } = req.body; // Array of { id, order }

        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!Array.isArray(sections) || sections.length === 0) {
            res.status(400).json({ status: 'error', message: 'Sections array is required' });
            return;
        }

        // Verify course ownership or admin (skipped for now for MVP)

        const updatePromises = sections.map(async (item: { id: number; order: number }) => {
            await CourseSection.update(
                { order: item.order },
                { where: { id: item.id, course_id: courseId } }
            );
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            status: 'success',
            message: 'Sections reordered successfully',
        });
    } catch (error: any) {
        console.error('Reorder Sections Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

// ========================================
// LESSONS CONTROLLERS
// ========================================

const normalizeContentBody = (contentBody: unknown, contentType: string | undefined): string | undefined => {
    if (contentBody === undefined || contentBody === null) return undefined;

    const normalizedType = (contentType || '').toLowerCase();
    if (normalizedType !== 'text' && normalizedType !== 'document') {
        return typeof contentBody === 'string' ? contentBody : JSON.stringify(contentBody);
    }

    if (typeof contentBody === 'string') {
        const trimmed = contentBody.trim();
        if (!trimmed) return undefined;
        try {
            const parsed = JSON.parse(trimmed);
            return JSON.stringify(parsed);
        } catch {
            // Wrap plain text into EditorJS paragraph block
            return JSON.stringify({
                time: Date.now(),
                blocks: [
                    {
                        type: 'paragraph',
                        data: { text: trimmed },
                    },
                ],
                version: '2.28.2',
            });
        }
    }

    return JSON.stringify(contentBody);
};

export const createLesson = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { sectionId } = req.params;
        const {
            title,
            content_type,
            content_body,
            file_path,
            zoom_meeting_id,
            zoom_join_url,
            order,
            duration,
            is_free_preview,
            is_published,
            start_time, // Extract start_time
        } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const section = await CourseSection.findByPk(sectionId);
        if (!section) {
            res.status(404).json({ status: 'error', message: 'Section not found' });
            return;
        }

        let lessonOrder = order;
        if (lessonOrder === undefined) {
            // Get max order
            const maxOrder = await Lesson.max('order', { where: { section_id: sectionId } });
            lessonOrder = (maxOrder as number || 0) + 1;
        }

        const normalizedContentBody = normalizeContentBody(content_body, content_type);

        const lesson = await Lesson.create({
            section_id: parseInt(sectionId),
            title: title.trim(),
            content_type,
            content_body: normalizedContentBody,
            file_path: file_path || null,
            zoom_meeting_id: zoom_meeting_id || null,
            zoom_join_url: zoom_join_url || null,
            order: lessonOrder,
            duration: duration || null,
            is_free_preview: is_free_preview !== undefined ? is_free_preview : false,
            is_published: is_published !== undefined ? is_published : true,
            start_time: start_time || null, // Pass start_time
        });

        res.status(201).json({
            status: 'success',
            message: 'Lesson created successfully',
            data: lesson,
        });
    } catch (error: any) {
        console.error('Create Lesson Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const getLessons = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { sectionId } = req.params;

        const section = await CourseSection.findByPk(sectionId);
        if (!section) {
            res.status(404).json({ status: 'error', message: 'Section not found' });
            return;
        }

        const lessons = await Lesson.findAll({
            where: { section_id: sectionId },
            include: [
                {
                    model: LessonResource,
                    as: 'resources',
                }
            ],
            order: [['order', 'ASC']],
        });

        res.status(200).json({
            status: 'success',
            data: lessons,
        });
    } catch (error: any) {
        console.error('Get All Lessons Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const getLessonById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const lesson = await Lesson.findByPk(lessonId, {
            include: [
                {
                    model: LessonResource,
                    as: 'resources',
                }
            ]
        });

        if (!lesson) {
            res.status(404).json({ status: 'error', message: 'Lesson not found' });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: lesson,
        });
    } catch (error: any) {
        console.error('Get Lesson Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const {
            title,
            content_type,
            content_body,
            file_path,
            zoom_meeting_id,
            zoom_join_url,
            order,
            duration,
            is_free_preview,
            is_published,
            start_time, // Extract start_time
        } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
            res.status(404).json({ status: 'error', message: 'Lesson not found' });
            return;
        }

        const normalizedContentBody = content_body !== undefined
            ? normalizeContentBody(content_body, content_type ?? lesson.content_type)
            : undefined;

        // Update fields
        if (title !== undefined) lesson.title = title.trim();
        if (content_type !== undefined) lesson.content_type = content_type;
        if (normalizedContentBody !== undefined) lesson.content_body = normalizedContentBody;
        if (file_path !== undefined) lesson.file_path = file_path;
        if (zoom_meeting_id !== undefined) lesson.zoom_meeting_id = zoom_meeting_id;
        if (zoom_join_url !== undefined) lesson.zoom_join_url = zoom_join_url;
        if (order !== undefined) lesson.order = order;
        if (duration !== undefined) lesson.duration = duration;
        if (is_free_preview !== undefined) lesson.is_free_preview = is_free_preview;
        if (is_published !== undefined) lesson.is_published = is_published;
        if (start_time !== undefined) lesson.start_time = start_time; // Update start_time

        await lesson.save();

        res.status(200).json({
            status: 'success',
            message: 'Lesson updated successfully',
            data: lesson,
        });
    } catch (error: any) {
        console.error('Update Lesson Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const userId = req.userId;

        console.log(`[DELETE LESSON] Starting deletion for lesson ID: ${lessonId}`);

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
            console.log(`[DELETE LESSON] Lesson ${lessonId} not found`);
            res.status(404).json({ status: 'error', message: 'Lesson not found' });
            return;
        }

        console.log(`[DELETE LESSON] Found lesson: ${lesson.title}, Type: ${lesson.content_type}, Zoom ID: ${lesson.zoom_meeting_id}`);

        // If it's a live lesson, delete the Zoom meeting
        if (lesson.content_type === 'live' && lesson.zoom_meeting_id) {
            try {
                console.log(`[DELETE LESSON] Attempting to delete Zoom meeting ${lesson.zoom_meeting_id}`);
                await ZoomService.deleteMeeting(lesson.zoom_meeting_id.toString());
                console.log(`[DELETE LESSON] Successfully deleted Zoom meeting ${lesson.zoom_meeting_id}`);
            } catch (err) {
                // Log error but continue with deletion
                console.error(`[DELETE LESSON] Failed to delete Zoom meeting ${lesson.zoom_meeting_id}:`, err);
            }
        }

        // If it's a video lesson, delete the video file from server
        if (lesson.content_type === 'video' && lesson.file_path) {
            try {
                console.log(`[DELETE LESSON] Attempting to delete video file: ${lesson.file_path}`);
                deleteFile(lesson.file_path);
                console.log(`[DELETE LESSON] Successfully deleted video file`);
            } catch (err) {
                // Log error but continue with deletion
                console.error(`[DELETE LESSON] Failed to delete video file:`, err);
            }
        }

        // Delete the lesson from database
        console.log(`[DELETE LESSON] Deleting lesson ${lessonId} from database`);
        await lesson.destroy();
        console.log(`[DELETE LESSON] Successfully deleted lesson ${lessonId} from database`);

        res.status(200).json({
            status: 'success',
            message: 'Lesson deleted successfully',
        });
    } catch (error: any) {
        console.error('[DELETE LESSON] Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

export const reorderLessons = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { sectionId } = req.params;
        const { lessons } = req.body; // Array of { id, order }
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!Array.isArray(lessons) || lessons.length === 0) {
            res.status(400).json({ status: 'error', message: 'Lessons array is required' });
            return;
        }

        // Verify section exists
        const section = await CourseSection.findByPk(sectionId);
        if (!section) {
            res.status(404).json({ status: 'error', message: 'Section not found' });
            return;
        }

        // Update order for each lesson
        const updatePromises = lessons.map(async (item: { id: number; order: number }) => {
            await Lesson.update(
                { order: item.order },
                { where: { id: item.id, section_id: sectionId } }
            );
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            status: 'success',
            message: 'Lessons reordered successfully',
        });
    } catch (error: any) {
        console.error('Reorder Lessons Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

/**
 * Upload video for a lesson
 * PATCH /api/courses/lessons/:lessonId/video
 */
export const uploadLessonVideo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const userId = req.userId;

        console.log('uploadLessonVideo - LessonId:', lessonId);
        console.log('uploadLessonVideo - File received:', req.file ? req.file.filename : 'No file');
        console.log('uploadLessonVideo - File path:', req.file ? req.file.path : 'No path');

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        // Fetch lesson (courseId was already set by setCourseIdFromLesson middleware)
        const lesson = await Lesson.findByPk(lessonId);

        if (!lesson) {
            res.status(404).json({ status: 'error', message: 'Lesson not found' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'No video file uploaded' });
            return;
        }

        // Delete old video if exists
        if (lesson.file_path) {
            deleteFile(lesson.file_path);
        }

        // Update lesson with new video path
        // normalize path for cross-platform compatibility
        const relativePath = req.file.path
            .split('uploads')[1] // Get everything after 'uploads'
            .replace(/\\/g, '/') // Convert backslashes to forward slashes
            .replace(/^\//, ''); // Remove leading slash
        const storagePath = `uploads/${relativePath}`;
        lesson.file_path = storagePath;

        await lesson.save();

        console.log('uploadLessonVideo - Video saved successfully:', {
            lessonId: lesson.id,
            file_path: storagePath
        });

        res.status(200).json({
            status: 'success',
            message: 'Video uploaded successfully',
            data: {
                ...lesson.toJSON(),
                file_path: storagePath
            },
        });
    } catch (error: any) {
        console.error('Upload Lesson Video Error:', error);
        // Clean up file if error matches
        if (req.file) deleteFile(req.file.path);

        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

/**
 * Upload resource for a lesson
 * POST /api/courses/lessons/:lessonId/resources
 */
export const uploadLessonResource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'No resource file uploaded' });
            return;
        }

        // Fetch lesson (courseId was already set by setCourseIdFromLesson middleware)
        const lesson = await Lesson.findByPk(lessonId);

        if (!lesson) {
            if (req.file) deleteFile(req.file.path);
            res.status(404).json({ status: 'error', message: 'Lesson not found' });
            return;
        }

        const relativePath = req.file.path
            .split('uploads')[1] // Get everything after 'uploads'
            .replace(/\\/g, '/') // Convert backslashes to forward slashes
            .replace(/^\//, ''); // Remove leading slash
        const storagePath = `uploads/${relativePath}`;

        const resource = await LessonResource.create({
            lesson_id: lesson.id,
            title: req.file.originalname,
            file_path: storagePath,
            file_size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB', // Convert to MB
            file_type: path.extname(req.file.originalname).substring(1), // extension without dot
        });

        res.status(201).json({
            status: 'success',
            message: 'Resource uploaded successfully',
            data: resource,
        });
    } catch (error: any) {
        console.error('Upload Lesson Resource Error:', error);
        if (req.file) deleteFile(req.file.path);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};

/**
 * Delete a lesson resource
 * DELETE /api/courses/lessons/resources/:resourceId
 */
export const deleteLessonResource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { resourceId } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const resource = await LessonResource.findByPk(resourceId);
        if (!resource) {
            res.status(404).json({ status: 'error', message: 'Resource not found' });
            return;
        }

        // Delete file from storage
        deleteFile(resource.file_path);

        // Delete from database
        await resource.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Resource deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete Lesson Resource Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error',
        });
    }
};
