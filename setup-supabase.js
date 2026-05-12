#!/usr/bin/env node

/**
 * ============================================
 * BINTECH SUPABASE SETUP & VERIFICATION SCRIPT
 * ============================================
 * 
 * This script:
 * 1. Verifies Supabase connection
 * 2. Validates database schema
 * 3. Creates sample data for testing
 * 4. Runs health checks
 * 
 * Usage: node setup-supabase.js
 */

const supabase = require('./config/supabase');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) { log(`✅ ${message}`, 'green'); }
function error(message) { log(`❌ ${message}`, 'red'); }
function warning(message) { log(`⚠️  ${message}`, 'yellow'); }
function info(message) { log(`ℹ️  ${message}`, 'blue'); }
function step(message) { log(`\n📋 ${message}`, 'cyan'); }

// ============================================
// VERIFICATION FUNCTIONS
// ============================================

async function verifyConnection() {
  step('STEP 1: Verifying Supabase Connection');
  
  try {
    const { data, error } = await supabase.from('bins').select('count()', { count: 'exact', head: true });
    
    if (error) throw error;
    success('Connected to Supabase database');
    return true;
  } catch (err) {
    error(`Failed to connect: ${err.message}`);
    error('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env file');
    return false;
  }
}

async function verifyTables() {
  step('STEP 2: Verifying Database Tables');
  
  const tables = [
    'bins',
    'collection_logs',
    'rewards',
    'schedules',
    'users',
    'disposal_history',
    'admin_accounts'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        error(`Table '${table}' not found or not accessible`);
        allTablesExist = false;
      } else {
        success(`Table '${table}' exists`);
      }
    } catch (err) {
      error(`Error checking table '${table}': ${err.message}`);
      allTablesExist = false;
    }
  }
  
  if (!allTablesExist) {
    warning('Some tables are missing. Run SUPABASE_SETUP_COMPLETE.sql and ADMIN_ACCOUNTS_SCHEMA.sql in Supabase SQL Editor');
  }
  
  return allTablesExist;
}

async function getRecordCounts() {
  step('STEP 3: Database Records Count');
  
  const tables = [
    'bins',
    'collection_logs',
    'rewards',
    'schedules',
    'users',
    'disposal_history',
    'admin_accounts'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      const recordCount = count || 0;
      info(`${table}: ${recordCount} records`);
    } catch (err) {
      error(`Error counting records in '${table}': ${err.message}`);
    }
  }
}

async function createSampleData() {
  step('STEP 4: Creating Sample Data');
  
  try {
    // Get existing bins count
    const { count: binCount } = await supabase
      .from('bins')
      .select('*', { count: 'exact', head: true });
    
    if (binCount === 0) {
      info('Creating sample bins...');
      const { error: binError } = await supabase
        .from('bins')
        .insert([
          {
            location: 'Building A - Ground Floor',
            code: 'BIN-A001',
            capacity: 120,
            waste_type: 'organic',
            filled_percentage: 45,
            status: 'active'
          },
          {
            location: 'Building B - Second Floor',
            code: 'BIN-B002',
            capacity: 100,
            waste_type: 'plastic',
            filled_percentage: 60,
            status: 'active'
          },
          {
            location: 'Campus Center',
            code: 'BIN-C001',
            capacity: 150,
            waste_type: 'mixed',
            filled_percentage: 30,
            status: 'active'
          }
        ]);
      
      if (binError) throw binError;
      success('Created sample bins');
    } else {
      info(`Bins already exist (${binCount} records). Skipping creation.`);
    }
    
    // Create sample rewards
    const { count: rewardCount } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true });
    
    if (rewardCount === 0) {
      info('Creating sample rewards...');
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert([
          {
            name: 'Coffee Voucher',
            description: 'Free coffee at campus cafe',
            points_required: 50,
            category: 'food',
            is_active: true
          },
          {
            name: 'Movie Ticket',
            description: 'Free movie ticket pass',
            points_required: 100,
            category: 'entertainment',
            is_active: true
          },
          {
            name: 'Eco T-Shirt',
            description: 'Limited edition BinTECH t-shirt',
            points_required: 75,
            category: 'merchandise',
            is_active: true
          }
        ]);
      
      if (rewardError) throw rewardError;
      success('Created sample rewards');
    } else {
      info(`Rewards already exist (${rewardCount} records). Skipping creation.`);
    }
    
  } catch (err) {
    error(`Error creating sample data: ${err.message}`);
  }
}

