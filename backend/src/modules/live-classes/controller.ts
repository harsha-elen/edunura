import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import ZoomService from '../../services/zoomService';
import LiveSession from '../../models/LiveSession';
import Course from '../../models/Course';
import Lesson, { LessonType } from '../../models/Lesson';
import CourseSection from '../../models/CourseSection';
import User, { UserRole } from '../../models/User';

export const createLiveClass = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    try {
        const { course_id, section_id, title, description, start_time, duration, agenda } = req.body;

        // Verify course exists
        const course = await Course.findByPk(course_id);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        // Verify section exists if provided
        if (section_id) {
            const section = await CourseSection.findByPk(section_id);
            if (!section) {
                return res.status(404).json({ status: 'error', message: 'Course section not found' });
            }
        }

        // Format start_time for Zoom API
        // datetime-local sends format like "2026-02-14T15:30" without seconds
        // Zoom API expects format like "2026-02-14T15:30:00" with timezone specified separately
        let formattedStartTime = start_time;
        if (!formattedStartTime.includes(':00', formattedStartTime.lastIndexOf(':'))) {
            formattedStartTime = formattedStartTime + ':00'; // Add seconds if not present
        }
        // Remove any Z or timezone offset if present
        formattedStartTime = formattedStartTime.replace(/Z.*$/, '');

        console.log(`[CREATE LIVE CLASS] Original start_time: ${start_time}, Formatted: ${formattedStartTime}`);

        // Create Zoom Meeting
        const meeting = await ZoomService.createMeeting({
            topic: title,
            start_time: formattedStartTime,
            duration: parseInt(duration),
            agenda: agenda || description,
            timezone: 'Asia/Kolkata', // TODO: Make this configurable or get from user settings
        });

        // Save to Database - LiveSession
        const liveSession = await LiveSession.create({
            course_id: parseInt(course_id),
            section_id: section_id ? parseInt(section_id) : null,
            title,
            description,
            start_time: new Date(start_time),
            duration: parseInt(duration),
            meeting_id: meeting.id.toString(),
            start_url: meeting.start_url,
            join_url: meeting.join_url,
            password: meeting.password,
            is_active: true,
        });

        // Create corresponding Lesson entry for curriculum
        if (section_id) {
            // Get the highest order number for this section
            const lastLesson = await Lesson.findOne({
                where: { section_id: parseInt(section_id) },
                order: [['order', 'DESC']],
            });
            const nextOrder = (lastLesson?.order || 0) + 1;

            const lesson = await Lesson.create({
                section_id: parseInt(section_id),
                title,
                content_type: LessonType.LIVE,
                content_body: description,
                zoom_meeting_id: meeting.id.toString(),
                zoom_join_url: meeting.join_url,
                duration: parseInt(duration),
                order: nextOrder,
                is_free_preview: false,
                is_published: true,
            });

            return res.status(201).json({
                status: 'success',
                message: 'Live class created successfully',
                data: {
                    ...liveSession.toJSON(),
                    lesson: lesson.toJSON(),
                },
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Live class created successfully',
            data: liveSession,
        });

    } catch (error: any) {
        console.error('Create Live Class Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create live class',
        });
    }
};

export const updateLiveClass = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    try {
        const { lessonId } = req.params;
        const { title, description, start_time, duration } = req.body;

        // Find the lesson
        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
            return res.status(404).json({ status: 'error', message: 'Lesson not found' });
        }

        if (lesson.content_type !== 'live') {
            return res.status(400).json({ status: 'error', message: 'This lesson is not a live session' });
        }

        if (!lesson.zoom_meeting_id) {
            return res.status(400).json({ status: 'error', message: 'No Zoom meeting associated with this lesson' });
        }

        // Get LiveSession to fetch current start_time if not provided
        const liveSession = await LiveSession.findOne({
            where: { meeting_id: lesson.zoom_meeting_id }
        });

        let effectiveStartTime = start_time;
        if (!effectiveStartTime && liveSession) {
            effectiveStartTime = liveSession.start_time.toISOString();
        }

        if (!effectiveStartTime) {
            return res.status(400).json({ status: 'error', message: 'Start time is required' });
        }

        // Format start_time for Zoom API
        let formattedStartTime = effectiveStartTime;
        if (!formattedStartTime.includes(':00', formattedStartTime.lastIndexOf(':'))) {
            formattedStartTime = formattedStartTime + ':00';
        }
        formattedStartTime = formattedStartTime.replace(/Z.*$/, '');

        console.log(`[UPDATE LIVE CLASS] Updating lesson ${lessonId}, Zoom meeting ${lesson.zoom_meeting_id}`);

        // Update Zoom Meeting
        await ZoomService.updateMeeting(lesson.zoom_meeting_id, {
            topic: title,
            start_time: formattedStartTime,
            duration: parseInt(duration),
            agenda: description,
            timezone: 'Asia/Kolkata',
        });

        // Update Lesson in database
        await lesson.update({
            title,
            content_body: description,
            duration: parseInt(duration),
        });

        // Update LiveSession if exists
        if (liveSession) {
            await liveSession.update({
                title,
                description,
                start_time: start_time ? new Date(start_time) : liveSession.start_time,
                duration: parseInt(duration),
            });
        }

        console.log(`[UPDATE LIVE CLASS] Successfully updated lesson ${lessonId}`);

        return res.status(200).json({
            status: 'success',
            message: 'Live class updated successfully',
            data: lesson,
        });

    } catch (error: any) {
        console.error('[UPDATE LIVE CLASS] Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update live class',
        });
    }
};

