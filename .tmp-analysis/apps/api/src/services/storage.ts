import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), '../../uploads');

export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function getUploadPath(filename: string): string {
  ensureUploadsDir();
  return path.join(UPLOADS_DIR, filename);
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}
