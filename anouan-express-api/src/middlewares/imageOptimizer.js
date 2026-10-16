// src/middlewares/imageOptimizer.js
// Optimisation d'image serveur via Sharp pour Anouan Express

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Middleware qui optimise une image uploadée par Multer
 */
const optimizeUploadedImage = async (req, res, next) => {
  if (!req.file?.path) return next();

  try {
    const originalPath = req.file.path;
    const dir = path.dirname(originalPath);
    const filename = path.parse(req.file.filename).name;
    const optimizedFilename = `${filename}-opt.webp`;
    const optimizedPath = path.join(dir, optimizedFilename);

    await sharp(originalPath)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(optimizedPath);

    // Supprimer l'original non optimisé pour économiser l'espace disque
    try {
      fs.unlinkSync(originalPath);
    } catch (e) {}

    req.file.path = optimizedPath;
    req.file.filename = optimizedFilename;
    req.file.mimetype = 'image/webp';

    next();
  } catch (err) {
    console.warn('[Sharp] Avertissement optimisation image :', err.message);
    // Si sharp échoue (ex: format non supporté), on laisse passer le fichier original
    next();
  }
};

module.exports = { optimizeUploadedImage };
