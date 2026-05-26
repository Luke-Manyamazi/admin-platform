/**
 * Database seed script — run with: pnpm db:seed
 *
 * Populates the database with initial data for development and staging.
 * This script is safe to run repeatedly — it uses upsert operations.
 *
 * DO NOT run in production without explicit approval.
 */

import { hash } from 'crypto';
import { prisma } from './client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deterministic password hash for seed data.
 * In production, use bcrypt or argon2 — this is seed-only.
 */
function seedPasswordHash(password: string): string {
  return `seed:${hash('sha256', password, 'hex')}`;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Seeding ADMIN Platform database...\n');

  // ── Camluk admin user ──────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@camluk.co.za' },
    update: {},
    create: {
      email: 'admin@camluk.co.za',
      passwordHash: seedPasswordHash('admin-seed-password'),
      role: 'ADMIN',
      firstName: 'Camluk',
      lastName: 'Admin',
      country: 'ZA',
      isVerified: true,
    },
  });
  console.log(`✓ Admin user: ${adminUser.email}`);

  // ── Demo buyer ─────────────────────────────────────────────────────────────
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@demo.admin-platform.africa' },
    update: {},
    create: {
      email: 'buyer@demo.admin-platform.africa',
      passwordHash: seedPasswordHash('buyer-seed-password'),
      role: 'BUYER',
      firstName: 'Demo',
      lastName: 'Buyer',
      country: 'US',
      isVerified: true,
    },
  });
  console.log(`✓ Demo buyer: ${buyerUser.email}`);

  // ── Demo factory owner ─────────────────────────────────────────────────────
  const factoryOwner = await prisma.user.upsert({
    where: { email: 'factory@demo.admin-platform.africa' },
    update: {},
    create: {
      email: 'factory@demo.admin-platform.africa',
      passwordHash: seedPasswordHash('factory-seed-password'),
      role: 'FACTORY_OWNER',
      firstName: 'Demo',
      lastName: 'Factory',
      country: 'ZA',
      isVerified: true,
    },
  });
  console.log(`✓ Demo factory owner: ${factoryOwner.email}`);

  // ── Demo verified factory ──────────────────────────────────────────────────
  const demoFactory = await prisma.factory.upsert({
    where: { registrationNumber: 'ZA-DEMO-001' },
    update: {},
    create: {
      name: 'Cape Town Manufacturing Demo',
      registrationNumber: 'ZA-DEMO-001',
      country: 'ZA',
      region: 'Western Cape',
      address: '1 Harbour Drive, Cape Town, 8001',
      phone: '+27 21 000 0000',
      email: 'factory@demo.admin-platform.africa',
      description: 'A demo factory for development and testing.',
      capabilities: ['Metal Fabrication', 'Assembly', 'Quality Control'],
      certifications: ['ISO 9001:2015'],
      capacityUnitsPerMonth: 10000,
      minimumOrderValue: 500000, // R 5,000.00
      trustScore: 85,
      status: 'VERIFIED',
      ownerId: factoryOwner.id,
    },
  });
  console.log(`✓ Demo factory: ${demoFactory.name} (status: ${demoFactory.status})`);

  console.log('\n✅ Seeding complete.');
  console.log('\n⚠️  These are SEED credentials — never use in production:');
  console.log('   Admin:          admin@camluk.co.za');
  console.log('   Demo buyer:     buyer@demo.admin-platform.africa');
  console.log('   Demo factory:   factory@demo.admin-platform.africa');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
