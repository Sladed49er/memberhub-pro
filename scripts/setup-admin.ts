// scripts/setup-admin.ts
// Run this with: npx tsx scripts/setup-admin.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupSuperAdmin() {
  console.log('🚀 Setting up Super Admin...');
  
  try {
    // Create the super admin user
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@memberhub.com' },
      update: {
        role: 'ADMIN',
        name: 'Super Admin',
      },
      create: {
        email: 'admin@memberhub.com',
        name: 'Super Admin',
        role: 'ADMIN',
      },
    });

    console.log('✅ Super Admin created/updated:', superAdmin.email);
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your app and sign up with: admin@memberhub.com');
    console.log('2. After signing up, you\'ll be recognized as Super Admin');
    console.log('3. You can then manage all agencies and users');
    
    // Create a default agency for testing
    const testAgency = await prisma.agency.upsert({
      where: { memberNumber: 'AG00000001' },
      update: {},
      create: {
        memberNumber: 'AG00000001',
        name: 'Test Agency',
        email: 'test@agency.com',
        membershipType: 'A1_AGENCY',
        status: 'ACTIVE',
      },
    });

    console.log('\n✅ Test agency created:', testAgency.name);
    
  } catch (error) {
    console.error('❌ Error setting up super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSuperAdmin();