// Jest test environment setup
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/cirs_test?schema=public';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  'cirs-access-secret-key-for-test-environments-min-32-chars';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'cirs-refresh-secret-key-for-test-environments-min-32-chars';
process.env.UNIVERSITY_EMAIL_DOMAINS =
  process.env.UNIVERSITY_EMAIL_DOMAINS || 'gsfcuniversity.ac.in';
