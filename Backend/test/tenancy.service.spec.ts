import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';

describe('TenancyService (FR-35, INT-6, INV-DM-7)', () => {
  let service: TenancyService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      campus: {
        findUnique: jest.fn(),
      },
      department: {
        findFirst: jest.fn(),
      },
    };
    service = new TenancyService(prisma);
  });

  it('validates existing campus successfully', async () => {
    prisma.campus.findUnique.mockResolvedValue({ id: 'campus-1', name: 'Main Campus' });
    const result = await service.validateCampus('campus-1');
    expect(result.id).toBe('campus-1');
  });

  it('throws BadRequestException when campus does not exist', async () => {
    prisma.campus.findUnique.mockResolvedValue(null);
    await expect(service.validateCampus('campus-unknown')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('validates department within the specified campus', async () => {
    prisma.department.findFirst.mockResolvedValue({
      id: 'dept-1',
      campusId: 'campus-1',
      name: 'Computer Science',
    });

    const result = await service.validateDepartment('campus-1', 'dept-1');
    expect(result.id).toBe('dept-1');
  });

  it('throws BadRequestException if department does not belong to the campus', async () => {
    prisma.department.findFirst.mockResolvedValue(null);
    await expect(
      service.validateDepartment('campus-1', 'dept-wrong'),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows same-campus access assertion', () => {
    expect(() =>
      service.assertCampusAccess('campus-1', 'campus-1'),
    ).not.toThrow();
  });

  it('throws ForbiddenException on cross-campus access assertion (INT-6)', () => {
    expect(() =>
      service.assertCampusAccess('campus-1', 'campus-2'),
    ).toThrow(ForbiddenException);
  });
});
