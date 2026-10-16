export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    accessExpiration: number;
    refreshSecret: string;
    refreshExpiration: number;
  };
  universityEmailDomains: string[];
  storage: {
    driver: string;
    uploadDir: string;
  };
  email: {
    enabled: boolean;
  };
  policy: {
    retentionWindowDays: number;
    rateLimitTtl: number;
    rateLimitMax: number;
    categoryVerificationOverrides?: Record<string, string>;
  };
}

export const configuration = (): AppConfig => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  if (!accessSecret || accessSecret.trim().length < 32) {
    throw new Error(
      'Fatal configuration error: JWT_ACCESS_SECRET environment variable is missing or weak (must be at least 32 characters). No hardcoded fallback is permitted.',
    );
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret || refreshSecret.trim().length < 32) {
    throw new Error(
      'Fatal configuration error: JWT_REFRESH_SECRET environment variable is missing or weak (must be at least 32 characters). No hardcoded fallback is permitted.',
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error(
      'Fatal configuration error: DATABASE_URL environment variable is missing. No hardcoded fallback is permitted for credentials.',
    );
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    databaseUrl,
    jwt: {
      accessSecret,
      accessExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION || '900', 10),
      refreshSecret,
      refreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800', 10),
    },
    universityEmailDomains: (process.env.UNIVERSITY_EMAIL_DOMAINS || 'gsfcuniversity.ac.in')
      .split(',')
      .map((d) => d.trim().toLowerCase()),
    storage: {
      driver: process.env.STORAGE_DRIVER || 'local',
      uploadDir: process.env.UPLOAD_DIR || './uploads',
    },
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
    },
    policy: {
      retentionWindowDays: parseInt(process.env.RETENTION_WINDOW_DAYS || '365', 10),
      rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '3600', 10),
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
      categoryVerificationOverrides: (() => {
        if (!process.env.CATEGORY_VERIFICATION_OVERRIDES) return {};
        try {
          return JSON.parse(process.env.CATEGORY_VERIFICATION_OVERRIDES);
        } catch {
          throw new Error(
            'Fatal configuration error: CATEGORY_VERIFICATION_OVERRIDES must be valid JSON.',
          );
        }
      })(),
    },
  };
};
