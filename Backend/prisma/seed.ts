import { PrismaClient, Role, UserStatus, ItemType, ItemCategory, ItemStatus, StorageLocationName } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CIRS database...');

  // 1. Seed Campus (ID: campus-1)
  const campus = await prisma.campus.upsert({
    where: { id: 'campus-1' },
    update: {},
    create: {
      id: 'campus-1',
      name: 'GSFC University Main Campus',
      code: 'GSFCU-MAIN',
    },
  });
  console.log(`✓ Seeded Campus: ${campus.name} (id: ${campus.id})`);

  // 2. Seed Department
  const department = await prisma.department.upsert({
    where: { id: 'dept-cse' },
    update: {},
    create: {
      id: 'dept-cse',
      campusId: campus.id,
      name: 'Computer Science & Engineering',
      code: 'CSE',
    },
  });
  console.log(`✓ Seeded Department: ${department.name} (id: ${department.id})`);

  // 3. Seed Storage Location
  const storageLocation = await prisma.storageLocation.upsert({
    where: {
      campusId_name: {
        campusId: campus.id,
        name: StorageLocationName.SECURITY_OFFICE,
      },
    },
    update: {},
    create: {
      id: 'loc-sec-office',
      campusId: campus.id,
      name: StorageLocationName.SECURITY_OFFICE,
    },
  });
  console.log(`✓ Seeded Storage Location: ${storageLocation.name} (id: ${storageLocation.id})`);

  // 4. Hash standard test password with argon2id (NFR-2)
  const passwordHash = await argon2.hash('Password123!', {
    type: argon2.argon2id,
  });

  // 5. Seed Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gsfcuniversity.ac.in' },
    update: {},
    create: {
      id: 'user-admin-1',
      name: 'CIRS Administrator',
      email: 'admin@gsfcuniversity.ac.in',
      passwordHash,
      role: Role.ADMIN,
      campusId: campus.id,
      departmentId: department.id,
      status: UserStatus.ACTIVE,
      notificationPreference: {
        create: {
          emailEnabled: true,
          digestEnabled: false,
        },
      },
    },
  });
  console.log(`✓ Seeded Admin User: ${adminUser.email} (Role: ${adminUser.role})`);

  // 6. Seed Student Account
  const studentUser = await prisma.user.upsert({
    where: { email: 'student.test@gsfcuniversity.ac.in' },
    update: {},
    create: {
      id: 'user-student-1',
      name: 'Test Student',
      email: 'student.test@gsfcuniversity.ac.in',
      passwordHash,
      role: Role.STUDENT,
      campusId: campus.id,
      departmentId: department.id,
      status: UserStatus.ACTIVE,
      notificationPreference: {
        create: {
          emailEnabled: true,
          digestEnabled: false,
        },
      },
    },
  });
  console.log(`✓ Seeded Student User: ${studentUser.email} (Role: ${studentUser.role})`);

  // 7. Seed Explicit Sample Found Item
  const sampleItem = await prisma.item.upsert({
    where: { caseId: 'CIRS-2026-000001' },
    update: {},
    create: {
      caseId: 'CIRS-2026-000001',
      type: ItemType.FOUND,
      itemName: '[SEED DATA] Blue Water Bottle',
      category: ItemCategory.OTHERS,
      description: '[SEED DATA] Blue stainless steel water bottle found near Cafeteria',
      colour: 'Blue',
      brand: 'Milton',
      identifyingMarks: 'Small dent on cap',
      foundLocation: 'Cafeteria Ground Floor',
      dateFound: new Date('2026-10-15T10:00:00Z'),
      storageLocationId: storageLocation.id,
      reporterId: adminUser.id,
      campusId: campus.id,
      status: ItemStatus.FOUND,
    },
  });
  console.log(`✓ Seeded Sample Item: ${sampleItem.caseId} - ${sampleItem.itemName}`);

  console.log('\n--- Seed Complete ---');
  console.log('Campus ID:     campus-1');
  console.log('Department ID: dept-cse');
  console.log('Student User:  student.test@gsfcuniversity.ac.in / Password123!');
  console.log('Admin User:    admin@gsfcuniversity.ac.in / Password123!');
  console.log('---------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
