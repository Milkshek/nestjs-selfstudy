import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class ArticleImagesService {
  private readonly logger = new Logger(ArticleImagesService.name);
  private readonly directory = resolve('uploads/articles');

  getValidatedExtension(file: Express.Multer.File): string | null {
    const extension = imageExtensions[file.mimetype];

    return extension && this.matchesMimeType(file.buffer, file.mimetype) ? extension : null;
  }

  async store(file: Express.Multer.File, extension: string): Promise<string> {
    await mkdir(this.directory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(resolve(this.directory, filename), file.buffer);

    return `/uploads/articles/${filename}`;
  }

  async remove(imagePath: string | null): Promise<void> {
    if (!imagePath?.startsWith('/uploads/articles/')) {
      return;
    }

    try {
      await rm(resolve(this.directory, basename(imagePath)), { force: true });
    } catch (error) {
      this.logger.warn(`Unable to remove article image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private matchesMimeType(buffer: Buffer, mimeType: string): boolean {
    switch (mimeType) {
      case 'image/png':
        return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case 'image/jpeg':
        return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      case 'image/webp':
        return buffer.length >= 12
          && buffer.subarray(0, 4).equals(Buffer.from('RIFF'))
          && buffer.subarray(8, 12).equals(Buffer.from('WEBP'));
      default:
        return false;
    }
  }
}
