#!/usr/bin/env node
/**
 * Generate secure secrets for production deployment
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('');
console.log('🔐 Generating Secure Secrets for Harp');
console.log('=====================================');
console.log('');

// NEXTAUTH_SECRET
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('NEXTAUTH_SECRET:');
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);
console.log('');

// Example admin hash generation reminder
console.log('ADMIN_PASSWORD_HASH:');
console.log('Run: node scripts/generate-admin-hash.js YOUR_PASSWORD');
console.log('');

console.log('=====================================');
console.log('');
console.log('📋 Copy these values to your .env file');
console.log('⚠️  Keep these secrets secure!');
console.log('');
