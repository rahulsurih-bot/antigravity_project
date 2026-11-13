import multer from 'multer';
import { env } from '../config/env.js';

const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

function fileFilter(req, file, cb) {
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error('Unsupported file format. Please upload JPG, PNG, or WEBP agricultural plant photographs.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  cb(null, true);
}

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: env.MAX_IMAGE_SIZE_MB * 1024 * 1024, // 8MB
    files: 1
  },
  fileFilter
});
