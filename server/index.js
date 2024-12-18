import express from 'express';
import cors from 'cors';
import archiver from 'archiver';
import { globby } from 'globby';
import fs from 'fs';
import checkDiskSpace from 'check-disk-space'
import multer from 'multer';
import path from 'path';

const app = express();
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb' }));
app.use(cors());

const directoryPath = process.env.IMAGES_PATH || 'E:\\';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(directoryPath, req.body.path || '');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const listAllFilesAndDirs = dir => globby(`${dir}/**/*`, { onlyFiles: false, expandDirectories: true, objectMode: true });

const processFiles = (files) => {
    const fileMap = new Map();
    files.forEach(file => {
        file.files = [];
        fileMap.set(file.path, file);
    });
    return { files, fileMap };
};

app.get("/all", async (req, res) => {
    let retVal = {}
    retVal.diskDetails = await checkDiskSpace(directoryPath)
    let fileMap;

    retVal.allFilesAndDirs = await listAllFilesAndDirs(directoryPath).then(async (files) => {
        for await (const file of files) {
            file.relativePath = path.relative(directoryPath, file.path);
            file.stats = fs.statSync(file.path);
            file.isFolder = true;
            file.files = [];
            file.name = path.basename(file.path);
            file.parentPath = path.dirname(file.path);

            const fileIsImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'].some(ext => file.path.endsWith(ext));
            const fileIsVideo = ['mov', 'mp4', 'avi', 'mkv', 'flv', 'wmv'].some(ext => file.path.endsWith(ext));

            if (fileIsImage || fileIsVideo) {
                file.isFolder = false;
                file.isImage = fileIsImage;
                file.isVideo = fileIsVideo;
                // Read and convert image to base64
                if (fileIsImage) {
                    const data = fs.readFileSync(file.path);
                    // Get file extension for proper mime type
                    const ext = path.extname(file.path).toLowerCase();
                    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
                    // Convert to base64 with proper data URI
                    file.imageData = `data:${mimeType};base64,${data.toString('base64')}`;
                }

                // For videos, just send metadata and video ID
                if (fileIsVideo) {
                    file.videoId = Buffer.from(file.path).toString('base64');
                }
            }
        }

        // Process files and create a map
        const { fileMap: newFileMap } = processFiles(files);
        fileMap = newFileMap;

        // Build folder hierarchy
        files.forEach(file => {
            if (file.parentPath !== directoryPath) {
                const parent = fileMap.get(file.parentPath);
                if (parent) {
                    parent.files.push(file);
                }
            }
        });

        // Return only top-level files/folders
        return files.filter(file => file.parentPath === directoryPath);
    });
    res.send(retVal);
});

app.post('/createFolder', (req, res) => {
    const folderPath = path.join(directoryPath, req.body.path);
    try {
        fs.mkdirSync(folderPath, { recursive: true });
        res.send({ message: 'Folder created successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error creating folder', error: error.message });
    }
});

app.get("/video/:videoId", (req, res) => {
    try {
        const videoPath = Buffer.from(req.params.videoId, 'base64').toString();

        // Verify the file exists and is within allowed directory
        if (!fs.existsSync(videoPath) || !videoPath.startsWith(directoryPath)) {
            return res.status(404).send('Video not found');
        }

        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).send('Error streaming video');
    }
});

app.get('/download', (req, res) => {
    try {
        const filePath = path.join(directoryPath, req.query.path);

        // Security check to prevent directory traversal
        if (!filePath.startsWith(directoryPath)) {
            return res.status(403).send('Access denied');
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        res.download(filePath);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error downloading file');
    }
});

app.get('/download-folder', async (req, res) => {
    try {
        const folderPath = path.join(directoryPath, req.query.path);

        // Security check
        if (!folderPath.startsWith(directoryPath)) {
            return res.status(403).send('Access denied');
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`${path.basename(folderPath)}.zip`);

        archive.pipe(res);
        archive.directory(folderPath, false);

        archive.on('error', (err) => {
            throw err;
        });

        await archive.finalize();
    } catch (error) {
        console.error('Folder download error:', error);
        if (!res.headersSent) {
            res.status(500).send('Error creating zip archive');
        }
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array('files'), (req, res) => {
    res.send({ message: 'Files uploaded successfully' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer error occurred (e.g., file size exceeded)
        return res.status(400).json({ message: err.message });
    } else if (err) {
        // Other errors (e.g., unsupported file type)
        return res.status(400).json({ message: err.message });
    }
    next();
});

app.listen(4002, () => {
    console.log("Listening on 4002");
});