export const getLiveClassesByCourse = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;

        const sessions = await LiveSession.findAll({
            where: { course_id: courseId },
            order: [['start_time', 'ASC']],
        });

        return res.status(200).json({
            status: 'success',
            data: sessions,
        });

    } catch (error: any) {
        console.error('Get Live Classes Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch live classes',
        });
    }
};

export const deleteLiveClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const session = await LiveSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ status: 'error', message: 'Live class not found' });
        }

        // Delete from Zoom (optional: handle error gracefully if meeting already gone)
        // We do this BEFORE DB delete to ensure consistency, or AFTER if we want to ensure DB clean up even if Zoom fails?
        // Best effort: try delete from Zoom, but always delete from DB.
        try {
            await ZoomService.deleteMeeting(session.meeting_id);
        } catch (zoomError) {
            console.warn(`Failed to delete Zoom meeting ${session.meeting_id}, proceeding with DB deletion.`);
        }

        await session.destroy();

        return res.status(200).json({
            status: 'success',
            message: 'Live class deleted successfully',
        });

    } catch (error: any) {
        console.error('Delete Live Class Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete live class',
        });
    }
};

/**
 * Generate Zoom Web SDK signature for joining a live class
 * Used by frontend to embed Zoom meeting directly in LMS
 */
export const getZoomSignature = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Fetch live session by meeting_id which is passed in URL
        // We use findOne because meeting_id is unique enough for our purpose here
        let session = await LiveSession.findOne({
            where: { meeting_id: id }
        });

        // Fallback: try by ID if it parses as integer and wasn't found by meeting_id
        if (!session && !isNaN(parseInt(id))) {
            session = await LiveSession.findByPk(id);
        }

        if (!session) {
            return res.status(404).json({ status: 'error', message: 'Live class not found' });
        }


        // Fetch course to verify access
        const course = await Course.findByPk(session.course_id);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        // Fetch user to determine role
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Determine if user is host (admin, teacher, moderator) or attendee
        // role 1 = host, 0 = attendee
        const isHost = [UserRole.ADMIN, UserRole.MODERATOR, UserRole.TEACHER].includes(user.role);
        const role = isHost ? 1 : 0;

        // Generate JWT signature for Zoom Web SDK
        console.log('[ZOOM DEBUG] Generating signature for:', { meetingId: session.meeting_id, role, isHost });
        const signature = await ZoomService.generateSignature(session.meeting_id, role);
        console.log('[ZOOM DEBUG] Signature generated, length:', signature.length);
        
        // SDK Key is public identifier, needed for frontend initialize
        const sdkKey = await ZoomService.getSdkKey();
        console.log('[ZOOM DEBUG] SDK Key:', sdkKey ? sdkKey.substring(0, 10) + '...' : 'EMPTY');

        // If host, use Zoom API account user credentials
        // If attendee, use the logged-in LMS user credentials
        let userName: string;
        let userEmail: string;

        if (isHost) {
            // Get host user from Zoom API account
            const hostUser = await ZoomService.getHostUser();
            userName = `${hostUser.first_name} ${hostUser.last_name}`;
            userEmail = hostUser.email;
        } else {
            userName = `${user.first_name} ${user.last_name}`;
            userEmail = user.email;
        }

        return res.status(200).json({
            status: 'success',
            data: {
                signature,
                sdkKey, // Added sdkKey
                meetingNumber: session.meeting_id,
                userName,
                userEmail,
                password: session.password,
                topic: session.title,
                startTime: session.start_time,
                duration: session.duration,
                joinUrl: session.join_url,
                role,
                isHost,
            },
        });

    } catch (error: any) {
        console.error('Get Zoom Signature Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate Zoom signature',
        });
    }
};