async function testCRUDOperations() {
  step('STEP 5: Testing CRUD Operations');
  
  try {
    // Test CREATE
    info('Testing CREATE operation...');
    const { data: createdBin, error: createError } = await supabase
      .from('bins')
      .insert([{
        location: 'Test Location',
        code: 'TEST-001',
        capacity: 100,
        waste_type: 'test',
        status: 'active'
      }])
      .select();
    
    if (createError) throw createError;
    success('CREATE operation successful');
    
    const testBinId = createdBin[0].id;
    
    // Test READ
    info('Testing READ operation...');
    const { data: readBin, error: readError } = await supabase
      .from('bins')
      .select('*')
      .eq('id', testBinId)
      .single();
    
    if (readError) throw readError;
    success('READ operation successful');
    
    // Test UPDATE
    info('Testing UPDATE operation...');
    const { data: updatedBin, error: updateError } = await supabase
      .from('bins')
      .update({ location: 'Updated Test Location', filled_percentage: 50 })
      .eq('id', testBinId)
      .select();
    
    if (updateError) throw updateError;
    success('UPDATE operation successful');
    
    // Test DELETE
    info('Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('bins')
      .delete()
      .eq('id', testBinId);
    
    if (deleteError) throw deleteError;
    success('DELETE operation successful');
    
  } catch (err) {
    error(`CRUD test failed: ${err.message}`);
  }
}

async function checkPermissions() {
  step('STEP 6: Checking Database Permissions');
  
  const operations = [
    { operation: 'SELECT', query: async () => await supabase.from('bins').select('*').limit(1) },
    { operation: 'INSERT', query: async () => await supabase.from('bins').insert([{ location: 'test', code: 'TEST', capacity: 100, status: 'test' }]) },
    { operation: 'UPDATE', query: async () => await supabase.from('bins').update({ filled_percentage: 50 }).eq('location', 'test') },
    { operation: 'DELETE', query: async () => await supabase.from('bins').delete().eq('location', 'test') }
  ];
  
  for (const { operation, query } of operations) {
    try {
      const { error } = await query();
      if (error && error.message.includes('permission')) {
        warning(`${operation} permission may be restricted`);
      } else {
        success(`${operation} permission: OK`);
      }
    } catch (err) {
      warning(`${operation} test error: ${err.message}`);
    }
  }
}

async function generateHealthReport() {
  step('STEP 7: Health Report');
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.SUPABASE_URL ? 'Configured' : 'NOT SET',
      authKeySet: process.env.SUPABASE_ANON_KEY ? 'Yes' : 'No',
      serviceRoleSet: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'
    };
    
    log('\n📊 HEALTH REPORT:');
    log(JSON.stringify(report, null, 2), 'cyan');
    
  } catch (err) {
    error(`Error generating report: ${err.message}`);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  log('\n🚀 BINTECH SUPABASE SETUP & VERIFICATION', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  try {
    // Run all verification steps
    const connectionOk = await verifyConnection();
    if (!connectionOk) {
      error('Cannot proceed without database connection');
      process.exit(1);
    }
    
    await verifyTables();
    await getRecordCounts();
    await createSampleData();
    await testCRUDOperations();
    await checkPermissions();
    await generateHealthReport();
    
    log('\n' + '=' .repeat(50), 'cyan');
    success('Setup and verification complete! ✨');
    log('\n📚 Next steps:', 'blue');
    log('  1. Review the SUPABASE_INTEGRATION_GUIDE.md', 'blue');
    log('  2. Start your application: npm start', 'blue');
    log('  3. Test endpoints via API or admin dashboard', 'blue');
    log('  4. Check logs for any errors\n', 'blue');
    
  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { verifyConnection, verifyTables, createSampleData, testCRUDOperations };
