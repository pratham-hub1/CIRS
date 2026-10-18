import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenancyService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCampus(campusId: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });
    if (!campus) {
      throw new BadRequestException(
        `Validation failed: Campus with ID '${campusId}' does not exist. Please provide a valid registered campusId.`,
      );
    }
    return campus;
  }

  async validateDepartment(campusId: string, departmentId: string) {
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        campusId,
      },
    });
    if (!department) {
      throw new BadRequestException(
        `Validation failed: Department with ID '${departmentId}' does not belong to campus '${campusId}'.`,
      );
    }
    return department;
  }

  assertCampusAccess(userCampusId: string, targetCampusId: string) {
    if (userCampusId !== targetCampusId) {
      throw new ForbiddenException(
        'Tenancy violation: Cross-campus access is forbidden',
      );
    }
  }
}
