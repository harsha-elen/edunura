import { Request, Response } from 'express';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import { User, Course, Enrollment, GenoToken } from '../../models';
import { AuthRequest } from '../../middleware/auth';

const GENEO_SECRET = process.env.GENEO_JWT_SECRET || 'your-secret-key';
const GENEO_ISSUER = process.env.GENEO_ISSUER || 'https://api.edunura.in';
const TOKEN_EXPIRY_HOURS = parseInt(process.env.GENEO_TOKEN_EXPIRY_HOURS || '24', 10);
const ORG_CODE = 'EDUNURA-001';
const SCHOOL_ID = 'EDU-SCH-001-EDUNURA-001';

const GENEO_SUBJECT_CODES: Record<string, string> = {
    'English Grammar': 'EG',
    'Mathematics': 'M',
    'Environmental Studies': 'EVS',
    'Science': 'S',
    'Social Science': 'SS',
    'History': 'HIST',
    'Geography': 'GEOG',
    'Political Science': 'PS',
    'Economics': 'ECO',
    'English': 'E',
    'Computer': 'COMP',
    'Hindi': 'H',
    'Hindi Grammar': 'HG',
};

const mapToSubjectCodes = (subjects: string[]): string[] => {
    return subjects.map(subject => GENEO_SUBJECT_CODES[subject] || subject);
};

/**
 * Check if a teacher is assigned to any Geneo-enabled course.
 * Teachers are stored in the JSON `instructors` column on the courses table.
 */
const parseInstructors = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch {}
    }
    return [];
};

const hasGeneoEnabledCourseForTeacher = async (userId: number): Promise<boolean> => {
    const courses = await Course.findAll({
        where: { geneo_enabled: true },
        attributes: ['id', 'instructors'],
    });
    return courses.some((c) => {
        const instructors = parseInstructors(c.instructors);
        return instructors.some((i: any) => Number(i.id) === userId);
    });
};

/**
 * Generate Geneo SSO token for student or teacher with Geneo-enabled courses
 */
