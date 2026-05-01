// Authentication Controller - Updated Version
// Handles user registration, login, and profile management
// Features: Email-based role classification, bcrypt password hashing, role-based table storage

const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

// ============================================
// Helper Function: Classify Email Role
// ============================================
function classifyEmailRole(email) {
  const emailLower = email.toLowerCase();
  
  // Student pattern: contains k or a number suffix (like .k12158353 or .a12158353)
  if (/[.](k|a)\d+@/i.test(emailLower)) {
    return 'student';
  }
  
  // Faculty pattern: if it's an @umak.edu.ph email but doesn't have student k/a pattern
  if (/@umak\.edu\.ph$/i.test(emailLower) && !/[.](k|a)\d+@/i.test(emailLower)) {
    return 'faculty';
  }
  
  // Default to staff/others
  return 'staff';
}

// ============================================
// Helper Function: Extract Campus ID from Email
// ============================================
function extractCampusId(email, role) {
  const emailLower = email.toLowerCase();
  
  // For students: extract K-number or A-number (e.g., k12158353 or a12158353 from ctayona.k12158353@umak.edu.ph)
  if (role === 'student') {
    const match = emailLower.match(/\.([ka])(\d+)@/);
    if (match && match[1] && match[2]) {
      return match[1] + match[2]; // Return as "k12158353" or "a12158353"
    }
  }
  
  // For faculty: extract faculty code if available
  if (role === 'faculty') {
    const match = emailLower.match(/^([a-z]+)\.([a-z]+)/);
    if (match) {
      return match[1] + '.' + match[2]; // e.g., "lilibeth.arcalas"
    }
  }
  
  // For staff: return null - will be generated later
  if (role === 'staff') {
    return null; // Will generate OTH+numbers format
  }
  
  return null; // Default if no pattern matches
}

