const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { notifyUpload } = require('./telegramBot'); // Assuming it's in the same 'routes' folder
const { addJob } = require('./sql_base');

const storageDir = path.join(__dirname, '..', 'storage');
const metadataDir = path.join(__dirname, '..', 'metadata');
const queuePath = path.join(__dirname, '..', 'storage', 'queue.json');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storageDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ 
	storage,
	limits: { fileSize: 100 * 1024 * 1024} // 100 MB
});

router.post('/', upload.single('file'), (req, res) => {
  const id = uuidv4();
  const fileData = {
    id,
    filename: req.file.filename,
    original_name: req.file.originalname,
    file_size_mb: (req.file.size / 1_000_000).toFixed(1),
    printer: req.body.printer,
    material: req.body.material,
    infill: req.body.infill,
    infill_type: req.body.infill_type,
    supports: !!req.body.supports,
    perimeters: parseInt(req.body.perimeters || 2),
    description: req.body.description || '',
    status: 'queued',
    created_at: new Date().toISOString()
  };

  // Save metadata
  const metadataFile = path.join(metadataDir, `${id}.json`);
  fs.writeFileSync(metadataFile, JSON.stringify(fileData, null, 2));

  // Save to database
  addJob(fileData, (err) => {
    if (err) {
      console.error('❌ Failed to add job to database:', err.message);
      return res.status(500).json({ error: 'Failed to add job' });
    }
    res.status(201).json({ message: 'Uploaded', id });
  });

  // ✅ Notify Telegram bot
  notifyUpload(fileData);
});

router.use((req, res, next) => {
  console.log(`📡 [upload.js] ${req.method} ${req.originalUrl}`);
  next();
});

module.exports = router;
