import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { FilesService } from '../src/modules/files/files.service';

describe('FilesService (NFR-2: File validation & storage)', () => {
  let service: FilesService;
  const testUploadDir = './test-uploads';

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue(testUploadDir),
    } as unknown as ConfigService;
    service = new FilesService(configService);
  });

  afterAll(() => {
    const dir = path.resolve(process.cwd(), testUploadDir);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('saves an allowed image type successfully', async () => {
    const dummyBuffer = Buffer.from('test image content');
    const result = await service.saveFile('test.jpg', 'image/jpeg', dummyBuffer);

    expect(result.url).toMatch(/^\/uploads\//);
    expect(result.size).toBe(dummyBuffer.length);

    // Verify file actually exists on disk
    const filePath = path.resolve(process.cwd(), testUploadDir, result.filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('rejects forbidden file types with BadRequestException', async () => {
    const dummyBuffer = Buffer.from('executable binary');
    await expect(
      service.saveFile('malicious.exe', 'application/x-msdownload', dummyBuffer),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects files exceeding the 10MB size limit', async () => {
    // 11MB buffer
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    await expect(
      service.saveFile('large.png', 'image/png', largeBuffer),
    ).rejects.toThrow(BadRequestException);
  });
});
