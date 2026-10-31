import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { FilesService } from '../src/modules/files/files.service';
import { LocalStorageDriver } from '../src/modules/files/storage/local-storage.driver';
import { Role, FileVisibility } from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('FilesService (NFR-2, INV-DM-11: File storage, visibility & access control)', () => {
  let service: FilesService;
  let mockPrisma: any;
  const testUploadDir = './test-uploads';

  const uploaderUser: AuthUser = {
    id: 'user-uploader',
    email: 'uploader@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
  };

  const otherUser: AuthUser = {
    id: 'user-other',
    email: 'other@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
  };

  const adminUser: AuthUser = {
    id: 'user-admin',
    email: 'admin@gsfcuniversity.ac.in',
    role: Role.ADMIN,
    campusId: 'campus-1',
  };

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue(testUploadDir),
    } as unknown as ConfigService;
    const storageDriver = new LocalStorageDriver(configService);

    mockPrisma = {
      file: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'file-uuid-1234',
            ...data,
            createdAt: new Date(),
          }),
        ),
        findUnique: jest.fn(),
      },
    };

    service = new FilesService(mockPrisma, storageDriver, configService);
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const dir = path.resolve(process.cwd(), testUploadDir);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('saves an allowed image type successfully and returns /api/v1/files/<id>', async () => {
    const dummyBuffer = Buffer.from('test image content');
    const result = await service.saveFile(
      'test.jpg',
      'image/jpeg',
      dummyBuffer,
      uploaderUser,
      'item_image',
    );

    expect(result.url).toBe('/api/v1/files/file-uuid-1234');
    expect(result.size).toBe(dummyBuffer.length);
    expect(result.visibility).toBe(FileVisibility.AUTHENTICATED);

    // Verify file actually exists on disk
    const filePath = path.resolve(process.cwd(), testUploadDir, result.storageKey);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('sets visibility to PRIVATE when uploaded in claim document / proof context', async () => {
    const dummyBuffer = Buffer.from('invoice proof content');
    const result = await service.saveFile(
      'receipt.pdf',
      'application/pdf',
      dummyBuffer,
      uploaderUser,
      'claim_document',
    );

    expect(result.visibility).toBe(FileVisibility.PRIVATE);
    expect(mockPrisma.file.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          visibility: FileVisibility.PRIVATE,
          uploadedById: uploaderUser.id,
        }),
      }),
    );
  });

  it('rejects forbidden file types with BadRequestException', async () => {
    const dummyBuffer = Buffer.from('executable binary');
    await expect(
      service.saveFile('malicious.exe', 'application/x-msdownload', dummyBuffer, uploaderUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects files exceeding the 10MB size limit', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    await expect(
      service.saveFile('large.png', 'image/png', largeBuffer, uploaderUser),
    ).rejects.toThrow(BadRequestException);
  });

  describe('INV-DM-11 Access Control (getFileStream)', () => {
    it('allows any authenticated user to stream an AUTHENTICATED file (e.g. item image)', async () => {
      const dummyBuffer = Buffer.from('public image bytes');
      const saveResult = await service.saveFile(
        'photo.jpg',
        'image/jpeg',
        dummyBuffer,
        uploaderUser,
        'item_image',
      );

      mockPrisma.file.findUnique.mockResolvedValue({
        id: saveResult.id,
        storageKey: saveResult.storageKey,
        mimeType: 'image/jpeg',
        sizeBytes: dummyBuffer.length,
        visibility: FileVisibility.AUTHENTICATED,
        uploadedById: uploaderUser.id,
      });

      const { file, stream } = await service.getFileStream(otherUser, saveResult.id);
      expect(file.id).toBe(saveResult.id);
      expect(stream).toBeDefined();
      stream.destroy();
    });

    it('allows the uploader to stream their own PRIVATE file (claim proof)', async () => {
      const dummyBuffer = Buffer.from('private document');
      const saveResult = await service.saveFile(
        'bill.pdf',
        'application/pdf',
        dummyBuffer,
        uploaderUser,
        'claim_document',
      );

      mockPrisma.file.findUnique.mockResolvedValue({
        id: saveResult.id,
        storageKey: saveResult.storageKey,
        mimeType: 'application/pdf',
        sizeBytes: dummyBuffer.length,
        visibility: FileVisibility.PRIVATE,
        uploadedById: uploaderUser.id,
      });

      const { file, stream } = await service.getFileStream(uploaderUser, saveResult.id);
      expect(file.id).toBe(saveResult.id);
      expect(stream).toBeDefined();
      stream.destroy();
    });

    it('allows an ADMIN to stream any PRIVATE file', async () => {
      const dummyBuffer = Buffer.from('private document');
      const saveResult = await service.saveFile(
        'bill.pdf',
        'application/pdf',
        dummyBuffer,
        uploaderUser,
        'claim_document',
      );

      mockPrisma.file.findUnique.mockResolvedValue({
        id: saveResult.id,
        storageKey: saveResult.storageKey,
        mimeType: 'application/pdf',
        sizeBytes: dummyBuffer.length,
        visibility: FileVisibility.PRIVATE,
        uploadedById: uploaderUser.id,
      });

      const { file, stream } = await service.getFileStream(adminUser, saveResult.id);
      expect(file.id).toBe(saveResult.id);
      expect(stream).toBeDefined();
      stream.destroy();
    });

    it('denies another student from streaming a PRIVATE file with 403 Forbidden (INV-DM-11)', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'private-doc-1',
        storageKey: 'private-doc-1.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 500,
        visibility: FileVisibility.PRIVATE,
        uploadedById: uploaderUser.id,
      });

      await expect(
        service.getFileStream(otherUser, 'private-doc-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the file does not exist in the database', async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);

      await expect(
        service.getFileStream(uploaderUser, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
