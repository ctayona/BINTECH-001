require('dotenv').config();
const supabase = require('./config/supabase');
const bcrypt = require('bcrypt');

async function fixUserPasswords() {
  try {
    console.log('\n=== Checking & Fixing Passwords ===\n');
    
    // Check admin password
    const { data: admin } = await supabase
      .from('users')
      .select('email, password, role')
      .eq('email', 'admin@bintech.com')
      .single();
    
    console.log('Admin user (admin@bintech.com):');
    console.log(`  Stored password type: ${typeof admin?.password}`);
    console.log(`  Stored password (first 30 chars): ${admin?.password?.substring(0, 30)}...`);
    console.log(`  Is hashed: ${admin?.password?.startsWith('$2')}`)
    console.log(`  Role: ${admin?.role}`);
    
    // Test bcrypt compare with stored password
    console.log(`  Testing bcrypt.compare('SamplePass123!', stored):...`);
    const adminPassMatch = await bcrypt.compare('SamplePass123!', admin.password);
    console.log(`  Match result: ${adminPassMatch}`);
    
    // Check user password
    const { data: user } = await supabase
      .from('users')
      .select('email, password, role')
      .eq('email', 'user@bintech.com')
      .single();
    
    console.log('\nUser (user@bintech.com):');
    console.log(`  Stored password type: ${typeof user?.password}`);
    console.log(`  Stored password (first 30 chars): ${user?.password?.substring(0, 30)}...`);
    console.log(`  Is hashed: ${user?.password?.startsWith('$2')}`);
    console.log(`  Role: ${user?.role}`);
    
    if (user?.password) {
      console.log(`  Testing bcrypt.compare('SamplePass123!', stored):...`);
      const userPassMatch = await bcrypt.compare('SamplePass123!', user.password);
      console.log(`  Match result: ${userPassMatch}`);
    }
    
    // If user password is not hashed or doesn't match, update it
    if (!user?.password || !user?.password?.startsWith('$2')) {
      console.log('\n⚠️ User password needs to be hashed!');
      const hashedPassword = await bcrypt.hash('SamplePass123!', 10);
      console.log('Creating new hashed password...');
      
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', 'user@bintech.com');
      
      if (error) {
        console.log(`❌ Error updating password: ${error.message}`);
      } else {
        console.log(`✅ Password updated successfully`);
        
        // Verify it worked
        const { data: updatedUser } = await supabase
          .from('users')
          .select('email, password')
          .eq('email', 'user@bintech.com')
          .single();
        
        const newMatch = await bcrypt.compare('SamplePass123!', updatedUser.password);
        console.log(`  Verification: bcrypt.compare result = ${newMatch}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUserPasswords();
