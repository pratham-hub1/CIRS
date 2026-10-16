import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, UserStatus } from '../../domain/enums';
import { JwtPayload } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tenancyService: TenancyService,
  ) {}

  /**
   * FR-4: Enforce university email restriction.
   */
  validateUniversityEmail(email: string): void {
    const allowedDomains = this.configService.get<string[]>('universityEmailDomains') || [
      'gsfcuniversity.ac.in',
    ];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      throw new BadRequestException(
        `Email domain '${emailDomain}' is not permitted. Only university domains are allowed: ${allowedDomains.join(
          ', ',
        )}`,
      );
    }
  }

  /**
   * Hash a raw secret using SHA-256 for fast indexed/deterministic comparison,
   * while passwords strictly use argon2id.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * FR-4: Register a new user with university email.
   */
  async register(dto: RegisterDto) {
    this.validateUniversityEmail(dto.email);

    // Validate campus and optional department
    await this.tenancyService.validateCampus(dto.campusId);
    if (dto.departmentId) {
      await this.tenancyService.validateDepartment(dto.campusId, dto.departmentId);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash password with argon2id (NFR-2, 02-tech-stack.md)
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        role: dto.role || Role.STUDENT,
        campusId: dto.campusId,
        departmentId: dto.departmentId || null,
        status: UserStatus.ACTIVE,
        notificationPreference: {
          create: {
            emailEnabled: true,
            digestEnabled: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
        departmentId: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * FR-1: Authenticate user with university credentials.
   */
  async login(dto: LoginDto) {
    this.validateUniversityEmail(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      // Generic failure to prevent user enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('Account has been disabled');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Issue tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    const expiresIn = this.configService.get<number>('jwt.accessExpiration') || 900;

    return {
      accessToken,
      expiresIn,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        campusId: user.campusId,
      },
    };
  }

  /**
   * FR-5, INT-10: Refresh token rotation with atomic reuse detection.
   */
  async refresh(rawRefreshToken?: string) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const parts = rawRefreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Malformed refresh token');
    }

    const [tokenId, secret] = parts;
    const tokenHash = this.hashToken(secret);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // INT-10(c): If presented token has already been revoked or replaced, REPLAY ATTACK DETECTED!
    // Revoke the entire token family immediately.
    if (storedToken.revokedAt !== null || storedToken.tokenHash !== tokenHash) {
      this.logger.warn(
        `INT-10 Replay attack detected for familyId: ${storedToken.familyId}. Revoking all family tokens.`,
      );
      await this.prisma.refreshToken.updateMany({
        where: {
          familyId: storedToken.familyId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
      throw new UnauthorizedException('Token reuse detected. All sessions in family revoked.');
    }

    // Check expiration
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Check user status
    if (storedToken.user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('User account is disabled');
    }

    // INT-10(a): Atomic rotation in one transaction
    const newSecret = crypto.randomBytes(32).toString('hex');
    const newHash = this.hashToken(newSecret);
    const refreshExpiration =
      this.configService.get<number>('jwt.refreshExpiration') || 604800;
    const newExpiresAt = new Date(Date.now() + refreshExpiration * 1000);

    const { successorToken, updateResult } = await this.prisma.$transaction(async (tx) => {
      // 1. Create successor token
      const successor = await tx.refreshToken.create({
        data: {
          userId: storedToken.userId,
          familyId: storedToken.familyId,
          tokenHash: newHash,
          expiresAt: newExpiresAt,
        },
      });

      // 2. Conditionally update current token: only if revokedAt is still null
      const update = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          replacedById: successor.id,
        },
      });

      return { successorToken: successor, updateResult: update };
    });

    // If update affected 0 rows, another concurrent request consumed it!
    if (updateResult.count === 0) {
      // Revoke family
      await this.prisma.refreshToken.updateMany({
        where: {
          familyId: storedToken.familyId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
      throw new UnauthorizedException('Concurrent token refresh detected. Family revoked.');
    }

    const newRawRefreshToken = `${successorToken.id}.${newSecret}`;
    const accessToken = await this.generateAccessToken(storedToken.user);
    const expiresIn = this.configService.get<number>('jwt.accessExpiration') || 900;

    return {
      accessToken,
      expiresIn,
      refreshToken: newRawRefreshToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        role: storedToken.user.role,
        campusId: storedToken.user.campusId,
      },
    };
  }

  /**
   * FR-2: End session and revoke tokens.
   */
  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken && rawRefreshToken.includes('.')) {
      const [tokenId] = rawRefreshToken.split('.');
      const token = await this.prisma.refreshToken.findUnique({
        where: { id: tokenId },
      });
      if (token) {
        // Revoke entire family
        await this.prisma.refreshToken.updateMany({
          where: {
            familyId: token.familyId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
        return { message: 'Logged out successfully' };
      }
    }

    // Fallback: revoke all active tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Logged out successfully' };
  }

  private async generateAccessToken(user: {
    id: string;
    email: string;
    role: Role;
    campusId: string;
    departmentId?: string | null;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
      departmentId: user.departmentId,
      jti: crypto.randomUUID(),
    };

    const secret = this.configService.get<string>('jwt.accessSecret');
    const expiresIn = this.configService.get<number>('jwt.accessExpiration') || 900;

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: `${expiresIn}s`,
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const secret = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(secret);
    const familyId = crypto.randomUUID();
    const refreshExpiration =
      this.configService.get<number>('jwt.refreshExpiration') || 604800;
    const expiresAt = new Date(Date.now() + refreshExpiration * 1000);

    const token = await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash,
        expiresAt,
      },
    });

    return `${token.id}.${secret}`;
  }
}
