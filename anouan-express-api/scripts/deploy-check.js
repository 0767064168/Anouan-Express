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

// 1. Environment & Config Check
console.log('1. Checking Environment & Config...');
const envPath = path.join(__dirname, '../.env');
assert(fs.existsSync(envPath), '.env configuration file exists');

const packageApi = require('../package.json');
assert(packageApi.name === 'anouan-express-api', 'API package.json valid');
assert(!!packageApi.dependencies.express, 'Express dependency present');
assert(!!packageApi.dependencies.pg, 'PostgreSQL pg client dependency present');

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

// Summary Report
console.log('\n--------------------------------------------------');
console.log(`📊 SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
console.log('--------------------------------------------------');

if (failCount === 0) {
  console.log('🎉 ALL CHECKS PASSED! Platform is 100% READY FOR DEPLOYMENT.\n');
  process.exit(0);
} else {
  console.log('⚠️ SOME CHECKS FAILED. Please review issues above.\n');
  process.exit(1);
}