export const generateGenoToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { courseId, mode = 'learn' } = req.body;

        if (!userId) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized',
            });
            return;
        }

        // Get user details
        const user = await User.findByPk(userId, {
            attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
        });

        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
            return;
        }

        // Check access based on role
        let hasAccess = false;
        if (user.role === 'admin') {
            // Admin has access if any Geneo-enabled course exists
            const count = await Course.count({ where: { geneo_enabled: true } });
            hasAccess = count > 0;
        } else if (user.role === 'teacher') {
            hasAccess = await hasGeneoEnabledCourseForTeacher(userId);
        } else {
            const enrollment = await Enrollment.findOne({
                where: { student_id: userId },
                include: [{
                    model: Course, as: 'course',
                    where: { geneo_enabled: true },
                    attributes: ['id'],
                    required: true,
                }],
            });
            hasAccess = !!enrollment;
        }

        if (!hasAccess) {
            res.status(403).json({
                status: 'error',
                message: 'No Geneo-enabled courses found for this user',
            });
            return;
        }

        // Cleanup: Delete expired or revoked tokens for this user to keep the DB clean
        await GenoToken.destroy({
            where: {
                user_id: userId,
                [Op.or]: [
                    { revoked: true },
                    { expires_at: { [Op.lt]: new Date() } }
                ]
            }
        });

        // Check for existing valid token
        let token: string | null = null;
        let expiresAt: Date | null = null;

        const existingToken = await GenoToken.findOne({
            where: {
                user_id: userId,
                revoked: false,
                expires_at: { [Op.gt]: new Date(Date.now() + 5 * 60 * 1000) } // At least 5 mins remaining
            },
            order: [['expires_at', 'DESC']]
        });

        if (existingToken) {
            try {
                const decodedToken = jwt.verify(existingToken.token, GENEO_SECRET) as any;
                if (decodedToken.mode === mode) {
                    token = existingToken.token;
                    expiresAt = existingToken.expires_at;
                }
            } catch (err) {
                // Token invalid or mode mismatch, proceed to generate new
            }
        }
        
        if (!token) {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

            // Geneo role: 1 = Admin, 2 = Teacher, 3 = Student
            const geneoRole = user.role === 'admin' ? 1 : user.role === 'teacher' ? 2 : 3;

            const jwtPayload = {
                profileId: userId.toString(),
                name: `${user.first_name} ${user.last_name}`,
                role: geneoRole,
                mode: mode,
                iss: GENEO_ISSUER,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(expiresAt.getTime() / 1000),
            };

            token = jwt.sign(jwtPayload, GENEO_SECRET);

            // Store token in database
            await GenoToken.create({
                user_id: userId,
                token,
                expires_at: expiresAt,
                revoked: false,
            });
        }

        // Format uid based on role
        const uidPrefix = user.role === 'admin' ? 'EDU-ADM-USER' : user.role === 'teacher' ? 'EDU-TCH-USER' : 'EDU-STU-USER';
        const uid = `${uidPrefix}-${userId}`;

        // Get subject code if courseId is provided
        let subjectParams = '';
        if (courseId) {
            const targetCourse = await Course.findByPk(courseId, {
                attributes: ['geneo_subject', 'geneo_enabled']
            });

            if (targetCourse && targetCourse.geneo_enabled && targetCourse.geneo_subject) {
                let subjects: string[] = [];
                const rawSubject = targetCourse.geneo_subject as any;
                if (Array.isArray(rawSubject)) {
                    subjects = rawSubject;
                } else if (typeof rawSubject === 'string' && rawSubject.trim()) {
                    try {
                        const parsed = JSON.parse(rawSubject);
                        subjects = Array.isArray(parsed) ? parsed : [rawSubject];
                    } catch {
                        subjects = [rawSubject];
                    }
                }
                
                const codes = mapToSubjectCodes(subjects);
                if (codes.length > 0) {
                    subjectParams = `&subject=${codes.join(',')}`;
                }
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                uid,
                token,
                userType: user.role,
                mode,
                expires_at: expiresAt,
                sso_url: `https://learn-stage.geneo.in/sso-redirect/edunura?uid=${uid}&token=${token}${subjectParams}&mode=${mode}`,
            },
        });
    } catch (error: any) {
        console.error('Error generating Geneo token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate Geneo token',
            error: error.message,
        });
    }
};

/**
 * Verify Geneo token — called by Geneo's backend (User Info API).
 *
 * Geneo sends:
 *   Authorization: Bearer {same JWT we generated}
 *   Body: { uniqueId: "EDU-STU-USER-42" or "EDU-TCH-USER-42" }
 *
 * The JWT payload already contains profileId = "42" (the userId we put there).
 * So we verify the JWT, extract userId from its payload — no string parsing needed.
 * uniqueId from body is just a cross-check sanity guard.
 *
 * Returns: userId, classes, subjects from the user's Geneo-enabled courses.
 */
