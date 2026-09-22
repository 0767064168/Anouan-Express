// scripts/deploy-check.js
// Automated Deployment Readiness & Smoke Test Suite for Anouan Express

const fs = require('fs');
const path = require('path');

console.log('--------------------------------------------------');
console.log('🚀 ANOUAN EXPRESS — DEPLOYMENT READINESS CHECK');
console.log('--------------------------------------------------\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passCount++;
  } else {
    console.log(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

function isStrongSecret(value) {
  return Boolean(value)
    && value.length >= 32
    && !/^(dev_only_|changeme|test)/i.test(value);
}

function envValue(key) {
  return process.env[key] || '';
}

const isProduction = envValue('NODE_ENV') === 'production';

// 1. Environment & Config Check
console.log('1. Checking Environment & Config...');
const envPath = path.join(__dirname, '../.env');
assert(fs.existsSync(envPath) || isProduction, '.env exists locally or production variables are injected by the platform');

const packageApi = require('../package.json');
assert(packageApi.name === 'anouan-express-api', 'API package.json valid');
assert(!!packageApi.dependencies.express, 'Express dependency present');
assert(!!packageApi.dependencies.pg, 'PostgreSQL pg client dependency present');

if (isProduction) {
  assert(isStrongSecret(envValue('JWT_SECRET')), 'JWT_SECRET is strong in production');
  assert(isStrongSecret(envValue('JWT_REFRESH_SECRET')), 'JWT_REFRESH_SECRET is strong in production');
  assert(envValue('JWT_SECRET') !== envValue('JWT_REFRESH_SECRET'), 'JWT secrets are distinct in production');
  assert(envValue('DATABASE_URL') || (envValue('DB_HOST') && envValue('DB_NAME') && envValue('DB_USER')), 'Production database connection is configured');
  assert(envValue('ALLOWED_ORIGINS') && !envValue('ALLOWED_ORIGINS').includes('localhost'), 'Production ALLOWED_ORIGINS excludes localhost');
  assert(/^https:\/\//.test(envValue('CLIENT_URL')), 'Production CLIENT_URL uses HTTPS');
  assert(/^https:\/\//.test(envValue('CINETPAY_NOTIFY_URL')), 'Production payment webhook URL uses HTTPS');
}

// 2. Core Modules Integrity Check
console.log('\n2. Checking Backend Modules Integrity...');
const modules = ['auth', 'products', 'orders', 'payments', 'stores', 'users', 'vendors', 'categories'];

modules.forEach((mod) => {
  const modPath = path.join(__dirname, `../src/modules/${mod}/${mod}.routes.js`);
  assert(fs.existsSync(modPath), `Module '${mod}' routes file exists`);
});

// 3. Frontend Web Production Bundle Check
console.log('\n3. Checking Web Frontend Production Assets...');
const distHtml = path.join(__dirname, '../../anouan-express-web/dist/index.html');
const distCss = path.join(__dirname, '../../anouan-express-web/dist/assets');
assert(fs.existsSync(distHtml), 'Frontend production dist/index.html exists');
assert(fs.existsSync(distCss), 'Frontend production dist/assets bundle directory exists');

const frontendPackage = require('../../anouan-express-web/package.json');
assert(!!frontendPackage.scripts.build, 'Frontend build script present');
if (isProduction) {
  if (envValue('VITE_API_URL')) {
    assert(/^https:\/\/.+\/api\/?$/.test(envValue('VITE_API_URL')), 'VITE_API_URL points to the HTTPS API');
  } else {
    console.log('  - [SKIP] VITE_API_URL is managed by the Vercel frontend environment');
  }
}

// Summary Report
console.log('\n--------------------------------------------------');
console.log(`📊 SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
console.log('--------------------------------------------------');

if (failCount === 0) {
  console.log('🎉 ALL CHECKS PASSED! Platform is ready for the checked deployment requirements.\n');
  process.exit(0);
} else {
  console.log('⚠️ SOME CHECKS FAILED. Please review issues above.\n');
  process.exit(1);
}
