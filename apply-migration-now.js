#!/usr/bin/env node

/**
 * Apply faculty account_id migration to Supabase
 */

require('dotenv').config();
const supabase = require('./config/supabase');

async function applyMigration() {
  console.log('🔧 Applying migration to add account_id column to faculty_accounts...\n');

  try {
    // Check if column already exists
    console.log('Step 1: Checking if account_id column exists...');
    const { data: columns, error: checkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'faculty_accounts' 
            AND column_name = 'account_id';
        `
      });

    if (checkError) {
      console.log('⚠️  Cannot check column (RPC not available), proceeding with ALTER TABLE...\n');
    } else if (columns && columns.length > 0) {
      console.log('✓ Column already exists! No migration needed.\n');
      return;
    }

    // Apply migration using raw SQL
    console.log('Step 2: Adding account_id column to faculty_accounts...');
    
    // Note: Supabase JS client doesn't support DDL directly
    // We need to use the SQL editor or create a migration function
    console.log('\n⚠️  IMPORTANT: Supabase JS client cannot execute DDL statements directly.');
    console.log('You need to run this SQL in Supabase Dashboard:\n');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`
-- Add account_id column to faculty_accounts
ALTER TABLE public.faculty_accounts 
ADD COLUMN IF NOT EXISTS account_id text NULL;

-- Create index on account_id
CREATE INDEX IF NOT EXISTS idx_faculty_accounts_account_id 
ON public.faculty_accounts USING btree (account_id);

-- Add comment
COMMENT ON COLUMN public.faculty_accounts.account_id IS 
'Account ID for faculty with external emails (e.g., Gmail). Format: OTH+numbers.';
    `);
    console.log('─────────────────────────────────────────────────────────\n');
    
    console.log('📋 Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in left sidebar');
    console.log('4. Click "New Query"');
    console.log('5. Copy the SQL above');
    console.log('6. Paste and click "Run"');
    console.log('7. You should see "Success. No rows returned"\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyMigration();