// ============================================
// Helper Function: Generate Staff Account ID with Collision Detection
// ============================================
async function generateStaffAccountId(maxRetries = 5) {
  try {
    console.log('\n📝 Generating unique staff account_id with collision detection...');
    
    // Query ALL existing staff account_ids to find the next available one
    const { data: allStaffAccounts, error: staffError } = await supabase
      .from('other_accounts')
      .select('account_id');
    
    if (staffError) {
      console.error('❌ Error querying existing staff accounts:', staffError.message);
      throw staffError;
    }
    
    console.log(`📋 Found ${allStaffAccounts?.length || 0} existing staff accounts`);
    
    let nextNumber = 1;
    
    // Extract all existing OTH numbers
    if (allStaffAccounts && allStaffAccounts.length > 0) {
      const numbers = allStaffAccounts
        .map(account => {
          const match = account.account_id?.match(/OTH(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0)
        .sort((a, b) => a - b);
      
      console.log(`Existing OTH numbers: ${numbers.join(', ')}`);
      
      // Find the next available number (skip any gaps)
      for (let i = 1; i <= Math.max(...numbers) + 1; i++) {
        if (!numbers.includes(i)) {
          nextNumber = i;
          break;
        }
      }
      console.log(`📊 Next available number: ${nextNumber}`);
    } else {
      console.log('📋 No existing staff accounts found, starting from 1');
    }
    
    // Ensure we don't go over 3 digits
    if (nextNumber > 999) {
      console.warn('⚠️ Staff ID counter exceeded 999, using timestamp-based ID');
      const timestamp = Date.now().toString().slice(-6);
      return 'OTH' + timestamp;
    }
    
    const accountId = 'OTH' + String(nextNumber).padStart(3, '0');
    console.log(`✓ Generated candidate staff account_id: ${accountId}`);
    
    // CRITICAL: Before returning, verify this ID doesn't already exist (race condition check)
    console.log(`🔍 Verifying ${accountId} is not already taken...`);
    const { data: existingId, error: checkError } = await supabase
      .from('other_accounts')
      .select('account_id')
      .eq('account_id', accountId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking account_id uniqueness:', checkError);
      throw checkError;
    }
    
    if (existingId) {
      console.warn(`⚠️ COLLISION DETECTED! ${accountId} already exists. Retrying...`);
      if (maxRetries > 0) {
        // Recursively try again with fresh query
        return generateStaffAccountId(maxRetries - 1);
      } else {
        console.error('❌ Max retries exceeded for account ID generation');
        throw new Error('Could not generate unique staff account ID after multiple retries');
      }
    }
    
    console.log(`✅ Verified ${accountId} is unique and available`);
    return accountId;
  } catch (err) {
    console.error('❌ Error generating staff account ID:', err.message);
    throw err;
  }
}

// ============================================
// Helper Function: Get Table Name by Role
// ============================================
function getTableNameByRole(role) {
  const tableMap = {
    'student': 'student_accounts',
    'faculty': 'faculty_accounts',
    'staff': 'other_accounts'
  };
  return tableMap[role.toLowerCase()] || 'other_accounts';
}

// ============================================
// Helper Function: Get ID Column Name by Role
// ============================================
function getIdColumnNameByRole(role) {
  const idColumnMap = {
    'student': 'student_id',
    'faculty': 'faculty_id',
    'staff': 'staff_id'
  };
  return idColumnMap[role.toLowerCase()] || 'staff_id';
}

// ============================================
// Helper Function: Cleanup Orphaned Accounts
// ============================================
async function cleanupOrphanedAccount(systemId) {
  try {
    console.log(`\n🧹 Cleaning up orphaned account: ${systemId}`);
    
    // Get the user's role first
    const { data: userData, error: getUserError } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('system_id', systemId)
      .maybeSingle();
    
    if (getUserError || !userData) {
      console.warn('Could not find user to cleanup:', systemId);
      return;
    }
    
    const role = userData.role;
    const roleTable = getTableNameByRole(role);
    
    // Delete from role-specific table
    const { error: roleError } = await supabase
      .from(roleTable)
      .delete()
      .eq('system_id', systemId);
    
    if (roleError) {
      console.warn(`Could not delete from ${roleTable}:`, roleError);
    } else {
      console.log(`✓ Deleted from ${roleTable}`);
    }
    
    // Delete from user_accounts
    const { error: userError } = await supabase
      .from('user_accounts')
      .delete()
      .eq('system_id', systemId);
    
    if (userError) {
      console.warn('Could not delete from user_accounts:', userError);
    } else {
      console.log(`✓ Deleted from user_accounts`);
    }
    
    console.log(`✓ Cleanup complete for system_id: ${systemId}`);
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't throw - continue with registration even if cleanup fails
  }
}

// ============================================
// User Registration - Updated for Correct Schema
// ============================================
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, middleName, lastName, role, google_id, profile_picture } = req.body;

    console.log('\n========== REGISTRATION START ==========');
    console.log('Request body received:', req.body);
    console.log('Extracted values:');
    console.log(`  Email: ${email}`);
    console.log(`  First Name: ${firstName}`);
    console.log(`  Role from request: "${role}" (type: ${typeof role})`);
    console.log(`  Has password: ${!!password}`);
    console.log(`  Google ID: ${google_id || 'Not provided'}`);
    console.log(`  Google profile picture: ${profile_picture ? profile_picture.substring(0, 50) + '...' : 'Not provided'}`);
    console.log('========================================\n');

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Trim and normalize email to remove whitespace
    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!trimmedEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate password strength (8+ chars, uppercase, number, special char)
    const passwordValidation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    if (!Object.values(passwordValidation).every(v => v)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain: at least 8 characters, one uppercase letter (A-Z), one number (0-9), and one special character (!@#$%^&*)'
      });
    }

    // Use provided role or classify from email
    let userRole = role;
    if (!userRole) {
      userRole = classifyEmailRole(email);
      console.log(`✓ Role not provided, auto-classified from email: ${userRole}`);
    } else {
      console.log(`✓ Role provided by user: ${userRole}`);
    }

    // Ensure role is valid and lowercase
    userRole = userRole.toLowerCase().trim();
    const validRoles = ['student', 'faculty', 'staff'];
    if (!validRoles.includes(userRole)) {
      console.error(`❌ Invalid role value: "${userRole}"`);
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        receivedRole: userRole
      });
    }

    const roleTableName = getTableNameByRole(userRole);
    const idColumnName = getIdColumnNameByRole(userRole);

    // Extract campus_id from email
    let campusId = extractCampusId(email, userRole);
    
    // For staff role: generate staff account_id if no campus_id extracted
    let staffAccountId = null;
    if (userRole === 'staff' && !campusId) {
      staffAccountId = await generateStaffAccountId();
      console.log(`✓ Generated staff account_id: ${staffAccountId}`);
    }
    
    console.log(`\n=== Registration Details ===`);
    console.log(`Email: ${email}`);
    console.log(`Final Role: ${userRole} (validated)`);
    console.log(`Google ID (if provided): ${google_id || 'None'}`);
    console.log(`Campus ID (for students/faculty): ${campusId || 'None'}`);
    console.log(`Staff Account ID (for staff only): ${staffAccountId || 'None'}`);
    console.log(`ID Column Name: ${idColumnName}`);
    console.log(`Role Table: ${roleTableName}`);
    console.log(`=============================\n`);
    
    // Validate campus_id was extracted for UMAK students and faculty
    // For staff/others (non-UMAK emails), campus_id can be null
    if ((userRole === 'student' || userRole === 'faculty') && !campusId) {
      return res.status(400).json({
        success: false,
        message: `Invalid email format for ${userRole}. Could not extract campus ID.`
      });
    }

    // Step 1: Check if user already exists in user_accounts (case-insensitive check)
    console.log(`\nStep 1: Checking if email already exists: ${trimmedEmail}`);
    
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('user_accounts')
        .select('email, system_id, created_at')
        .ilike('email', trimmedEmail)  // Use ilike for case-insensitive search
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing email:', checkError.code, checkError.message);
        // Only throw if it's not a "no rows found" error (PGRST116)
        if (checkError.code !== 'PGRST116') {
          throw checkError;
        }
      }
      
      if (existingUser) {
        const createdAt = new Date(existingUser.created_at);
        console.log(`⚠️ Email FOUND in database: ${existingUser.email}`);
        console.log(`   System ID: ${existingUser.system_id}`);
        console.log(`   Created at: ${createdAt.toISOString()}`);
        
        // Check if this is a ghost/orphaned account (created more than 1 hour ago but incomplete)
        const ageInMinutes = (Date.now() - createdAt.getTime()) / (1000 * 60);
        
        if (ageInMinutes > 60) {
          console.log(`   Account is ${Math.floor(ageInMinutes)} minutes old - might be orphaned, attempting cleanup...`);
          // Try to clean up old orphaned records
          await cleanupOrphanedAccount(existingUser.system_id);
          console.log(`✓ Cleaned up orphaned account, proceeding with new registration`);
        } else {
          console.log(`❌ Email already registered (recent record)`);
          return res.status(400).json({
            success: false,
            message: 'Email already registered',
            existingEmail: existingUser.email
          });
        }
      } else {
        console.log(`✓ Email is available: ${trimmedEmail}`);
      }
    } catch (error) {
      console.error('❌ Unexpected error during email check:', error);
      throw error;
    }

    // Step 2: Hash password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Step 3: Insert into user_accounts (main authentication table) with campus_id and optional google_id
    // For staff/others: campus_id = staffAccountId (e.g., 'OTH001') - stores in both tables for consistency
    // For students/faculty: campus_id = extracted from email (e.g., 'A12-12345')
    const userAccountData_insert = {
      email: trimmedEmail,
      password: hashedPassword,
      role: userRole.toLowerCase(), // Ensure role is lowercase and valid
      campus_id: (userRole === 'staff') ? staffAccountId : (campusId || null),  // Staff gets OTH ID, others get campus ID
      status: 'active'  // Set default status to active on registration
    };

    // Add google_id if provided (when signed up via Google auto-fill)
    if (google_id) {
      userAccountData_insert.google_id = google_id;
      console.log(`✓ Adding google_id to user_accounts: ${google_id}`);
    }

    console.log('Data being inserted into user_accounts:');
    console.log(`  Email: ${userAccountData_insert.email}`);
    console.log(`  Role: ${userAccountData_insert.role} (type: ${typeof userAccountData_insert.role})`);
    console.log(`  Campus ID: ${userAccountData_insert.campus_id} (OTH### for staff, campus ID for others)`);
    console.log(`  Status: ${userAccountData_insert.status}`);
    console.log(`  Google ID: ${userAccountData_insert.google_id || 'Not provided'}`);

    const { data: userAccountData, error: userAccountError } = await supabase
      .from('user_accounts')
      .insert([userAccountData_insert])
      .select();

    if (userAccountError) {
      console.error('❌ Error inserting into user_accounts');
      console.error('Error code:', userAccountError.code);
      console.error('Error message:', userAccountError.message);
      console.error('Error details:', userAccountError.details);
      console.error('Data that was being inserted:', userAccountData_insert);
      console.error('Full error object:', userAccountError);
      
      // Provide more specific error messages
      if (userAccountError.code === '23514' || userAccountError.message.includes('check constraint')) {
        // Check constraint violation
        if (userAccountError.message.includes('role')) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role value. Must be: student, faculty, or staff',
            error: 'Role constraint validation failed',
            receivedRole: userAccountData_insert.role
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid account configuration. Please check role settings.',
          error: 'Constraint validation failed'
        });
      }
      
      if (userAccountError.code === '23505') {
        // Unique constraint - email already exists
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Error creating user account',
        error: userAccountError.message,
        code: userAccountError.code
      });
    }

    const systemId = userAccountData[0].system_id;
    console.log(`\n=== User Account Created ===`);
    console.log(`System ID: ${systemId}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${userRole}`);
    console.log(`Campus ID/Staff Account ID: ${userAccountData[0].campus_id}`);
    console.log(`Google ID: ${userAccountData[0].google_id || 'Not set'}`);
    console.log(`Full user_accounts data:`, userAccountData[0]);
    console.log(`===========================\n`);

    // Step 4: Insert into role-specific table with system_id reference
    const roleSpecificData = {
      system_id: systemId,
      email: trimmedEmail,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName
    };

    // Add the appropriate ID column based on role
    if (userRole === 'student' || userRole === 'faculty') {
      // Students and faculty: use student_id or faculty_id from email
      roleSpecificData[idColumnName] = campusId;
      console.log(`Adding ${idColumnName}: ${campusId}`);
    } else if (userRole === 'staff') {
      // Staff: use account_id (generated OTH+numbers format that was stored separately)
      roleSpecificData.account_id = staffAccountId;
      console.log(`Adding account_id: ${staffAccountId}`);
    }
    
    // Add Google profile picture if available (from Google signup)
    if (profile_picture) {
      roleSpecificData.profile_picture = profile_picture;
      console.log(`✓ Adding Google profile picture URL: ${profile_picture.substring(0, 50)}...`);
    }

    console.log(`Inserting into ${roleTableName}:`, roleSpecificData);

    // CRITICAL FOR STAFF: Final verification that account_id is not already taken (before insert)
    if (userRole === 'staff') {
      console.log(`\n🔍 Final verification for ${roleTableName}: Checking if ${staffAccountId} is still available...`);
      const { data: finalCheck, error: finalCheckError } = await supabase
        .from(roleTableName)
        .select('account_id')
        .eq('account_id', staffAccountId)
        .maybeSingle();
      
      if (finalCheckError && finalCheckError.code !== 'PGRST116') {
        console.error('Error during final account_id check:', finalCheckError);
        throw finalCheckError;
      }
      
      if (finalCheck) {
        console.error(`\n❌ CRITICAL: ${staffAccountId} was taken between generation and insertion!`);
        // Try to regenerate with recursion
        const newStaffAccountId = await generateStaffAccountId();
        console.log(`✓ Regenerated new staff account_id: ${newStaffAccountId}`);
        
        // Update both user_accounts and roleSpecificData with new ID
        staffAccountId = newStaffAccountId;
        roleSpecificData.account_id = newStaffAccountId;
        userAccountData[0].campus_id = newStaffAccountId;
        
        // Need to update user_accounts to have the new campus_id
        const { error: updateError } = await supabase
          .from('user_accounts')
          .update({ campus_id: newStaffAccountId })
          .eq('system_id', systemId);
        
        if (updateError) {
          console.error('Error updating user_accounts with new account_id:', updateError);
          // Still try to continue
        } else {
          console.log(`✓ Updated user_accounts with new campus_id: ${newStaffAccountId}`);
        }
      } else {
        console.log(`✅ Verified: ${staffAccountId} is still available for insertion`);
      }
    }

    const { data: roleData, error: roleError } = await supabase
      .from(roleTableName)
      .insert([roleSpecificData])
      .select();

    if (roleError) {
      console.error(`❌ Error inserting into ${roleTableName}:`, roleError);
      console.error('Error code:', roleError.code);
      console.error('Error message:', roleError.message);
      
      // IMPORTANT: Cleanup - Delete from user_accounts since we couldn't create the profile
      // This prevents "email already registered" on next signup attempt
      console.log(`\n⚠️ Cleaning up: Deleting orphaned account from user_accounts...`);
      const { error: deleteError } = await supabase
        .from('user_accounts')
        .delete()
        .eq('system_id', systemId);
      
      if (deleteError) {
        console.error('Warning: Could not clean up user_accounts entry:', deleteError);
      } else {
        console.log(`✓ Cleanup successful - user_accounts entry deleted`);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Error creating user profile',
        error: roleError.message
      });
    }

    console.log(`User profile created in ${roleTableName} with account_id/campus_id: ${staffAccountId || campusId}`);

    // Step 5: Return success with combined user data
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: systemId,
        email: email,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        full_name: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
        role: userRole,
        campus_id: staffAccountId || campusId || null,
        account_id: staffAccountId || null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// ============================================
