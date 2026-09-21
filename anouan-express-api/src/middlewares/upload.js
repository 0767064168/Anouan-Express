// src/middlewares/upload.js
// Gestion des uploads de fichiers avec Multer

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const { AppError } = require('./errorHandler');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];

/**
 * Crée le répertoire de destination s'il n'existe pas
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Crée un storage Multer pour un sous-dossier donné
 */
const createStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(env.upload.dir, subfolder);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });

/**
 * Filtre pour n'accepter que les images
 */
const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Format de fichier non accepté. Utilisez JPEG, PNG ou WebP.', 400, 'INVALID_FILE_TYPE'));
  }
};

/**
 * Filtre pour les documents (PDF + images)
 */
const docFilter = (req, file, cb) => {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Format de fichier non accepté. Utilisez PDF, JPEG ou PNG.', 400, 'INVALID_FILE_TYPE'));
  }
};

const maxSizeBytes = env.upload.maxSizeMb * 1024 * 1024;

/**
 * Upload d'images produits (max 5 images, 5 Mo chacune)
 */
const uploadProductImages = multer({
  storage: createStorage('products'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 5 },
}).array('images', 5);

/**
 * Upload d'avatar utilisateur (1 image)
 */
const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 1 },
}).single('avatar');

/**
 * Upload d'image de bannière (1 image)
 */
const uploadBanner = multer({
  storage: createStorage('banners'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 1 },
}).single('image');

/**
 * Upload de document légal vendeur (PDF ou image)
 */
const uploadLegalDoc = multer({
  storage: createStorage('legal'),
  fileFilter: docFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('legal_doc');

/**
 * Upload d'images d'avis clients (max 3 images)
 */
const uploadReviewImages = multer({
  storage: createStorage('reviews'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 3 },
}).array('images', 3);

/**
 * Upload d'images de réclamations / litiges (max 3 images)
 */
const uploadDisputeImages = multer({
  storage: createStorage('disputes'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 3 },
}).array('images', 3);

const uploadMessageAttachment = multer({
  storage: createStorage('messages'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSizeBytes, files: 1 },
}).single('attachment');

/**
 * Wrapper pour transformer les erreurs Multer en AppError
 */
const handleMulterError = (uploader) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`Fichier trop volumineux (max ${env.upload.maxSizeMb} Mo).`, 400, 'FILE_TOO_LARGE'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Trop de fichiers.', 400, 'TOO_MANY_FILES'));
    }
    return next(err);
  });
};

module.exports = {
  uploadProductImages: handleMulterError(uploadProductImages),
  uploadAvatar: handleMulterError(uploadAvatar),
  uploadBanner: handleMulterError(uploadBanner),
  uploadLegalDoc: handleMulterError(uploadLegalDoc),
  uploadReviewImages: handleMulterError(uploadReviewImages),
  uploadDisputeImages: handleMulterError(uploadDisputeImages),
  uploadMessageAttachment: handleMulterError(uploadMessageAttachment),
};
