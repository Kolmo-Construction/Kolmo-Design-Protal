import { Router } from 'express';
import multer from 'multer';
import { uploadToR2, deleteFromR2, getR2DownloadUrl } from '../r2-upload';
import { isAuthenticated } from '../middleware/auth.middleware';
import { HttpError, createBadRequestError, createNotFoundError } from '../errors';

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export const storageRoutes = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'));
    }
  },
});

/**
 * Get a signed URL for an image in R2 storage
 */
storageRoutes.get('/image/:key', isAuthenticated, async (req, res, next) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      throw createBadRequestError('Image key is required');
    }

    const signedUrl = await getR2DownloadUrl(key);
    res.json({ url: signedUrl });
  } catch (error) {
    next(error);
  }
});

/**
 * Proxy image from R2 storage to avoid CORS issues
 * This function handles fetching images from R2 with extensive fallbacks
 * No authentication required for public image access
 */
storageRoutes.get('/proxy/:key(*)', async (req, res, next) => {
  try {
    let key = req.params.key;
    
    if (!key || key.trim() === '') {
      console.log('Storage proxy error: Empty key received');
      console.log('Full URL:', req.originalUrl);
      console.log('Params:', req.params);
      // Return a 204 No Content instead of error for empty keys to avoid console spam
      return res.status(204).end();
    }

    // Decode the URL-encoded key
    key = decodeURIComponent(key);

    // Get signed URL and fetch the image
    const signedUrl = await getR2DownloadUrl(key);
    
    // Fetch the image from R2
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      throw createNotFoundError('Image not found');
    }

    // Set appropriate headers
    const contentType = getContentType(key);
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // 1 hour cache
    });

    // Stream the image data
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
});

/**
 * Check if a file exists in R2 storage
 */
storageRoutes.head('/check/:key(*)', isAuthenticated, async (req, res, next) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      throw createBadRequestError('Image key is required');
    }

    const signedUrl = await getR2DownloadUrl(key);
    const response = await fetch(signedUrl, { method: 'HEAD' });
    
    if (response.ok) {
      res.status(200).end();
    } else {
      res.status(404).end();
    }
  } catch (error) {
    res.status(404).end();
  }
});







/**
 * List all objects in R2 storage
 */
storageRoutes.get('/list', isAuthenticated, async (req, res, next) => {
  try {
    // This would require additional S3 ListObjects implementation
    // For now, return empty list as this feature isn't critical
    res.json({ objects: [] });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a file from R2 storage
 */
storageRoutes.delete('/delete/:key(*)', isAuthenticated, async (req, res, next) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      throw createBadRequestError('File key is required');
    }

    await deleteFromR2(key);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});