// User Login - New Implementation
// ============================================
function normalizeLoginEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidAdminRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'head';
}

function maskEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!value) return 'empty';

  const [localPart, domainPart] = value.split('@');
  if (!domainPart || !localPart) return 'invalid';

  const visibleLocal = localPart.slice(0, 2);
  return `${visibleLocal}***@${domainPart}`;
}

function isBcryptHash(passwordValue) {
  return typeof passwordValue === 'string' && /^\$2[aby]?\$/.test(passwordValue);
}

async function verifyBcryptPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(plainPassword, hashedPassword).catch(() => false);
}

async function getRoleProfileForUserAccount(userAccount) {
  const roleTable = getTableNameByRole(userAccount.role);

  const { data: profileBySystemId } = await supabase
    .from(roleTable)
    .select('*')
    .eq('system_id', userAccount.system_id)
    .maybeSingle();

  if (profileBySystemId) {
    return profileBySystemId;
  }

  if (userAccount.email) {
    const { data: profileByEmail } = await supabase
      .from(roleTable)
      .select('*')
      .eq('email', userAccount.email)
      .maybeSingle();

    if (profileByEmail) {
      return profileByEmail;
    }
  }

  return null;
}

exports.login = async (req, res) => {
  try {
    const { email, password, campusId } = req.body;

    console.log(`\n========== LOGIN START ==========`);
    console.log(`Login attempt - Email: ${email}, Campus ID: ${campusId}, Has Password: ${!!password}`);

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (!email && !campusId) {
      return res.status(400).json({
        success: false,
        message: 'Email or Campus ID is required'
      });
    }

    const loginIdentifier = normalizeLoginEmail(email || campusId);
    const normalizedCampusId = normalizeLoginEmail(campusId);

    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Email or Campus ID is required'
      });
    }

    console.log(`Normalized login identifier: ${loginIdentifier}`);
    console.log(`[login-debug] identifier=${maskEmail(loginIdentifier)} source=${email ? 'email' : 'campusId'}`);

    // 1) Admin login path: only via admin_accounts email
    const { data: adminRows, error: adminError } = await supabase
      .from('admin_accounts')
      .select('id, email, password, role, full_name, First_Name, Middle_Name, Last_Name, phone, auth_id, Google_ID');

    if (adminError) {
      console.warn('Admin account lookup error:', adminError.message);
    }

    const adminUser = (adminRows || []).find((row) => normalizeLoginEmail(row.email) === loginIdentifier) || null;

    console.log(`[login-debug] admin_accounts lookup=${adminUser ? 'hit' : 'miss'} scanned=${adminRows?.length || 0} role=${adminUser?.role || 'n/a'}`);

    if (adminUser && isValidAdminRole(adminUser.role)) {
      const adminPasswordMatch = isBcryptHash(adminUser.password)
        ? await verifyBcryptPassword(password, adminUser.password)
        : String(password) === String(adminUser.password);

      if (adminPasswordMatch) {
        const fullName =
          adminUser.full_name ||
          [adminUser.First_Name, adminUser.Middle_Name, adminUser.Last_Name].filter(Boolean).join(' ') ||
          'Admin User';

        const firstName = adminUser.First_Name || fullName.split(' ')[0] || 'Admin';
        const lastName = adminUser.Last_Name || fullName.split(' ').slice(1).join(' ') || 'User';
        const normalizedRole = String(adminUser.role || 'admin').trim().toLowerCase();

        return res.json({
          success: true,
          message: 'Login successful',
          isAdmin: true,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            first_name: firstName,
            middle_name: adminUser.Middle_Name || null,
            last_name: lastName,
            full_name: fullName,
            role: normalizedRole,
            account_type: 'admin_accounts',
            phone: adminUser.phone || null,
            auth_id: adminUser.auth_id || null,
            google_id: adminUser.Google_ID || null
          }
        });
      }
    }

    // 2) Regular user login path: MUST use user_accounts table
    let userAccount = null;

    if (email) {
      const { data: userByEmail, error: userByEmailError } = await supabase
        .from('user_accounts')
        .select('system_id, email, role, password, campus_id, google_id, status')
        .ilike('email', loginIdentifier)
        .maybeSingle();

      if (userByEmailError && userByEmailError.code !== 'PGRST116') {
        console.warn('user_accounts email lookup error:', userByEmailError.message);
      }

      if (userByEmail) {
        userAccount = userByEmail;
      }
    }

    if (!userAccount && campusId) {
      const { data: userByCampusId, error: userByCampusIdError } = await supabase
        .from('user_accounts')
        .select('system_id, email, role, password, campus_id, google_id, status')
        .ilike('campus_id', normalizedCampusId)
        .maybeSingle();

      if (userByCampusIdError && userByCampusIdError.code !== 'PGRST116') {
        console.warn('user_accounts campus_id lookup error:', userByCampusIdError.message);
      }

      if (userByCampusId) {
        userAccount = userByCampusId;
      }
    }

    console.log(`[login-debug] user_accounts lookup=${userAccount ? 'hit' : 'miss'} role=${userAccount?.role || 'n/a'} status=${userAccount?.status || 'n/a'}`);

    if (!userAccount) {
      console.log(`\n❌ LOGIN FAILED: User Not Found`);
      console.log(`Search value: ${campusId || email}`);
      console.log(`=====================================\n`);
      return res.status(401).json({
        success: false,
        message: 'Email not found or invalid credentials'
      });
    }

    // Check if user account is suspended
    if (userAccount.status === 'suspended') {
      console.log(`\n❌ LOGIN FAILED: Account Suspended`);
      console.log(`User: ${userAccount.email}`);
      console.log(`Status: ${userAccount.status}`);
      console.log(`=====================================\n`);
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact an administrator for assistance.',
        accountStatus: 'suspended'
      });
    }

    if (!userAccount.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google sign-in. Please continue with Google.'
      });
    }

    const validPassword = isBcryptHash(userAccount.password)
      ? await verifyBcryptPassword(password, userAccount.password)
      : String(password) === String(userAccount.password);

    console.log(`[login-debug] user_accounts passwordFormat=${isBcryptHash(userAccount.password) ? 'bcrypt' : 'plaintext'} passwordMatch=${validPassword}`);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const normalizedRole = String(userAccount.role || 'staff').trim().toLowerCase();
    const roleProfile = await getRoleProfileForUserAccount(userAccount);
    const firstName = roleProfile?.first_name || userAccount.email?.split('@')[0] || 'User';
    const middleName = roleProfile?.middle_name || null;
    const lastName = roleProfile?.last_name || '';
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim() || firstName;

    return res.json({
      success: true,
      message: 'Login successful',
      isAdmin: false,
      user: {
        id: userAccount.system_id,
        email: userAccount.email,
        campus_id: userAccount.campus_id || null,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        full_name: fullName,
        role: normalizedRole,
        account_type: 'user_accounts',
        google_id: userAccount.google_id || null,
        profile_picture: roleProfile?.profile_picture || null,
        points: roleProfile?.points || 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// ============================================
// User Logout
// ============================================
exports.logout = async (req, res) => {
  try {
    // Extract user info from request if available
    const userEmail = req.body?.email || req.user?.email || 'unknown';
    const timestamp = new Date().toISOString();
    
    console.log('\n========== LOGOUT START ==========');
    console.log(`Timestamp: ${timestamp}`);
    console.log(`User: ${userEmail}`);
    console.log(`IP Address: ${req.ip}`);
    console.log('==================================\n');
    
    // In a stateless JWT/Session setup, logout is primarily handled on the client
    // This endpoint serves as a backend confirmation point and can handle:
    // 1. Logging logout events for audit trail
    // 2. Invalidating any server-side tokens (if using). 
    // 3. Clearing any server-side sessions
    
    // Optional: Log logout event to database for audit trail (uncomment if audit is needed)
    // await supabase
    //   .from('audit_logs')
    //   .insert([{
    //     user_email: userEmail,
    //     action: 'logout',
    //     timestamp: timestamp,
    //     ip_address: req.ip
    //   }]);
    
    console.log(`✓ User ${userEmail} logged out successfully`);
    
    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: timestamp,
      user: userEmail
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
};



// ============================================
// Google OAuth - Handle Google Token
// ============================================
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    console.log('\n========== GOOGLE LOGIN START ==========');

    if (!token) {
      console.error('❌ No token provided');
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Decode token (basic JWT decode - in production, verify with Google)
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleData = JSON.parse(jsonPayload);

      const { email, name, picture, sub } = googleData;
      const trimmedEmail = email.trim().toLowerCase();
      console.log(`📧 Google User: ${trimmedEmail}, Name: ${name}`);

      // Parse name
      const nameParts = name ? name.split(' ') : ['User', ''];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

      // Classify role based on email
      const userRole = classifyEmailRole(trimmedEmail);
      const roleTableName = getTableNameByRole(userRole);
      const idColumnName = getIdColumnNameByRole(userRole);
      let campusId = extractCampusId(trimmedEmail, userRole);  // Use 'let' not 'const' for reassignability
      
      // For staff role: generate staff account_id if no campus_id extracted
      if (userRole === 'staff' && !campusId) {
        campusId = await generateStaffAccountId();
        console.log(`✓ Generated staff account_id: ${campusId}`);
      }

      console.log(`👤 Role: ${userRole}, Table: ${roleTableName}, ID: ${campusId}`);

      // Step 1: Check if user already exists in user_accounts
      console.log(`\n✓ Step 1: Checking if user exists in user_accounts (email: ${trimmedEmail})...`);
      console.log(`  Google ID received from token: ${sub}`);
      
      const { data: existingUser, error: existingUserError } = await supabase
        .from('user_accounts')
        .select('system_id, role, google_id, email, password')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (existingUserError && existingUserError.code !== 'PGRST116') {
        console.error('Database error checking existing user:', existingUserError);
      }

      if (existingUser) {
        console.log(`✓ User exists! System ID: ${existingUser.system_id}`);
        console.log(`  Existing google_id in database: ${existingUser.google_id || 'Not set'}`);
        console.log(`  User email: ${existingUser.email}`);
        console.log(`  User role: ${existingUser.role}`);
        
        // If user doesn't have google_id yet, update it (for users who signed up via Google auto-fill form)
        if (!existingUser.google_id && sub) {
          console.log(`\n✓ Updating google_id for existing user...`);
          console.log(`  Setting google_id to: ${sub}`);
          
          const { error: updateError } = await supabase
            .from('user_accounts')
            .update({ google_id: sub })
            .eq('system_id', existingUser.system_id);
          
          if (updateError) {
            console.warn(`⚠️ Could not update google_id:`, updateError);
          } else {
            console.log(`✓ Successfully updated google_id: ${sub}`);
          }
        } else if (existingUser.google_id) {
          console.log(`✓ User already has google_id set, skipping update`);
        }
        
        // User exists, fetch profile from role-specific table
        console.log(`\n✓ Fetching profile from ${roleTableName} table...`);
        const { data: userProfile, error: profileError } = await supabase
          .from(roleTableName)
          .select('*')
          .eq('system_id', existingUser.system_id)
          .single();

        if (profileError) {
          console.error(`Error fetching profile from ${roleTableName}:`, profileError);
        }

        if (userProfile) {
          console.log(`✓ Profile found! Name: ${userProfile.first_name} ${userProfile.last_name}`);
          console.log('========== GOOGLE LOGIN SUCCESS (EXISTING USER) ==========\n');
          
          return res.json({
            success: true,
            message: 'Login successful',
            user: {
              id: existingUser.system_id,
              email: userProfile.email,
              first_name: userProfile.first_name,
              middle_name: userProfile.middle_name,
              last_name: userProfile.last_name,
              full_name: `${userProfile.first_name} ${userProfile.middle_name ? userProfile.middle_name + ' ' : ''}${userProfile.last_name}`.trim(),
              role: existingUser.role,
              points: userProfile.points || 0,
              profile_picture: userProfile.profile_picture || null
            },
            isNew: false
          });
        } else {
          console.warn(`⚠️ Profile found in user_accounts but not in ${roleTableName} table`);
        }
      } else {
        console.log(`ℹ️ User does not exist - creating new account...`);
      }

      // Step 2: Create new user - Insert into user_accounts first
      console.log(`\n✓ Step 2: Creating account in user_accounts table...`);
      const { data: newUserAccount, error: userAccountError } = await supabase
        .from('user_accounts')
        .insert([
          {
            email: trimmedEmail,
            password: null, // No password for Google OAuth users
            role: userRole,
            campus_id: campusId || null,
            google_id: sub
          }
        ])
        .select();

      if (userAccountError) {
        console.error('❌ Error inserting into user_accounts:', userAccountError);
        return res.status(400).json({
          success: false,
          message: 'Error creating user account',
          error: userAccountError.message
        });
      }

      const systemId = newUserAccount[0].system_id;
      console.log(`✓ User created in user_accounts! System ID: ${systemId}`);

      // Step 3: Insert into role-specific table with system_id reference
      console.log(`\n✓ Step 3: Creating profile in ${roleTableName} table...`);
      const roleSpecificData = {
        system_id: systemId,
        email: trimmedEmail,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        profile_picture: picture,
        points: 0  // Initialize with 0 points (SAME AS MANUAL SIGNUP)
      };

      // Add the appropriate ID column based on role
      if (userRole === 'student' || userRole === 'faculty') {
        // Students and faculty: use student_id or faculty_id
        roleSpecificData[idColumnName] = campusId;
        console.log(`Adding ${idColumnName}: ${campusId}`);
      } else if (userRole === 'staff') {
        // Staff: use account_id (generated OTH+numbers format)
        roleSpecificData.account_id = campusId; // campusId is actually account_id for staff
        console.log(`Adding account_id: ${campusId}`);
      }

      console.log(`Profile data to insert:`, roleSpecificData);

      const { data: newUserProfile, error: profileError } = await supabase
        .from(roleTableName)
        .insert([roleSpecificData])
        .select();

      if (profileError) {
        console.error(`❌ Error inserting into ${roleTableName}:`, profileError);
        
        // IMPORTANT: Cleanup - Delete from user_accounts since we couldn't create the profile
        // This prevents "email already registered" on next signup attempt
        console.log(`\n⚠️ Cleaning up: Deleting orphaned account from user_accounts...`);
        const { error: deleteError } = await supabase
          .from('user_accounts')
          .delete()
          .eq('system_id', systemId);
        
        if (deleteError) {
          console.error('Warning: Could not clean up user_accounts entry:', deleteError);
        } else {
          console.log(`✓ Cleanup successful - user_accounts entry deleted`);
        }
        
        return res.status(400).json({
          success: false,
          message: 'Error creating user profile',
          error: profileError.message
        });
      }

      console.log(`✓ Profile created in ${roleTableName}!`);
      console.log('========== GOOGLE LOGIN SUCCESS (NEW USER) ==========\n');

      res.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: systemId,
          email: newUserProfile[0].email,
          first_name: newUserProfile[0].first_name,
          middle_name: newUserProfile[0].middle_name,
          last_name: newUserProfile[0].last_name,
          full_name: `${newUserProfile[0].first_name} ${newUserProfile[0].middle_name ? newUserProfile[0].middle_name + ' ' : ''}${newUserProfile[0].last_name}`.trim(),
          role: userRole,
          points: newUserProfile[0].points || 0,
          profile_picture: newUserProfile[0].profile_picture || null
        },
        isNew: true
      });
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        error: decodeError.message
      });
    }
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google login',
      error: error.message
    });
  }
};

