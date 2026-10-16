import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.resolve(
      process.cwd(),
      this.configService.get<string>('storage.uploadDir', './uploads'),
    );
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(
    filename: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<{ url: string; filename: string; size: number }> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid file type '${mimeType}'. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds 10MB limit (provided: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`,
      );
    }

    const ext = path.extname(filename) || this.getExtensionFromMime(mimeType);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(destinationPath, buffer);

    this.logger.log(`Saved file: ${uniqueName} (${buffer.length} bytes)`);

    return {
      url: `/uploads/${uniqueName}`,
      filename: uniqueName,
      size: buffer.length,
    };
  }

  private getExtensionFromMime(mimeType: string): string {
    switch (mimeType.toLowerCase()) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      case 'application/pdf':
        return '.pdf';
      default:
        return '.bin';
    }
  }
}
