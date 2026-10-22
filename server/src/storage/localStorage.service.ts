import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageService, SavedFile } from './storage.interface.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.UPLOAD_DIR, 'selfies');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveImage(base64Data: string, prefix = 'selfie'): Promise<SavedFile> {
    const matches = base64Data.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid image payload. Must be a valid JPEG, PNG, or WebP base64 image data URI.');
    }

    const mimeType = matches[1];
    const extension = matches[2] === 'jpeg' ? 'jpg' : matches[2];
    const base64String = matches[3];
    const buffer = Buffer.from(base64String, 'base64');

    const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (buffer.length > maxBytes) {
      throw new Error(`Selfie file exceeds maximum allowed size of ${env.MAX_FILE_SIZE_MB}MB.`);
    }

    if (buffer.length < 50) {
      throw new Error('Image file is corrupted or too small.');
    }

    const randomSuffix = crypto.randomBytes(16).toString('hex');
    const filename = `${prefix}_${Date.now()}_${randomSuffix}.${extension}`;
    const filePath = path.join(this.baseDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    logger.debug(`Saved selfie securely to local storage: ${filename}`);

    return {
      storageKey: filename,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  getFilePath(storageKey: string): string | null {
    // Prevent directory traversal
    const safeKey = path.basename(storageKey);
    const fullPath = path.join(this.baseDir, safeKey);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fullPath;
  }

  getFileStream(storageKey: string): NodeJS.ReadableStream | null {
    const filePath = this.getFilePath(storageKey);
    if (!filePath) return null;
    return fs.createReadStream(filePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const filePath = this.getFilePath(storageKey);
    if (!filePath) return false;
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new LocalStorageService();
