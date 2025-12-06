#!/usr/bin/env node
/**
 * Generate bcrypt hash for admin password
 * 
 * Usage:
 *   node scripts/generate-admin-hash.js YOUR_PASSWORD
 * 
 * Then add to .env:
 *   ADMIN_PASSWORD_HASH="$2a$10$..."
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Usage: node scripts/generate-admin-hash.js YOUR_PASSWORD');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/generate-admin-hash.js MySecurePassword123!');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('');
console.log('✅ Password hash generated successfully!');
console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
console.log('');
console.log('⚠️  Never share or commit this hash with your password!');