// ============================================
// Get User Profile Data - Backend API
// ============================================
exports.getProfile = async (req, res) => {
  try {
    const { system_id, email } = req.body;

    if (!system_id && !email) {
      return res.status(400).json({
        success: false,
        message: 'system_id or email is required'
      });
    }

    console.log('\n--- Getting Profile Data ---');
    console.log('Requested by system_id:', system_id, 'or email:', email);

    // First, get user_accounts entry
    let userAccountData = null;
    let queryError = null;

    // Try by system_id
    if (system_id) {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('system_id', system_id)
        .maybeSingle();
      
      if (error) {
        console.warn('Query error by system_id:', error.message);
        queryError = error;
      } else if (data) {
        userAccountData = data;
        console.log('✓ Found by system_id');
      }
    }

    // Fallback: try by email
    if (!userAccountData && email) {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error) {
        console.warn('Query error by email:', error.message);
      } else if (data) {
        userAccountData = data;
        console.log('✓ Found by email');
      }
    }

    if (!userAccountData) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    console.log('✓ User account found:', {
      system_id: userAccountData.system_id,
      email: userAccountData.email,
      role: userAccountData.role,
      campus_id: userAccountData.campus_id
    });

    // Now get role-specific data
    const roleTableMap = {
      'student': 'student_accounts',
      'faculty': 'faculty_accounts',
      'staff': 'other_accounts'
    };

    const roleTable = roleTableMap[userAccountData.role];
    if (!roleTable) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role: ' + userAccountData.role
      });
    }

    console.log('Fetching from role table:', roleTable);

    let roleData = null;

    // Try by system_id
    const { data: roleBySystemId, error: roleError1 } = await supabase
      .from(roleTable)
      .select('*')
      .eq('system_id', userAccountData.system_id)
      .maybeSingle();

    if (roleBySystemId) {
      roleData = roleBySystemId;
      console.log('✓ Found in', roleTable, 'by system_id');
    }

    // Fallback: try by email
    if (!roleData && userAccountData.email) {
      const { data: roleByEmail } = await supabase
        .from(roleTable)
        .select('*')
        .eq('email', userAccountData.email)
        .maybeSingle();

      if (roleByEmail) {
        roleData = roleByEmail;
        console.log('✓ Found in', roleTable, 'by email');
      }
    }

    // Fallback: try by campus_id
    if (!roleData && userAccountData.campus_id && roleTable === 'student_accounts') {
      const { data: roleByCampusId } = await supabase
        .from(roleTable)
        .select('*')
        .eq('campus_id', userAccountData.campus_id)
        .maybeSingle();

      if (roleByCampusId) {
        roleData = roleByCampusId;
        console.log('✓ Found in', roleTable, 'by campus_id');
      }
    }

    if (!roleData) {
      console.warn('⚠️ No role data found, returning defaults');
      roleData = {
        first_name: userAccountData.email?.split('@')[0] || 'User',
        middle_name: '',
        last_name: '',
        points: 0,
        created_at: new Date().toISOString()
      };
    }

    console.log('✓ Profile data retrieved successfully');

    res.json({
      success: true,
      profile: {
        system_id: userAccountData.system_id,
        email: userAccountData.email,
        role: userAccountData.role,
        campus_id: userAccountData.campus_id,
        first_name: roleData.first_name,
        middle_name: roleData.middle_name,
        last_name: roleData.last_name,
        birthdate: roleData.birthdate || null,
        sex: roleData.sex || null,
        points: roleData.points || 0,
        created_at: userAccountData.created_at,
        profile_picture: roleData.profile_picture || null,
        // Student-specific fields
        student_id: roleData.student_id || null,
        program: roleData.program || null,
        year_level: roleData.year_level || null,
        cor: roleData.cor || null,
        // Faculty-specific fields
        faculty_id: roleData.faculty_id || null,
        department: roleData.department || null,
        position: roleData.position || null,
        // Staff/Other-specific fields
        account_id: roleData.account_id || null,
        designation: roleData.designation || null,
        institution: roleData.institution || null
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// Update User Profile - Backend API
// ============================================
exports.updateProfile = async (req, res) => {
  try {
    const { 
      system_id, firstname, middleName, lastName, email,
      birthdate, sex, program, yearLevel, cor,
      department, position, designation, institution,
      profile_picture
    } = req.body;

    if (!system_id || !firstname || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'system_id, firstname and lastName are required'
      });
    }

    console.log('\n--- Updating Profile Data ---');
    console.log('Updating system_id:', system_id);

    // Get user account to determine role
    const { data: userAccountData, error: userError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('system_id', system_id)
      .maybeSingle();

    if (userError || !userAccountData) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    const roleTableMap = {
      'student': 'student_accounts',
      'faculty': 'faculty_accounts',
      'staff': 'other_accounts'
    };

    const roleTable = roleTableMap[userAccountData.role];
    if (!roleTable) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role: ' + userAccountData.role
      });
    }

    console.log('Updating profile in:', roleTable);

    // Build update object with all provided fields
    const updateObject = {
      first_name: firstname,
      middle_name: middleName || null,
      last_name: lastName,
      birthdate: birthdate || null,
      sex: sex || null,
      updated_at: new Date().toISOString()
    };

    // Add role-specific fields (but NOT ID fields - they cannot be updated)
    if (userAccountData.role === 'student') {
      if (program) updateObject.program = program;
      if (yearLevel) updateObject.year_level = yearLevel;
      if (department) updateObject.department = department; // Department for students
      if (cor) updateObject.cor = cor; // COR image signed URL
    } else if (userAccountData.role === 'faculty') {
      if (department) updateObject.department = department;
      if (position) updateObject.position = position;
    } else if (userAccountData.role === 'staff') {
      if (designation) updateObject.designation = designation;
      if (institution) updateObject.institution = institution;
    }
    
    // Add profile picture (available for all roles)
    if (profile_picture) updateObject.profile_picture = profile_picture;

    console.log('Update object:', updateObject);

    // Update the role-specific table
    const { error: updateError } = await supabase
      .from(roleTable)
      .update(updateObject)
      .eq('system_id', system_id);

    if (updateError) {
      throw updateError;
    }

    console.log('✓ Profile updated successfully');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updateObject
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
