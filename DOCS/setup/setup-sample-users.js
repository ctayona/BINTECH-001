require('dotenv').config();
const supabase = require('./config/supabase');

async function checkAndCreateUsers() {
  try {
    console.log('\n=== Checking Database ===\n');
    
    // Check users table
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('id, email, role');
    
    console.log('📋 users table:');
    if (usersError) {
      console.log('  Error:', usersError.message);
    } else if (usersTable && usersTable.length > 0) {
      usersTable.forEach(u => console.log(`  - ${u.email} (role: ${u.role})`));
    } else {
      console.log('  (empty)');
    }
    
    // Check user_accounts table
    const { data: userAccounts, error: accountsError } = await supabase
      .from('user_accounts')
      .select('system_id, email, role, campus_id');
    
    // Check admin_accounts table
    const { data: adminAccounts, error: adminError } = await supabase
      .from('admin_accounts')
      .select('id, email, role');
    
    console.log('\n📋 admin_accounts table:');
    if (accountsError) {
      console.log('  Error:', accountsError.message);
    } else if (adminAccounts && adminAccounts.length > 0) {
      adminAccounts.forEach(u => console.log(`  - ${u.email} (role: ${u.role})`));
    } else {
      console.log('  (empty)');
    }
    
    console.log('\n=== Creating Sample Users ===\n');
    
    // Create admin user in admin_accounts table
    const adminExists = adminAccounts?.some(u => u.email === 'admin@bintech.com');
    if (!adminExists) {
      console.log('Creating admin@bintech.com in admin_accounts table...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('SamplePass123!', 10);
      
      const { error: adminError } = await supabase
        .from('admin_accounts')
        .insert({
          email: 'admin@bintech.com',
          role: 'admin',
          full_name: 'Admin User',
          password: hashedPassword
        });
      
      if (adminError) {
        console.log('  ❌ Error:', adminError.message);
      } else {
        console.log('  ✅ Created');
      }
    } else {
      console.log('admin@bintech.com already exists in admin_accounts');
    }
    
    // Create regular user in user_accounts table
    const userExists = userAccounts?.some(u => u.email === 'user@bintech.com');
    if (!userExists) {
      console.log('Creating user@bintech.com in user_accounts table...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('SamplePass123!', 10);
      
      const { error: userError } = await supabase
        .from('user_accounts')
        .insert({
          email: 'user@bintech.com',
          first_name: 'Test',
          last_name: 'User',
          password: hashedPassword,
          role: 'student',
          campus_id: 'k12345678'
        });
      
      if (userError) {
        console.log('  ❌ Error:', userError.message);
      } else {
        console.log('  ✅ Created');
      }
    } else {
      console.log('user@bintech.com already exists');
    }
    
    console.log('\n=== Verifying Creation ===\n');
    
    // Verify admin exists
    const { data: admin } = await supabase
      .from('admin_accounts')
      .select('email, role')
      .eq('email', 'admin@bintech.com')
      .single();
    
    if (admin) {
      console.log('✅ admin@bintech.com exists in admin_accounts table');
    } else {
      console.log('❌ admin@bintech.com NOT found');
    }
    
    // Verify user exists
    const { data: user } = await supabase
      .from('user_accounts')
      .select('email, role, password')
      .eq('email', 'user@bintech.com')
      .single();
    
    if (user) {
      console.log('✅ user@bintech.com exists in user_accounts table');
      console.log(`   Password field is ${user.password ? '✅ set' : '❌ missing'}`);
    } else {
      console.log('❌ user@bintech.com NOT found');
    }
    
    console.log('\n=== Ready to Test ===');
    console.log('Admin login: admin@bintech.com / SamplePass123!');
    console.log('User login: user@bintech.com / SamplePass123!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkAndCreateUsers();
