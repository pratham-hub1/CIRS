import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('PrismaService (REV-7: Fail-fast startup)', () => {
  it('throws on onModuleInit if $connect fails', async () => {
    const service = new PrismaService();
    const connectError = new Error('Database connection refused');
    jest.spyOn(service, '$connect').mockRejectedValueOnce(connectError);

    await expect(service.onModuleInit()).rejects.toThrow('Database connection refused');
  });

  it('succeeds on onModuleInit if $connect succeeds', async () => {
    const service = new PrismaService();
    jest.spyOn(service, '$connect').mockResolvedValueOnce(undefined as never);

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
