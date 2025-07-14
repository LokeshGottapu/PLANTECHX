const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload a file
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ message: 'File uploaded successfully', file: req.file });
});

// List all files in uploads directory
router.get('/', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.status(500).json({ message: 'Error reading files' });
    res.json({ files });
  });
});

// Download a file
router.get('/:filename', (req, res) => {
  const filePath = path.join('uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
  res.download(filePath);
});

// Delete a file
router.delete('/:filename', (req, res) => {
  const filePath = path.join('uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ message: 'Error deleting file' });
    res.json({ message: 'File deleted successfully' });
  });
});

module.exports = router;
