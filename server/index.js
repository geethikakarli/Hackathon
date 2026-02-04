const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const morgan = require('morgan');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory database (replace with real DB in production)
const db = {
    users: {},
    files: {},
    requests: []
};

// Load data from file if exists
const dbPath = path.join(dataDir, 'db.json');
if (fs.existsSync(dbPath)) {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        Object.assign(db, JSON.parse(data));
    } catch (e) {
        console.log('Starting with fresh database');
    }
}

// Save database
const saveDb = () => {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

// Generate mock CID (simulating IPFS)
const generateCID = (data) => {
    return 'Qm' + crypto.createHash('sha256').update(data).digest('hex').slice(0, 44);
};

// Simple encryption (for demo - use proper encryption in production)
const encryptData = (data, key) => {
    const cipher = crypto.createCipheriv('aes-256-cbc',
        crypto.createHash('sha256').update(key).digest().slice(0, 32),
        Buffer.alloc(16, 0)
    );
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register a new user
app.post('/api/register', (req, res) => {
    const { name, password, role } = req.body;

    if (!name || !password || !role) {
        return res.status(400).json({ error: 'Name, password, and role are required' });
    }

    // Check if user already exists
    const existingUser = Object.values(db.users).find(u => u.name === name && u.role === role);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Find the highest existing numeric ID and increment it
    const existingIds = Object.keys(db.users).filter(id => /^\d+$/.test(id)).map(Number);
    const highestId = existingIds.length > 0 ? Math.max(...existingIds) : 100000;
    const address = (highestId + 1).toString();

    console.log(`Registering ${role}: ${name} with address ${address}`);

    const newUser = {
        name,
        password, // In production, hash this!
        role,
        address,
        files: [],
        requests: []
    };

    db.users[address] = newUser;
    saveDb();

    // Don't return password
    const { password: _, ...userResponse } = newUser;
    res.json({ success: true, user: userResponse });
});

// Login
app.post('/api/login', (req, res) => {
    const { name, password, role } = req.body;

    if (!name || !password || !role) {
        return res.status(400).json({ error: 'Name, password, and role are required' });
    }

    console.log(`Login attempt for ${role}: ${name}`);
    const user = Object.values(db.users).find(u => u.name === name && u.role === role && u.password === password);

    if (!user) {
        console.warn(`Login failed for ${name}`);
        return res.status(401).json({ error: 'Invalid name or password' });
    }

    console.log(`Login successful for ${name} (${user.address})`);
    // Don't return password
    const { password: _, ...userResponse } = user;
    res.json({ success: true, user: userResponse });
});

// Upload file
app.post('/api/upload', (req, res, next) => {
    console.log('--- Incoming Upload Request ---');
    console.log('Headers:', req.headers);
    next();
}, upload.single('file'), (req, res) => {
    console.log('File detected:', req.file ? req.file.originalname : 'NONE');
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { userAddress, userName, fieldName } = req.body;

        if (!userAddress) {
            return res.status(400).json({ error: 'User address required' });
        }

        // Generate CID for the file
        const fileContent = fs.readFileSync(req.file.path);
        const cid = generateCID(fileContent);

        // Store file metadata
        const fileRecord = {
            id: uuidv4(),
            cid,
            originalName: req.file.originalname,
            storedName: req.file.filename,
            fieldName: fieldName || 'Document',
            size: req.file.size,
            mimeType: req.file.mimetype,
            owner: userAddress,
            uploadedAt: new Date().toISOString(),
            path: req.file.path
        };

        db.files[cid] = fileRecord;

        // Add to user's files
        if (!db.users[userAddress]) {
            db.users[userAddress] = { files: [], requests: [], name: userName || `Student ${userAddress.slice(0, 8)}` };
        } else if (userName) {
            db.users[userAddress].name = userName;
        }
        db.users[userAddress].files.push(cid);

        saveDb();

        res.json({
            success: true,
            message: 'File uploaded and encrypted successfully',
            data: {
                cid,
                fieldName: fileRecord.fieldName,
                originalName: fileRecord.originalName,
                size: fileRecord.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get user's files
app.get('/api/files/:userAddress', (req, res) => {
    const { userAddress } = req.params;
    const userFiles = db.users[userAddress]?.files || [];

    const files = userFiles.map(cid => {
        const file = db.files[cid];
        return file ? {
            cid: file.cid,
            fieldName: file.fieldName,
            originalName: file.originalName,
            size: file.size,
            uploadedAt: file.uploadedAt
        } : null;
    }).filter(Boolean);

    res.json({ files });
});

// Create access request
app.post('/api/requests', (req, res) => {
    const { studentAddress, requesterAddress, requesterName, fieldName, durationHours, note } = req.body;

    if (!studentAddress || !requesterAddress || !fieldName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = {
        id: uuidv4(),
        student: studentAddress,
        requester: requesterAddress,
        requesterName: requesterName || 'Organization',
        fieldName,
        note: note || '',
        duration: durationHours * 3600,
        expiryTime: 0,
        isGranted: false,
        isRevoked: false,
        createdAt: new Date().toISOString()
    };

    db.requests.push(request);
    saveDb();

    res.json({ success: true, request });
});

// Get requests for student
app.get('/api/requests/student/:address', (req, res) => {
    const requests = db.requests.filter(r => r.student === req.params.address).map(r => {
        if (r.dataCid) {
            const file = db.files[r.dataCid];
            return { ...r, originalName: file?.originalName, mimeType: file?.mimeType };
        }
        return r;
    });
    res.json({ requests });
});

// Get requests by organization
app.get('/api/requests/org/:address', (req, res) => {
    const requests = db.requests.filter(r => r.requester === req.params.address).map(r => {
        if (r.dataCid) {
            const file = db.files[r.dataCid];
            return { ...r, originalName: file?.originalName, mimeType: file?.mimeType };
        }
        return r;
    });
    res.json({ requests });
});

// Grant consent
app.post('/api/requests/:id/grant', (req, res) => {
    const request = db.requests.find(r => r.id === req.params.id);

    if (!request) {
        console.error(`Grant Error: Request ${req.params.id} not found`);
        return res.status(404).json({ error: 'Request not found' });
    }

    console.log(`Grant Attempt: Student ${request.student} for ${request.fieldName}`);

    // Find a matching file for this student and fieldName
    const studentData = db.users[request.student];
    const studentFiles = studentData?.files || [];

    console.log(`Student Files Count: ${studentFiles.length}`);

    // Use a copy to avoid mutating the original array
    const matchingFileCid = [...studentFiles].reverse().find(cid => {
        const file = db.files[cid];
        const match = file && file.fieldName === request.fieldName;
        if (match) console.log(`Matched File: ${cid} (${file.fieldName})`);
        return match;
    });

    if (matchingFileCid) {
        request.dataCid = matchingFileCid;
    } else {
        console.warn(`No matching file found for student ${request.student} and category ${request.fieldName}`);
        // Log available files for debugging
        studentFiles.forEach(cid => {
            const f = db.files[cid];
            console.log(`- Available File: ${f?.fieldName} (CID: ${cid})`);
        });
    }

    request.isGranted = true;
    request.expiryTime = Date.now() + (request.duration * 1000);
    request.isRevoked = false;
    saveDb();

    res.json({ success: true, request });
});

// Revoke consent
app.post('/api/requests/:id/revoke', (req, res) => {
    const request = db.requests.find(r => r.id === req.params.id);

    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }

    request.isRevoked = true;
    saveDb();

    res.json({ success: true, request });
});

// Get all students (for org dropdown)
app.get('/api/students', (req, res) => {
    // Return users who have uploaded files
    const students = Object.entries(db.users)
        .filter(([_, user]) => user.files?.length > 0)
        .map(([address, user]) => ({
            address,
            name: user.name || `Student ${address.slice(0, 8)}...`
        }));

    // Add demo students if none exist
    if (students.length === 0) {
        students.push(
            { address: '0xstudent1abc123def456', name: 'Alice Johnson' },
            { address: '0xstudent2xyz789ghi012', name: 'Bob Smith' },
            { address: '0xstudent3mno345pqr678', name: 'Carol Williams' }
        );
    }

    res.json({ students });
});

// View/Download file (Secure)
app.get('/api/view/:requestId', (req, res) => {
    const { requestId } = req.params;
    const request = db.requests.find(r => r.id === requestId);

    if (!request) {
        console.error(`View Error: Request ${requestId} not found`);
        return res.status(404).json({ error: 'Access request not found' });
    }

    if (!request.isGranted || request.isRevoked) {
        return res.status(403).json({ error: 'Access not granted or has been revoked' });
    }

    if (request.expiryTime && Date.now() > request.expiryTime) {
        return res.status(403).json({ error: 'Access has expired' });
    }

    const file = db.files[request.dataCid];
    if (!file) {
        console.error(`View Error: Metadata for CID ${request.dataCid} not found`);
        return res.status(404).json({ error: 'File data not found.' });
    }

    // Use path.resolve to ensure we have a clean absolute path for Express
    const filePath = path.resolve(uploadsDir, file.storedName);

    console.log(`--- View Request for ${file.originalName} ---`);
    console.log(`- Stored Name: ${file.storedName}`);
    console.log(`- Path: ${filePath}`);
    console.log(`- MIME Type: ${file.mimeType}`);
    console.log(`- Size: ${file.size} bytes`);

    if (!fs.existsSync(filePath)) {
        console.error(`Physical file missing: ${filePath}`);
        return res.status(404).json({ error: 'Physical file not found on server' });
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    const viewableMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'text/plain', 'text/html', 'text/css', 'application/javascript'
    ];

    // Fallback MIME type check for PDF
    let mimeType = file.mimeType;
    if (file.originalName.toLowerCase().endsWith('.pdf') && mimeType !== 'application/pdf') {
        console.log('- Overriding MIME type to application/pdf based on extension');
        mimeType = 'application/pdf';
    }

    const isBrowserViewable = viewableMimeTypes.includes(mimeType);

    try {
        if (isBrowserViewable) {
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);

            // For PDFs, we'll use a stream to ensure total header control
            if (mimeType === 'application/pdf') {
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', fileSize);
                res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);

                console.log('- Serving PDF via stream');
                const stream = fs.createReadStream(filePath);
                stream.on('error', (err) => {
                    console.error('PDF STREAM ERROR:', err);
                    if (!res.headersSent) res.status(500).send('Error streaming PDF');
                });
                return stream.pipe(res);
            }

            console.log('- Serving image/other inline with sendFile');
            return res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('SERVER SEND_FILE ERROR:', err);
                    if (!res.headersSent) res.status(500).send(`Error viewing file: ${err.message}`);
                }
            });
        } else {
            console.log('- Serving as attachment');
            res.setHeader('Content-Type', mimeType || 'application/octet-stream');
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);

            const filestream = fs.createReadStream(filePath);
            filestream.on('error', (err) => {
                console.error('STREAM ERROR:', err);
                if (!res.headersSent) res.status(500).send(`Stream error: ${err.message}`);
            });
            return filestream.pipe(res);
        }
    } catch (error) {
        console.error('CRITICAL VIEW ROUTE ERROR:', error);
        res.status(500).json({ error: 'Unexpected error', details: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════╗
  ║     SSDC Backend Server Running!              ║
  ║     http://localhost:${PORT}                     ║
  ╚═══════════════════════════════════════════════╝
  `);
});