export const verifyGenoToken = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Extract Bearer token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ status: 'error', message: 'Authorization header with Bearer token is required' });
            return;
        }
        const token = authHeader.slice(7);

        // 2. Verify JWT signature and extract userId from payload
        let decoded: { profileId: string; [key: string]: any };
        try {
            decoded = jwt.verify(token, GENEO_SECRET) as any;
        } catch {
            res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
            return;
        }

        const userId = parseInt(decoded.profileId, 10);
        if (isNaN(userId)) {
            res.status(403).json({ status: 'error', message: 'Token payload is malformed' });
            return;
        }

        // 3. Confirm token exists in DB and is not revoked
        const genoTokenRecord = await GenoToken.findOne({ where: { token, revoked: false } });
        if (!genoTokenRecord) {
            res.status(403).json({ status: 'error', message: 'Token has been revoked or does not exist' });
            return;
        }

        // 4. Sanity check: uniqueId from body must match the userId in the JWT
        //    (Geneo echoes back exactly what we sent them in the URL)
        const { uniqueId } = req.body;
        if (uniqueId) {
            const validUids = [`EDU-STU-USER-${userId}`, `EDU-TCH-USER-${userId}`, `EDU-ADM-USER-${userId}`];
            if (!validUids.includes(uniqueId)) {
                res.status(403).json({ status: 'error', message: 'uniqueId does not match token owner' });
                return;
            }
        }

        // 5. Fetch user to determine role
        const user = await User.findByPk(userId, { attributes: ['id', 'role', 'first_name', 'last_name'] });
        if (!user) {
            res.status(403).json({ status: 'error', message: 'User not found' });
            return;
        }

        // 6. Fetch Geneo-enabled courses based on role
        let geneoClasses: string[] = [];
        let geneoSubjects: string[] = [];

        if (user.role === 'admin') {
            // Admin: return ALL classes (1-10) and ALL subjects (mapped to codes)
            geneoClasses = ['1','2','3','4','5','6','7','8','9','10'];
            geneoSubjects = [
                'English Grammar', 'Mathematics', 'Environmental Studies', 'Science',
                'Social Science', 'History', 'Geography', 'Political Science',
                'Economics', 'English', 'Computer', 'Hindi', 'Hindi Grammar'
            ];
        } else if (user.role === 'teacher') {
            // Teachers: check instructors JSON column
            const courses = await Course.findAll({
                where: { geneo_enabled: true },
                attributes: ['instructors', 'geneo_class', 'geneo_subject'],
            });
            const teacherCourses = courses.filter((c) => {
                const instructors = parseInstructors(c.instructors);
                return instructors.some((i: any) => Number(i.id) === userId);
            });
            geneoClasses = [...new Set(teacherCourses.map((c) => c.geneo_class).filter(Boolean))] as string[];
            
            const teacherSubjects = teacherCourses.flatMap(c => {
                const rawSubject = c.geneo_subject as any;
                if (Array.isArray(rawSubject)) return rawSubject;
                if (typeof rawSubject === 'string' && rawSubject.trim()) {
                    try {
                        const parsed = JSON.parse(rawSubject);
                        return Array.isArray(parsed) ? parsed : [rawSubject];
                    } catch {
                        return [rawSubject];
                    }
                }
                return [];
            });
            geneoSubjects = [...new Set(teacherSubjects.filter(Boolean))] as string[];
        } else {
            // Students: check enrollments table
            const enrollments = await Enrollment.findAll({
                where: { student_id: userId },
                include: [{
                    model: Course, as: 'course',
                    where: { geneo_enabled: true },
                    attributes: ['geneo_class', 'geneo_subject'],
                    required: true,
                }],
                order: [['enrollment_date', 'DESC']],
            });
            geneoClasses = [...new Set(enrollments.map((e: any) => e.course.geneo_class).filter(Boolean))];
            
            const studentSubjects = enrollments.flatMap((e: any) => {
                const rawSubject = e.course.geneo_subject as any;
                if (Array.isArray(rawSubject)) return rawSubject;
                if (typeof rawSubject === 'string' && rawSubject.trim()) {
                    try {
                        const parsed = JSON.parse(rawSubject);
                        return Array.isArray(parsed) ? parsed : [rawSubject];
                    } catch {
                        return [rawSubject];
                    }
                }
                return [];
            });
            geneoSubjects = [...new Set(studentSubjects.filter(Boolean))];
        }

        if (!geneoClasses.length && !geneoSubjects.length) {
            res.status(403).json({ status: 'error', message: 'No active Geneo-enabled courses found for this user' });
            return;
        }

        const classes = geneoClasses;
        const subjects = geneoSubjects;
        const subjectCodes = mapToSubjectCodes(geneoSubjects);

        // Build uniqueId based on role
        const uidPrefix = user.role === 'admin' ? 'EDU-ADM-USER' : user.role === 'teacher' ? 'EDU-TCH-USER' : 'EDU-STU-USER';
        const responseUniqueId = `${uidPrefix}-${userId}`;

        res.status(200).json({
            uniqueId: responseUniqueId,
            name: `${user.first_name} ${user.last_name}`,
            userType: user.role,
            mode: decoded.mode || 'learn',
            classes,
            subjects,
            subjectCodes,
        });
    } catch (error: any) {
        console.error('Error verifying Geneo token:', error);
        res.status(500).json({ status: 'error', message: 'Failed to verify token', error: error.message });
    }
};

