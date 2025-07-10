const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadStudyMaterial, getUploadedMaterials, deleteMaterial } = require('../controllers/fileUploadController');
const { updateFileMetadata } = require('../controllers/fileController');

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Make sure the uploads folder exists
        try {
            if (!file || !file.originalname) {
                throw new Error('No file provided');
            }

            cb(null, 'uploads/');
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        try {
            if (!file || !file.originalname) {
                throw new Error('No file provided');
            }

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        } catch (error) {
            cb(error);
        }
    }
});

// File filter (optional – only allow PDFs, MP4, JPG, etc.)
const fileFilter = (req, file, cb) => {
    try {
        if (!file || !file.originalname) {
            throw new Error('No file provided');
        }

        const allowedTypes = /pdf|mp4|jpeg|jpg|png/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (!extName) {
            throw new Error('Only PDF, MP4, JPG, and PNG files are allowed');
        }

        cb(null, true);
    } catch (error) {
        cb(error);
    }
};

const upload = multer({ storage: storage, fileFilter });

// Route to upload a file
router.post('/upload', upload.single('file'), uploadStudyMaterial);

// Route to get all uploaded materials
router.get('/materials', getUploadedMaterials);

// Route to delete a specific material
router.delete('/materials/:materialId', deleteMaterial);

// Route to update/rename a file (metadata)
router.put('/materials/:materialId', updateFileMetadata);

module.exports = router;
