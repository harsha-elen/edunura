import fs from 'fs';
import path from 'path';

const UPLOADS_BASE = path.join(__dirname, '../../uploads/courses');

export const createCourseFolders = (courseId: number) => {
    const courseDir = path.join(UPLOADS_BASE, `id_${courseId}`);
    const subDirs = ['thumbnail', 'preview', 'assets'];

    if (!fs.existsSync(courseDir)) {
        fs.mkdirSync(courseDir, { recursive: true });
    }

    subDirs.forEach(dir => {
        const subDirPath = path.join(courseDir, dir);
        if (!fs.existsSync(subDirPath)) {
            fs.mkdirSync(subDirPath);
        }
    });

    return courseDir;
};

export const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const deleteCourseFolders = (courseId: number) => {
    try {
        const courseDir = path.join(UPLOADS_BASE, `id_${courseId}`);
        if (fs.existsSync(courseDir)) {
            fs.rmSync(courseDir, { recursive: true, force: true });
            console.log(`✅ Deleted course folder: ${courseDir}`);
        }
    } catch (error: any) {
        console.error(`❌ Error deleting course folder: ${error.message}`);
        throw error;
    }
};

export const deleteFile = (relativePath: string) => {
    const debugLog = (msg: string) => {
        try {
            const logPath = path.join(__dirname, '../../debug_delete.txt');
            fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);
        } catch (e) { console.error('Debug log error:', e); }
    };

    try {
        if (!relativePath) return;

        debugLog(`[deleteFile] Input relativePath: ${relativePath}`);

        // Normalize relative path specific to the OS
        // 1. Remove leading slashes/backslashes
        let safePath = relativePath.replace(/^(\/|\\)+/, '');

        // 2. Normalize separators to system specific separator
        safePath = safePath.split(/\/|\\/).join(path.sep);

        const filePath = path.join(__dirname, '../../', safePath);

        debugLog(`[deleteFile] Resolved absolute filePath: ${filePath}`);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Deleted file: ${filePath}`);
            debugLog(`[deleteFile] ✅ Success: Deleted ${filePath}`);
        } else {
            console.log(`⚠️ File not found for deletion: ${filePath}`);
            
            // Let's try to construct from process.cwd() just in case __dirname is weird
            const cwdPath = path.join(process.cwd(), safePath);
            debugLog(`[deleteFile] Checking cwd path: ${cwdPath}`);

            if (fs.existsSync(cwdPath)) {
                fs.unlinkSync(cwdPath);
                debugLog(`[deleteFile] ✅ Success (via cwd): Deleted ${cwdPath}`);
            } else {
                debugLog(`[deleteFile] ⚠️ Failed: File not found at ${filePath} OR ${cwdPath}`);
            }
        }
    } catch (error: any) {
        console.error(`❌ Error deleting file: ${error.message}`);
        debugLog(`[deleteFile] ❌ Error: ${error.message}`);
    }
};