/**
 * Revoke Geneo token (logout from Geneo)
 */
export const revokeGenoToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({
                status: 'error',
                message: 'Token is required',
            });
            return;
        }

        const genoTokenRecord = await GenoToken.findOne({
            where: { token },
        });

        if (!genoTokenRecord) {
            res.status(404).json({
                status: 'error',
                message: 'Token not found',
            });
            return;
        }

        // Revoke the token
        genoTokenRecord.revoked = true;
        await genoTokenRecord.save();

        res.status(200).json({
            status: 'success',
            message: 'Token revoked successfully',
        });
    } catch (error: any) {
        console.error('Error revoking Geneo token:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to revoke token',
            error: error.message,
        });
    }
};

/**
 * Organization Info API — called once by Geneo during setup (Section 6.1 of spec).
 *
 * Geneo calls:
 *   GET /api/geneo/organization-info?organizationCode=EDUNURA-001
 *   X-Api-Key: <key>
 *
 * Returns the org → school → class/section hierarchy that Geneo uses to
 * create their internal school/class/section mappings.
 */
export const getOrganizationInfo = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate API key (Geneo will send this in X-Api-Key header)
        const apiKey = req.headers['x-api-key'];
        const expectedKey = process.env.GENEO_API_KEY;

        if (!expectedKey) {
            res.status(503).json({ status: 'error', message: 'GENEO_API_KEY not configured on server' });
            return;
        }
        if (apiKey !== expectedKey) {
            res.status(401).json({ status: 'error', message: 'Invalid API key' });
            return;
        }

        const { organizationCode } = req.query;
        if (organizationCode && organizationCode !== ORG_CODE) {
            res.status(404).json({ status: 'error', message: 'Organization not found' });
            return;
        }

        // Derive available classes from Geneo-enabled courses in the system
        const geneoCoursesRaw = await Course.findAll({
            where: { geneo_enabled: true },
            attributes: ['geneo_class'],
        });

        // Collect unique class values; fall back to all 10 classes if none configured
        const configuredClasses: string[] = [
            ...new Set(
                geneoCoursesRaw
                    .map((c: any) => c.geneo_class as string)
                    .filter(Boolean)
            ),
        ];
        const classesToExpose = configuredClasses.length > 0
            ? configuredClasses.sort((a, b) => Number(a) - Number(b))
            : ['1','2','3','4','5','6','7','8','9','10'];

        // Build classSectionDetails — one section "A" per class under the single school
        const classSectionDetails = classesToExpose.map((className, idx) => ({
            schoolId: SCHOOL_ID,
            schoolName: 'Edunura',
            classId: 100 + idx + 1,
            className,
            sectionId: 200 + idx + 1,
            schoolSectionId: 4300 + idx + 1,
            section: 'A',
        }));

        res.status(200).json({
            organisationDetails: [
                {
                    organisationID: ORG_CODE,
                    organisationName: 'Edunura Education',
                },
            ],
            schoolDetails: [
                {
                    schoolId: SCHOOL_ID,
                    schoolName: 'Edunura',
                    location: 'Online',
                },
            ],
            classSectionDetails,
        });
    } catch (error: any) {
        console.error('Error fetching Geneo organization info:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch organization info',
            error: error.message,
        });
    }
};
