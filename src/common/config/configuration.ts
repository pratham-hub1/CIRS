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
  policy: {
    retentionWindowDays: number;
    rateLimitTtl: number;
    rateLimitMax: number;
  };
}

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'cirs-access-secret-default-key-32-chars',
    accessExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION || '900', 10),
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'cirs-refresh-secret-default-key-32-chars',
    refreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800', 10),
  },
  universityEmailDomains: (process.env.UNIVERSITY_EMAIL_DOMAINS || 'gsfcuniversity.ac.in')
    .split(',')
    .map((d) => d.trim().toLowerCase()),
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  policy: {
    retentionWindowDays: parseInt(process.env.RETENTION_WINDOW_DAYS || '365', 10),
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '3600', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
  },
});
