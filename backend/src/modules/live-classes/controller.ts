import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import ZoomService from '../../services/zoomService';
import JitsiService from '../../services/jitsiService';
import SystemSetting from '../../models/SystemSetting';
import LiveSession from '../../models/LiveSession';
import Course from '../../models/Course';
import Lesson, { LessonType } from '../../models/Lesson';
import CourseSection from '../../models/CourseSection';
import User, { UserRole } from '../../models/User';
import { getSystemTimezone, parseNaiveDateInTimezone, utcToNaiveLocal } from '../../utils/timezone';

// ─── Public Jitsi dynamic branding endpoint ─────────────────────────────────
export const getJitsiBranding = async (_req: Request, res: Response) => {
    // Explicitly allow any origin — Jitsi JS fetches this from meet.edunura.com
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        const logoSetting = await SystemSetting.findOne({ where: { key: 'org_logo' } });
        const apiUrl = (process.env.API_URL || process.env.BACKEND_URL || 'https://api.edunura.com').replace(/\/$/, '');
        const logoPath = logoSetting?.value || '';
        const logoImageUrl = logoPath ? `${apiUrl}${logoPath}` : '';
        return res.json({ logoImageUrl, logoClickUrl: '' });
    } catch {
        return res.json({ logoImageUrl: '', logoClickUrl: '' });
    }
};

