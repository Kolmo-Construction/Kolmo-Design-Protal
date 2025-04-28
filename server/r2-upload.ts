// server/r2-upload.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from 'crypto';
import path from 'path';

// --- R2 Configuration ---
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, ''); // Remove trailing slash if exists

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.warn(
    "WARNING: R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) are not fully set. File uploads will fail."
  );
}

const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const R2 = new S3Client({
  region: "auto", // R2 specific region
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

/**
 * Uploads a file buffer to Cloudflare R2 within a project-specific folder.
 * @param projectId The ID of the project to store the file under.
 * @param fileBuffer The file content buffer.
 * @param originalFilename The original name of the file.
 * @param mimeType The MIME type of the file.
 * @returns The public URL of the uploaded file in R2.
 * @throws Error if R2 is not configured or upload fails.
 */
/**
 * Interface for uploadToR2 function parameters
 */
export interface UploadToR2Params {
  projectId: number;
  fileName: string;
  buffer: Buffer;
  mimetype: string;
}

/**
 * Interface for uploadToR2 function result
 */
export interface UploadToR2Result {
  key: string;
  url?: string;
}

/**
 * Uploads a file buffer to Cloudflare R2 within a project-specific folder.
 * @param params Object containing upload parameters: projectId, fileName, buffer, and mimetype
 * @returns Object containing key and url for the uploaded file
 * @throws Error if R2 is not configured or upload fails.
 */
export async function uploadToR2(params: UploadToR2Params): Promise<UploadToR2Result> {
  const { projectId, fileName, buffer, mimetype } = params;
  
  if (!bucketName || !accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured.");
  }

  // Construct the destination path using projectId
  const destinationPath = `projects/${projectId}/documents/`;

  // Generate a unique filename to avoid collisions but keep original extension
  const uniqueSuffix = randomBytes(16).toString('hex');
  const fileExtension = path.extname(fileName);
  const baseName = path.basename(fileName, fileExtension);
  // Sanitize baseName slightly - replace spaces and keep it reasonably short
  const sanitizedBaseName = baseName.replace(/\s+/g, '_').substring(0, 50);
  const uniqueFilename = `${sanitizedBaseName}-${uniqueSuffix}${fileExtension}`;

  // Construct the full key including the project path
  const key = `${destinationPath}${uniqueFilename}`;

  console.log(`Attempting to upload to R2: Bucket=${bucketName}, Key=${key}, Type=${mimetype}`);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    // Consider adding CacheControl for browser caching
    // CacheControl: 'public, max-age=31536000, immutable',
  });

  try {
    await R2.send(command);

    // Construct the public URL
    let url: string;
    if (r2PublicUrl) {
      // Use the custom/public domain if provided
      url = `${r2PublicUrl}/${key}`;
    } else {
      // Fallback to standard S3-compatible URL structure (may not work if bucket isn't public)
      console.warn("R2_PUBLIC_URL not set, constructing potentially non-public URL.");
      url = `${r2Endpoint}/${bucketName}/${key}`; // Less reliable, depends on bucket settings
    }

    console.log(`Successfully uploaded ${fileName} to ${url}`);
    return { key, url };
  } catch (error) {
    console.error(`Error uploading to R2 (Bucket: ${bucketName}, Key: ${key}):`, error);
    // Log more details from the error if available
    if (error instanceof Error) {
        console.error("AWS SDK Error Name:", (error as any).name);
        console.error("AWS SDK Error Message:", error.message);
        console.error("AWS SDK Error Stack:", error.stack);
    }
    throw new Error("Failed to upload file to R2 storage.");
  }
}

/**
 * Deletes a file from Cloudflare R2 storage.
 * @param key The storage key of the file to delete
 * @throws Error if R2 is not configured or deletion fails
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!bucketName || !accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured.");
  }

  console.log(`Attempting to delete from R2: Bucket=${bucketName}, Key=${key}`);

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    await R2.send(command);
    console.log(`Successfully deleted ${key} from R2`);
  } catch (error) {
    console.error(`Error deleting from R2 (Bucket: ${bucketName}, Key: ${key}):`, error);
    if (error instanceof Error) {
      console.error("AWS SDK Error Name:", (error as any).name);
      console.error("AWS SDK Error Message:", error.message);
      console.error("AWS SDK Error Stack:", error.stack);
    }
    throw new Error("Failed to delete file from R2 storage.");
  }
}

/**
 * Generates a download URL for a file in Cloudflare R2.
 * @param key The storage key of the file
 * @param originalFileName The original file name to use in Content-Disposition
 * @returns A download URL for the file
 * @throws Error if R2 is not configured or URL generation fails
 */
export async function getR2DownloadUrl(key: string, originalFileName: string): Promise<string> {
  if (!bucketName || !accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured.");
  }

  // For public buckets, we can just return the direct URL
  if (r2PublicUrl) {
    return `${r2PublicUrl}/${key}`;
  }

  // In a real implementation with private buckets, we'd generate a pre-signed URL here
  // This would require the @aws-sdk/s3-request-presigner package
  console.warn("Pre-signed URL generation not implemented; returning direct URL (may not work if bucket is private)");
  return `${r2Endpoint}/${bucketName}/${key}`;
}

/**
 * Original function kept for backward compatibility
 * @deprecated Use the new uploadToR2 function with params object instead
 */
export async function _uploadToR2(
  projectId: number,
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<string> {
  if (!bucketName || !accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured.");
  }

  // Construct the destination path using projectId
  const destinationPath = `projects/${projectId}/documents/`;

  // Generate a unique filename to avoid collisions but keep original extension
  const uniqueSuffix = randomBytes(16).toString('hex');
  const fileExtension = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, fileExtension);
  // Sanitize baseName slightly - replace spaces and keep it reasonably short
  const sanitizedBaseName = baseName.replace(/\s+/g, '_').substring(0, 50);
  const uniqueFilename = `${sanitizedBaseName}-${uniqueSuffix}${fileExtension}`;

  // Construct the full key including the project path
  const key = `${destinationPath}${uniqueFilename}`;

  console.log(`Attempting to upload to R2: Bucket=${bucketName}, Key=${key}, Type=${mimeType}`);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    // Consider adding CacheControl for browser caching
    // CacheControl: 'public, max-age=31536000, immutable',
  });

  try {
    await R2.send(command);

    // Construct the public URL
    let fileUrl: string;
    if (r2PublicUrl) {
      // Use the custom/public domain if provided
      fileUrl = `${r2PublicUrl}/${key}`;
    } else {
      // Fallback to standard S3-compatible URL structure (may not work if bucket isn't public)
      console.warn("R2_PUBLIC_URL not set, constructing potentially non-public URL.");
      fileUrl = `${r2Endpoint}/${bucketName}/${key}`; // Less reliable, depends on bucket settings
    }

    console.log(`Successfully uploaded ${originalFilename} to ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error(`Error uploading to R2 (Bucket: ${bucketName}, Key: ${key}):`, error);
    // Log more details from the error if available
    if (error instanceof Error) {
        console.error("AWS SDK Error Name:", (error as any).name);
        console.error("AWS SDK Error Message:", error.message);
        console.error("AWS SDK Error Stack:", error.stack);
    }
    throw new Error("Failed to upload file to R2 storage.");
  }
}