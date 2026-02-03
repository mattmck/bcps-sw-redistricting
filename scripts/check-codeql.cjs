#!/usr/bin/env node
/**
 * CodeQL Installation Checker
 * 
 * This script runs after npm install to verify CodeQL is available.
 * It provides helpful guidance for new developers.
 * 
 * Usage: Add to package.json as "postinstall": "node scripts/check-codeql.cjs"
 * Note: .cjs extension used because package.json has "type": "module"
 */

const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCodeQL() {
  console.log('\n🔍 Checking CodeQL installation...\n');

  try {
    // Check if CodeQL CLI is available
    const version = execSync('codeql --version', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim().split('\n')[0];
    
    log(`✅ CodeQL is installed: ${version}`, 'green');
    
    // Try to download query packs
    try {
      log('📦 Downloading CodeQL JavaScript query packs...', 'blue');
      execSync('codeql pack download codeql/javascript-queries', {
        stdio: 'inherit'
      });
      log('✅ Query packs ready', 'green');
    } catch (packError) {
      log('⚠️  Could not download query packs. Run manually: codeql pack download codeql/javascript-queries', 'yellow');
    }
    
    log('\n🔒 Security scanning available! Run: npm run codeql:scan\n', 'green');
    
  } catch (error) {
    // CodeQL not installed - provide guidance
    log('⚠️  CodeQL is not installed or not in PATH', 'yellow');
    console.log('\nCodeQL is optional but recommended for security analysis.\n');
    
    log('Installation options:', 'blue');
    console.log('  1. Homebrew (macOS):');
    console.log('     brew install codeql\n');
    
    console.log('  2. Manual download:');
    console.log('     https://github.com/github/codeql-cli-binaries/releases\n');
    
    console.log('  3. Automated setup script:');
    console.log('     ./scripts/setup-dev.sh\n');
    
    log('See docs/CODEQL.md for detailed instructions.\n', 'blue');
  }
}

// Only run if executed directly (not imported)
if (require.main === module) {
  checkCodeQL();
}

module.exports = { checkCodeQL };
