import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { applyCampusScope } from '../../common/repositories/scoped.repository';

@Injectable()
export class TenancyService {
  constructor(private readonly prisma: PrismaService) {}

  applyCampusScope<T extends Record<string, any>>(
    campusId: string,
    where: T = {} as T,
  ): T & { campusId: string } {
    return applyCampusScope(campusId, where);
  }

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

  async getPublicCampuses() {
    const campuses = await this.prisma.campus.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return { data: campuses };
  }
}
