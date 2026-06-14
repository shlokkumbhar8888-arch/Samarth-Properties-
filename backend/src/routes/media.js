// ============================================================
// SAMARTH PROPERTIES — Media Upload Routes
// File: backend/src/routes/media.js
// ============================================================

const express = require('express');
const multer = require('multer');
const { param } = require('express-validator');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { adminOrAbove } = require('../middleware/role.middleware');
const { uploadLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');
const { MAX_FILE_SIZE } = require('../config/constants');

const { uploadMedia, listMedia, updateMedia, deleteMedia } = require('../controllers/media.controller');

// ── Multer — store in memory so Sharp can process the buffer ──
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'video/mp4', 'video/webm', 'video/ogg',
    ];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
});

// ── Multer error handler ──────────────────────────────────────
function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
            });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
        return res.status(415).json({ success: false, message: err.message });
    }
    next();
}

// ── All media routes require JWT ──────────────────────────────
router.use(verifyToken);
router.use(adminOrAbove);

// ── GET /api/media — List media library ───────────────────────
router.get('/', listMedia);

// ── POST /api/media/upload — Upload a file ────────────────────
router.post(
    '/upload',
    uploadLimiter,
    upload.single('file'),
    handleMulterError,
    auditMiddleware('UPLOAD', 'media_library'),
    uploadMedia
);

// ── PATCH /api/media/:id — Update alt text / tags ─────────────
router.patch('/:id', [param('id').isUUID(), validate], updateMedia);

// ── DELETE /api/media/:id — Delete file from storage + DB ─────
router.delete(
    '/:id',
    [param('id').isUUID(), validate],
    auditMiddleware('DELETE', 'media_library'),
    deleteMedia
);

module.exports = router;