// ─── In-memory host presence store ───────────────────────────────────────────
// Key: session id (string) or jitsi_room_name — whatever the URL param is.
// Value: timestamp of last heartbeat (ms since epoch).
// Zero DB reads/writes for heartbeat, status, and end-session hot paths.
const hostHeartbeats = new Map<string, number>();
const HEARTBEAT_TIMEOUT_MS = 35_000; // 35s covers 2 missed 15s pings

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

        // Get meeting platform from system settings
        const platformSetting = await SystemSetting.findOne({ where: { key: 'meeting_platform' } });
        const meetingPlatform = (platformSetting?.value || 'zoom') as 'zoom' | 'jitsi';

        // Get system timezone for proper time handling
        const systemTz = await getSystemTimezone();

        // Format start_time for API
        let formattedStartTime = start_time;
        if (!formattedStartTime.includes(':00', formattedStartTime.lastIndexOf(':'))) {
            formattedStartTime = formattedStartTime + ':00'; // Add seconds if not present
        }
        // Remove any Z or timezone offset if present
        formattedStartTime = formattedStartTime.replace(/Z.*$/, '');

        // Convert naive local time to proper UTC Date for database storage
        const utcStartDate = parseNaiveDateInTimezone(start_time, systemTz.gmtString);

        console.log(`[CREATE LIVE CLASS] Platform: ${meetingPlatform}, Original start_time: ${start_time}, UTC: ${utcStartDate.toISOString()}, Timezone: ${systemTz.iana}`);

        let liveSessionData: any = {
            course_id: parseInt(course_id),
            section_id: section_id ? parseInt(section_id) : null,
            title,
            description,
            start_time: utcStartDate,
            duration: parseInt(duration),
            is_active: true,
            meeting_type: meetingPlatform,
        };

        let lessonData: any = {
            section_id: section_id ? parseInt(section_id) : undefined,
            title,
            content_type: LessonType.LIVE,
            content_body: description,
            duration: parseInt(duration),
            is_free_preview: false,
            is_published: true,
            start_time: utcStartDate,
            content_platform: meetingPlatform,
        };

        // Create meeting based on platform
        if (meetingPlatform === 'jitsi') {
            // Jitsi Meeting
            const jitsiMeeting = await JitsiService.createMeeting({
                roomName: JitsiService.generateRoomName(),
                description: description || title,
                duration: parseInt(duration),
                startTime: utcStartDate,
            });

            liveSessionData.meeting_id = jitsiMeeting.roomName;
            liveSessionData.join_url = jitsiMeeting.joinUrl;
            liveSessionData.start_url = jitsiMeeting.joinUrl; // For Jitsi, same as join_url
            liveSessionData.jitsi_room_name = jitsiMeeting.roomName;
            liveSessionData.jitsi_config = jitsiMeeting.config;

            lessonData.jitsi_room_name = jitsiMeeting.roomName;
            lessonData.jitsi_join_url = jitsiMeeting.joinUrl;
        } else {
            // Zoom Meeting (default)
            const meeting = await ZoomService.createMeeting({
                topic: title,
                start_time: formattedStartTime,
                duration: parseInt(duration),
                agenda: agenda || description,
                timezone: systemTz.iana,
            });

            liveSessionData.meeting_id = meeting.id.toString();
            liveSessionData.start_url = meeting.start_url;
            liveSessionData.join_url = meeting.join_url;
            liveSessionData.password = meeting.password;

            lessonData.zoom_meeting_id = meeting.id.toString();
            lessonData.zoom_join_url = meeting.join_url;
        }

        // Save to Database - LiveSession
        const liveSession = await LiveSession.create(liveSessionData);

        // Create corresponding Lesson entry for curriculum
        if (section_id) {
            // Get the highest order number for this section
            const lastLesson = await Lesson.findOne({
                where: { section_id: parseInt(section_id) },
                order: [['order', 'DESC']],
            });
            const nextOrder = (lastLesson?.order || 0) + 1;

            const lesson = await Lesson.create({
                ...lessonData,
                section_id: parseInt(section_id),
                order: nextOrder,
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

        // Determine meeting platform
        const isJitsi = lesson.content_platform === 'jitsi' && lesson.jitsi_room_name;
        const isZoom = lesson.content_platform === 'zoom' && lesson.zoom_meeting_id;

        if (!isJitsi && !isZoom) {
            return res.status(400).json({ status: 'error', message: 'No meeting associated with this lesson' });
        }

        // Get LiveSession to fetch current start_time if not provided
        const liveSession = await LiveSession.findOne({
            where: {
                [Op.or]: [
                    { meeting_id: lesson.zoom_meeting_id },
                    { jitsi_room_name: lesson.jitsi_room_name }
                ]
            }
        });

        // Get system timezone for proper time handling
        const systemTz = await getSystemTimezone();

        // Determine start time for API (naive local) and DB (UTC Date)
        let formattedStartTime: string | undefined; // For API (naive local time)
        let utcStartDate: Date | undefined; // For DB storage

        if (start_time) {
            // New start_time from frontend — it's a naive local time in system timezone
            formattedStartTime = start_time as string;
            if (!formattedStartTime!.includes(':00', formattedStartTime!.lastIndexOf(':'))) {
                formattedStartTime = formattedStartTime + ':00';
            }
            formattedStartTime = formattedStartTime!.replace(/Z.*$/, '');
            utcStartDate = parseNaiveDateInTimezone(start_time, systemTz.gmtString);
        } else if (liveSession) {
            // Fallback: use existing start_time (UTC in DB), convert to naive local for API
            utcStartDate = liveSession.start_time;
            formattedStartTime = utcToNaiveLocal(liveSession.start_time, systemTz.gmtString);
        } else {
            return res.status(400).json({ status: 'error', message: 'Start time is required' });
        }

        console.log(`[UPDATE LIVE CLASS] Updating lesson ${lessonId}, Platform: ${isJitsi ? 'Jitsi' : 'Zoom'}, UTC: ${utcStartDate?.toISOString()}, Timezone: ${systemTz.iana}`);

        // Update meeting based on platform
        if (isJitsi) {
            // Update Jitsi meeting (local metadata only)
            await JitsiService.updateMeeting(lesson.jitsi_room_name!, {
                roomName: lesson.jitsi_room_name!,
                description: description || title,
                duration: parseInt(duration),
                startTime: utcStartDate,
            });
        } else {
            // Update Zoom Meeting
            await ZoomService.updateMeeting(lesson.zoom_meeting_id!, {
                topic: title,
                start_time: formattedStartTime,
                duration: parseInt(duration),
                agenda: description,
                timezone: systemTz.iana,
            });
        }

        // Update Lesson in database
        await lesson.update({
            title,
            content_body: description,
            duration: parseInt(duration),
            ...(utcStartDate ? { start_time: utcStartDate } : {}),
        });

        // Update LiveSession if exists
        if (liveSession) {
            await liveSession.update({
                title,
                description,
                start_time: utcStartDate || liveSession.start_time,
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

        // Delete from meeting platform (Zoom or Jitsi)
        try {
            if (session.meeting_type === 'jitsi' && session.jitsi_room_name) {
                await JitsiService.deleteMeeting(session.jitsi_room_name);
            } else {
                await ZoomService.deleteMeeting(session.meeting_id);
            }
        } catch (platformError) {
            console.warn(`Failed to delete meeting from ${session.meeting_type || 'Zoom'}, proceeding with DB deletion.`, platformError);
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

        // If this is a Jitsi meeting, redirect to Jitsi endpoint
        if (session.meeting_type === 'jitsi') {
            return res.status(400).json({ status: 'error', message: 'This is a Jitsi meeting. Use /jitsi-config endpoint instead.' });
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
                sdkKey,
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

/**
 * Get Jitsi configuration for embedding meeting in LMS
 * Returns JWT token and embed configuration for Jitsi Web SDK
 */
export const getJitsiConfig = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Fetch live session by jitsi_room_name or lesson id
        let session: any = null;
        
        if (isNaN(parseInt(id))) {
            // Try as room name
            session = await LiveSession.findOne({
                where: { jitsi_room_name: id }
            });
        } else {
            // Try as ID
            session = await LiveSession.findByPk(id);
        }

        if (!session) {
            return res.status(404).json({ status: 'error', message: 'Jitsi meeting not found' });
        }

        // Verify it's actually a Jitsi meeting
        if (session.meeting_type !== 'jitsi' || !session.jitsi_room_name) {
            return res.status(400).json({ status: 'error', message: 'This is not a Jitsi meeting' });
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

        // ─── Determine if user is MODERATOR or PARTICIPANT ─────────────────────
        // Moderators: Admins, Moderators, Teachers
        // Participants: Students only
        const isHost = [UserRole.ADMIN, UserRole.MODERATOR, UserRole.TEACHER].includes(user.role);

        console.log('[JITSI ACCESS] User: ' + user.id + ' | Role: ' + user.role + ' | isHost: ' + isHost);

        // DEBUG: Log user role for debugging
        console.log('[JITSI DEBUG] User details:', {
            userId: user.id,
            email: user.email,
            role: user.role,
            isHost: isHost,  // Will be: true (moderator) or false (participant)
        });

        // Get Jitsi embed configuration
        console.log('[JITSI DEBUG] Generating config for:', { roomName: session.jitsi_room_name, isHost, userId });
        
        // ─── Update in-memory heartbeat on every host join/rejoin ──────────
        // Frontend refreshes every 15s. isLive expires after 35s with no ping.
        if (isHost) {
            hostHeartbeats.set(session.jitsi_room_name, Date.now());
            console.log('[JITSI] Host joined/rejoined — heartbeat set for room:', session.jitsi_room_name);
        }
        
        const jitsiConfig = await JitsiService.getEmbedConfig({
            roomName: session.jitsi_room_name,
            displayName: `${user.first_name} ${user.last_name}`,
            email: user.email || undefined,
            isHost,  // 🔒 CRITICAL: Pass role flag to service
        });

        console.log('[JITSI DEBUG] Config generated for room:', session.jitsi_room_name, {
            hasJwt: !!jitsiConfig.jwt,
            isHost: isHost,
            userRole: user.role,
            displayName: `${user.first_name} ${user.last_name}`
        });

        return res.status(200).json({
            status: 'success',
            data: {
                ...jitsiConfig,
                roomName: session.jitsi_room_name,
                title: session.title,
                startTime: session.start_time,
                duration: session.duration,
                joinUrl: session.join_url || `${jitsiConfig.domain}/${session.jitsi_room_name}`,
                isHost,
                isModerator: isHost,
                displayName: `${user.first_name} ${user.last_name}`,
                email: user.email || '',
                meetingId: session.id,
            },
        });

    } catch (error: any) {
        console.error('Get Jitsi Config Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate Jitsi configuration',
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
            
            // Build lesson search criteria based on platform
            let lessonWhere: any = { content_type: LessonType.LIVE };
            
            if (session.meeting_type === 'jitsi' && session.jitsi_room_name) {
                lessonWhere.jitsi_room_name = session.jitsi_room_name;
            } else {
                lessonWhere.zoom_meeting_id = session.meeting_id;
            }
            
            const lesson = await Lesson.findOne({
                where: lessonWhere,
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

/**
 * POST /live-classes/:id/heartbeat
 * Called by host every 15s. Pure in-memory: no DB read or write.
 * Uses the raw :id param (room name or numeric id) as the map key —
 * must match what the student sends to /status.
 */
export const hostHeartbeat = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    if (![UserRole.ADMIN, UserRole.MODERATOR, UserRole.TEACHER].includes(userRole)) {
        return res.status(403).json({ status: 'error', message: 'Hosts only' });
    }

    const key = req.params.id;
    hostHeartbeats.set(key, Date.now());
    return res.status(200).json({ status: 'success' });
};

/**
 * POST /live-classes/:id/end-session
 * Best-effort instant clear when host explicitly ends/leaves.
 * Pure in-memory: no DB read or write.
 */
export const endLiveSession = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    if (![UserRole.ADMIN, UserRole.MODERATOR, UserRole.TEACHER].includes(userRole)) {
        return res.status(403).json({ status: 'error', message: 'Hosts only' });
    }

    const key = req.params.id;
    hostHeartbeats.delete(key);
    console.log('[JITSI] Host ended session — cleared heartbeat for key:', key);
    return res.status(200).json({ status: 'success' });
};

/**
 * GET /live-classes/:id/status
 * Students poll this every 8s. Pure in-memory: no DB read or write.
 * isLive = host sent a heartbeat within the last 35s.
 */
export const getLiveClassStatus = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const key = req.params.id;
    const lastSeen = hostHeartbeats.get(key) ?? null;
    const isLive = lastSeen !== null && (Date.now() - lastSeen) < HEARTBEAT_TIMEOUT_MS;

    return res.status(200).json({
        status: 'success',
        data: {
            isLive,
            lastHeartbeat: lastSeen,
        },
    });
};