export const getAllLiveClasses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const userRole = (req as any).user?.role;

        console.log(`[GET ALL LIVE CLASSES] User: ${userId}, Role: ${userRole}`);

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        let whereClause: any = {};

        // If Admin/Moderator, show all classes
        if (userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR) {
            // No filter
        }
        // If Teacher, show classes for courses they created OR are assigned to
        else if (userRole === UserRole.TEACHER) {
            // Find courses created by this teacher OR where they are an instructor
            const allCourses = await Course.findAll({
                attributes: ['id', 'created_by', 'instructors']
            });

            const userIdNum = Number(userId);
            console.log(`[GET ALL LIVE CLASSES] Checking courses for teacher ${userIdNum}`);
            console.log(`[GET ALL LIVE CLASSES] Total courses: ${allCourses.length}`);
            
            // Debug: Print first course's created_by and instructors
            if (allCourses.length > 0) {
                const sampleCourse = allCourses[0];
                console.log(`[DEBUG] Sample course id=${sampleCourse.id}, created_by=${sampleCourse.created_by}, type=${typeof sampleCourse.created_by}`);
                console.log(`[DEBUG] Sample course instructors:`, JSON.stringify(sampleCourse.instructors));
            }
            
            const courseIds = allCourses.filter(course => {
                // strict check for creator - use type coercion
                if (Number(course.created_by) === userIdNum) {
                    console.log(`[GET ALL LIVE CLASSES] Found course ${course.id} - created_by matches`);
                    return true;
                }

                // Parse instructors - could be JSON string or array
                let instructorsArray = course.instructors;
                if (typeof course.instructors === 'string') {
                    try {
                        instructorsArray = JSON.parse(course.instructors);
                    } catch (e) {
                        instructorsArray = [];
                    }
                }

                // check if they are in the instructors list - use type coercion
                if (instructorsArray && Array.isArray(instructorsArray)) {
                    const isInstructor = instructorsArray.some((inst: any) => {
                        const instId = typeof inst === 'number' ? inst : (inst.id ? Number(inst.id) : null);
                        return instId === userIdNum;
                    });
                    if (isInstructor) {
                        console.log(`[GET ALL LIVE CLASSES] Found course ${course.id} - instructor matches`);
                    }
                    return isInstructor;
                }

                return false;
            }).map(c => c.id);

            console.log(`[GET ALL LIVE CLASSES] Teacher ${userId} has access to courses: ${courseIds.join(', ')}`);

            // Fetch live sessions for these courses
            whereClause.course_id = { [Op.in]: courseIds };
        }

        // TEMP DEBUG: Log ALL live sessions in DB to see if any exist
        const allSessions = await LiveSession.findAll({ attributes: ['id', 'course_id', 'title'] });
        console.log('[DEBUG] TOTAL SESSIONS IN DB:', allSessions.length);
        if (allSessions.length > 0) {
            console.log('[DEBUG] FIRST 3 SESSIONS:', JSON.stringify(allSessions.slice(0, 3)));
        }

        // If they have no courses, return empty array immediately to avoid fetching all
        if (whereClause.course_id && whereClause.course_id[Op.in].length === 0) {
            console.log('[GET ALL LIVE CLASSES] No courses found for user, returning empty list');
            return res.status(200).json({
                status: 'success',
                data: [],
            });
        }

        console.log('[GET ALL LIVE CLASSES] Querying LiveSession with:', JSON.stringify(whereClause, null, 2));

        // Fetch live sessions
        const sessions = await LiveSession.findAll({
            where: whereClause,
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'slug']
                }
            ],
            order: [['start_time', 'ASC']],
        });

        // Fetch associated lessons for each session
        const sessionsWithLessons = await Promise.all(sessions.map(async (session) => {
            const sessionData = session.toJSON();
            const lesson = await Lesson.findOne({
                where: {
                    zoom_meeting_id: session.meeting_id,
                    content_type: LessonType.LIVE
                },
                attributes: ['id', 'title']
            });
            return {
                ...sessionData,
                lesson: lesson ? { id: lesson.id, title: lesson.title } : null
            };
        }));

        console.log(`[GET ALL LIVE CLASSES] Found ${sessionsWithLessons.length} sessions matching criteria`);

        return res.status(200).json({
            status: 'success',
            data: sessionsWithLessons,
        });

    } catch (error: any) {
        console.error('Get All Live Classes Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch live classes',
        });
    }
};
