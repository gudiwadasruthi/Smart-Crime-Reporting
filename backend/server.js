// backend/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Create directories to store uploaded files and reports
const uploadsDir = path.join(__dirname, '..', 'uploads');
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueId}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware to parse JSON
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Enable CORS (to allow requests from your frontend)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Endpoint to handle file uploads and report data
app.post('/upload', upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        const photos = req.files.photos || [];
        const video = req.files.video ? req.files.video[0] : null;
        const crimeData = {
            crimeType: req.body['crime-type'],
            description: req.body.description,
            location: {
                lat: parseFloat(req.body.latitude),
                lng: parseFloat(req.body.longitude),
                display: req.body.location
            },
            timestamp: req.body.timestamp
        };

        const photoURLs = photos.map(photo => `http://localhost:${port}/uploads/${photo.filename}`);
        const videoURL = video ? `http://localhost:${port}/uploads/${video.filename}` : null;

        // Save the report data to a JSON file
        const reportId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const reportData = {
            ...crimeData,
            photoURLs,
            videoURL
        };
        fs.writeFileSync(
            path.join(reportsDir, `report-${reportId}.json`),
            JSON.stringify(reportData, null, 2)
        );

        res.json({
            success: true,
            photoURLs,
            videoURL
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to handle SOS data
app.post('/sos', async (req, res) => {
    try {
        const sosData = req.body;
        const sosId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        fs.writeFileSync(
            path.join(reportsDir, `sos-${sosId}.json`),
            JSON.stringify(sosData, null, 2)
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving SOS data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});