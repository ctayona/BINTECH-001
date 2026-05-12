require('dotenv').config();
const supabase = require('./config/supabase');
const bcrypt = require('bcrypt');

async function migrateToAdminAccounts() {
  try {
    console.log('\n=== Admin Accounts Migration ===\n');
    
    // Step 1: Check if admin_accounts table exists
    console.log('Step 1: Checking admin_accounts table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('admin_accounts')
      .select('count', { count: 'exact' });
    
    if (tableError) {
      console.log('❌ admin_accounts table does not exist yet!');
      console.log('   You need to run ADMIN_ACCOUNTS_SCHEMA.sql in Supabase first');
      console.log('   SQL file location: ADMIN_ACCOUNTS_SCHEMA.sql');
      return;
    }
    
    console.log('✅ admin_accounts table exists');
    
    // Step 2: Check existing admins in users table
    console.log('\nStep 2: Finding existing admins in users table...');
    const { data: existingAdmins } = await supabase
      .from('users')
      .select('id, email, full_name, password, role')
      .eq('role', 'admin');
    
    if (!existingAdmins || existingAdmins.length === 0) {
      console.log('  No admins found in users table');
    } else {
      console.log(`  Found ${existingAdmins.length} admin(s):`);
      existingAdmins.forEach(admin => {
        console.log(`    - ${admin.email} (${admin.full_name || 'N/A'})`);
      });
      
      // Step 3: Migrate admins to admin_accounts
      console.log('\nStep 3: Migrating admins to admin_accounts table...');
      
      for (const admin of existingAdmins) {
        // Check if already migrated
        const { data: alreadyExists } = await supabase
          .from('admin_accounts')
          .select('id')
          .eq('email', admin.email)
          .single();
        
        if (alreadyExists) {
          console.log(`  ✓ ${admin.email} already in admin_accounts`);
          continue;
        }
        
        // Insert into admin_accounts
        const { error: insertError } = await supabase
          .from('admin_accounts')
          .insert({
            email: admin.email,
            full_name: admin.full_name,
            password: admin.password,
            role: 'admin'
          });
        
        if (insertError) {
          console.log(`  ❌ Failed to migrate ${admin.email}: ${insertError.message}`);
        } else {
          console.log(`  ✅ Migrated ${admin.email}`);
        }
      }
    }
    
    // Step 4: Create sample admin if none exist
    const { data: adminCount, error: countError } = await supabase
      .from('admin_accounts')
      .select('count', { count: 'exact' });
    
    if (!countError && adminCount?.length === 0) {
      console.log('\nStep 4: Creating sample admin...');
      const hashedPassword = await bcrypt.hash('SamplePass123!', 10);
      
      const { error: createError } = await supabase
        .from('admin_accounts')
        .insert({
          email: 'admin@bintech.com',
          full_name: 'Admin User',
          password: hashedPassword,
          role: 'admin'
        });
      
      if (createError) {
        console.log(`  ❌ Failed to create sample admin: ${createError.message}`);
      } else {
        console.log(`  ✅ Created sample admin: admin@bintech.com`);
      }
    }
    
    // Step 5: Verify setup
    console.log('\nStep 5: Verifying setup...');
    const { data: finalAdmins } = await supabase
      .from('admin_accounts')
      .select('email, role');
    
    console.log(`\n📋 Current admin_accounts (${finalAdmins?.length || 0} total):`);
    finalAdmins?.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
    });
    
    console.log('\n✅ Migration complete!');
    console.log('\nTest admin login with:');
    console.log('  Email: admin@bintech.com');
    console.log('  Password: SamplePass123!');
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

migrateToAdminAccounts();
