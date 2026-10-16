import { configuration } from '../src/common/config/configuration';

describe('REV-1: Fail-Fast Secret Configuration & Credential Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws fatal error if JWT_ACCESS_SECRET is missing', () => {
    delete process.env.JWT_ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = 'a'.repeat(32);
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    expect(() => configuration()).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('throws fatal error if JWT_ACCESS_SECRET is shorter than 32 characters', () => {
    process.env.JWT_ACCESS_SECRET = 'short-secret';
    process.env.JWT_REFRESH_SECRET = 'a'.repeat(32);
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    expect(() => configuration()).toThrow(/JWT_ACCESS_SECRET.*weak.*32 characters/);
  });

  it('throws fatal error if JWT_REFRESH_SECRET is missing', () => {
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    delete process.env.JWT_REFRESH_SECRET;
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    expect(() => configuration()).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('throws fatal error if JWT_REFRESH_SECRET is shorter than 32 characters', () => {
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'weak-refresh';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    expect(() => configuration()).toThrow(/JWT_REFRESH_SECRET.*weak.*32 characters/);
  });

  it('throws fatal error if DATABASE_URL is missing', () => {
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
    delete process.env.DATABASE_URL;

    expect(() => configuration()).toThrow(/DATABASE_URL/);
  });

  it('successfully returns configuration when all secrets are valid and meet minimum length', () => {
    process.env.JWT_ACCESS_SECRET = 'valid-access-secret-that-is-at-least-32-chars-long';
    process.env.JWT_REFRESH_SECRET = 'valid-refresh-secret-that-is-at-least-32-chars-long';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/cirs_test';

    const config = configuration();
    expect(config.jwt.accessSecret).toBe(process.env.JWT_ACCESS_SECRET);
    expect(config.jwt.refreshSecret).toBe(process.env.JWT_REFRESH_SECRET);
    expect(config.databaseUrl).toBe(process.env.DATABASE_URL);
  });
});
