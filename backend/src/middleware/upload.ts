import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const { id, courseId: explicitCourseId } = req.params;
        const { type } = req.query; // 'thumbnail', 'preview', 'assets'

        // For lesson uploads, courseId is set by controller; for course uploads, use id
        const rawCourseId = explicitCourseId || id || 'temp';
        const rawFolderType = type as string || 'assets';

        // Sanitize to prevent path traversal — only allow alphanumeric, underscores, hyphens
        const courseId = rawCourseId.replace(/[^a-zA-Z0-9_-]/g, '');
        const folderType = rawFolderType.replace(/[^a-zA-Z0-9_-]/g, '');

        if (!courseId || !folderType) {
            return cb(new Error('Invalid courseId or folder type'), '');
        }

        const uploadPath = path.join(process.cwd(), `uploads/courses/id_${courseId}/${folderType}`);

        console.log('Upload Middleware - Destination:', {
            params: req.params,
            courseId,
            folderType,
            uploadPath
        });

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (_req: any, file: any, cb: any) => {
    if (file.fieldname === 'thumbnail') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed for thumbnails'), false);
        }
    } else if (file.fieldname === 'intro_video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only videos are allowed for intro videos'), false);
        }
    } else {
        cb(null, true);
    }
};

export const uploadCourseAsset = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '') || 1024 * 1024 * 1024, // 1GB default
    }
});
