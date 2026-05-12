// Admin Dashboard Controller
// Handles admin dashboard data, stats, and admin account management
// Based on admin_accounts table schema

const supabase = require('../config/supabase');
const timestampUtils = require('../lib/timestampUtils');

// ============================================
// Resolve Admin Account
// ============================================
async function resolveAdminAccount(adminId, email) {
  let account = null;

  // Try by ID first
  if (adminId) {
    const { data: accountById, error: accountByIdError } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, phone, created_at, updated_at, First_Name, Middle_Name, Last_Name, is_archived, archived_at')
      .eq('id', adminId)
      .maybeSingle();

    if (accountByIdError && accountByIdError.code !== 'PGRST116') {
      console.warn('Admin account lookup by id error:', accountByIdError.message);
    }

    if (accountById) {
      account = accountById;
    }
  }

  // Try by email if not found
  if (!account && email) {
    const { data: accountByEmail, error: accountByEmailError } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, phone, created_at, updated_at, First_Name, Middle_Name, Last_Name, is_archived, archived_at')
      .ilike('email', email)
      .maybeSingle();

    if (accountByEmailError && accountByEmailError.code !== 'PGRST116') {
      console.warn('Admin account lookup by email error:', accountByEmailError.message);
    }

    if (accountByEmail) {
      account = accountByEmail;
    }
  }

  return account;
}

// ============================================
// Get Admin Dashboard
// ============================================
exports.getAdminDashboard = async (req, res) => {
  try {
    const adminId = req.query.adminId || req.body.adminId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();

    if (!adminId && !email) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID or email is required'
      });
    }

    const account = await resolveAdminAccount(adminId, email);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    // Check if admin is archived
    if (account.is_archived) {
      return res.status(403).json({
        success: false,
        message: 'This admin account has been archived'
      });
    }

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      adminId: account.id,
      email: account.email,
      fullName: account.full_name,
      role: account.role,
      message: `Welcome back, ${account.full_name || account.email}!`
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      message: 'Error loading admin dashboard'
    });
  }
};

// ============================================
// Get Admin Stats
// ============================================
exports.getAdminStats = async (req, res) => {
  try {
    const adminId = req.query.adminId || req.body.adminId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();

    if (!adminId && !email) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID or email is required'
      });
    }

    const account = await resolveAdminAccount(adminId, email);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    // Check if admin is archived
    if (account.is_archived) {
      return res.status(403).json({
        success: false,
        message: 'This admin account has been archived'
      });
    }

    // Get all active admins for ranking
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, created_at, is_archived')
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (allAdminsError) {
      console.warn('Admin accounts lookup error:', allAdminsError.message);
    }

    // Calculate admin position (by creation date - first admin is #1)
    const adminPosition = (allAdmins || []).findIndex((admin) => admin.id === account.id) + 1;
    const totalAdmins = (allAdmins || []).length;

    res.json({
      success: true,
      stats: {
        adminId: account.id,
        email: account.email,
        fullName: account.full_name,
        role: account.role,
        phone: account.phone,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        adminPosition: adminPosition > 0 ? adminPosition : 0,
        totalAdmins: totalAdmins,
        isArchived: account.is_archived,
        archivedAt: account.archived_at,
        memberSince: account.created_at,
        status: account.is_archived ? 'Archived' : 'Active'
      },
      source: 'admin_accounts'
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get Admin Rank Info (Helper function)
// ============================================
async function getAdminRankInfo(adminId, email) {
  try {
    // Get admin's information
    const { data: adminAccount, error: adminError } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, created_at, is_archived')
      .or(`id.eq.${adminId},email.ilike.${email}`)
      .maybeSingle();

    // If admin is not found or is archived, return special "not ranked" status
    if (adminError || !adminAccount || adminAccount.is_archived) {
      console.log('[Admin Rank] Admin not found or archived:', { adminId, email });
      return {
        notRanked: true,
        message: adminAccount?.is_archived ? 'Admin account archived' : 'Admin not found',
        isArchived: adminAccount?.is_archived || false
      };
    }

    // Get all active admins sorted by creation date (first admin is #1)
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, created_at')
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (allAdminsError || !allAdmins || allAdmins.length === 0) {
      console.log('[Admin Rank] Error fetching admin list or no admins found');
      return {
        notRanked: true,
        message: 'Unable to calculate rank',
        isArchived: false
      };
    }

    // Calculate rank based on creation date (first admin = rank 1)
    let rank = 1;
    for (let i = 0; i < allAdmins.length; i++) {
      if (allAdmins[i].id === adminAccount.id) {
        rank = i + 1;
        break;
      }
    }

    const totalAdmins = allAdmins.length;
    const percentile = totalAdmins > 0 ? Math.round(((totalAdmins - rank + 1) / totalAdmins) * 100) : 0;

    return {
      id: adminAccount.id,
      email: adminAccount.email,
      fullName: adminAccount.full_name,
      role: adminAccount.role,
      createdAt: adminAccount.created_at,
      rank: rank,
      totalAdmins: totalAdmins,
      percentile: percentile,
      notRanked: false,
      isArchived: false
    };
  } catch (error) {
    console.error('Error calculating admin rank:', error);
    return {
      notRanked: true,
      message: 'Error calculating rank',
      isArchived: false
    };
  }
}

// ============================================
// Get Admin Profile
// ============================================
exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.query.adminId || req.body.adminId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();

    if (!adminId && !email) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID or email is required'
      });
    }

    const account = await resolveAdminAccount(adminId, email);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    // Get admin rank information
    const rankInfo = await getAdminRankInfo(account.id, account.email);

    // Build rank response based on whether admin is ranked or not
    let rankResponse = null;
    if (rankInfo) {
      if (rankInfo.notRanked) {
        // Admin is not ranked (archived or error)
        rankResponse = {
          notRanked: true,
          message: rankInfo.message || 'Not ranked',
          displayText: rankInfo.isArchived ? 'Account Archived' : 'Not ranked',
          isArchived: rankInfo.isArchived
        };
      } else {
        // Admin has a rank
        rankResponse = {
          notRanked: false,
          rank: rankInfo.rank,
          totalAdmins: rankInfo.totalAdmins,
          percentile: rankInfo.percentile,
          displayText: `#${rankInfo.rank} of ${rankInfo.totalAdmins}`,
          isArchived: false
        };
      }
    }

    res.json({
      success: true,
      admin: {
        id: account.id,
        email: account.email,
        fullName: account.full_name,
        firstName: account.First_Name,
        middleName: account.Middle_Name,
        lastName: account.Last_Name,
        role: account.role,
        phone: account.phone,
        profilePicture: account.Profile_Picture || account.profile_picture,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        isArchived: account.is_archived,
        archivedAt: account.archived_at,
        archivedByEmail: account.archived_by_email,
        archiveReason: account.archive_reason
      },
      rank: rankResponse,
      source: 'admin_accounts'
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get All Active Admins
// ============================================
exports.getAllActiveAdmins = async (req, res) => {
  try {
    const { data: admins, error: adminsError } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, phone, created_at, is_archived')
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (adminsError) {
      console.warn('Error fetching active admins:', adminsError.message);
      return res.status(400).json({
        success: false,
        message: 'Error fetching admin list',
        error: adminsError.message
      });
    }

    // Add rank to each admin
    const adminsWithRank = (admins || []).map((admin, index) => ({
      ...admin,
      rank: index + 1,
      totalAdmins: admins.length,
      displayText: `#${index + 1} of ${admins.length}`
    }));

    res.json({
      success: true,
      admins: adminsWithRank,
      totalAdmins: adminsWithRank.length,
      source: 'admin_accounts'
    });
  } catch (error) {
    console.error('Error fetching all admins:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get Archived Admins
// ============================================
exports.getArchivedAdmins = async (req, res) => {
  try {
    const { data: archivedAdmins, error: archivedError } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, role, phone, created_at, is_archived, archived_at, archived_by_email, archive_reason')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false });

    if (archivedError) {
      console.warn('Error fetching archived admins:', archivedError.message);
      return res.status(400).json({
        success: false,
        message: 'Error fetching archived admin list',
        error: archivedError.message
      });
    }

    res.json({
      success: true,
      archivedAdmins: archivedAdmins || [],
      totalArchived: (archivedAdmins || []).length,
      source: 'admin_accounts'
    });
  } catch (error) {
    console.error('Error fetching archived admins:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Archive Admin Account
// ============================================
exports.archiveAdminAccount = async (req, res) => {
  try {
    const adminIdToArchive = req.body.adminIdToArchive;
    const archiveReason = req.body.archiveReason || 'No reason provided';
    const archivedByEmail = req.body.archivedByEmail;

    if (!adminIdToArchive) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID to archive is required'
      });
    }

    if (!archivedByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Archived by email is required'
      });
    }

    // Update admin account to archived
    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admin_accounts')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by_email: archivedByEmail,
        archive_reason: archiveReason
      })
      .eq('id', adminIdToArchive)
      .select();

    if (updateError) {
      console.error('Error archiving admin:', updateError.message);
      return res.status(400).json({
        success: false,
        message: 'Error archiving admin account',
        error: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Admin account archived successfully',
      admin: updatedAdmin[0] || null
    });
  } catch (error) {
    console.error('Archive admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Restore Admin Account
// ============================================
exports.restoreAdminAccount = async (req, res) => {
  try {
    const adminIdToRestore = req.body.adminIdToRestore;
    const restoredByEmail = req.body.restoredByEmail;

    if (!adminIdToRestore) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID to restore is required'
      });
    }

    // Update admin account to not archived
    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admin_accounts')
      .update({
        is_archived: false,
        archived_at: null,
        archived_by_email: null,
        archive_reason: null
      })
      .eq('id', adminIdToRestore)
      .select();

    if (updateError) {
      console.error('Error restoring admin:', updateError.message);
      return res.status(400).json({
        success: false,
        message: 'Error restoring admin account',
        error: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Admin account restored successfully',
      admin: updatedAdmin[0] || null
    });
  } catch (error) {
    console.error('Restore admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Update Admin Profile
// ============================================
exports.updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.body.adminId;
    const updateData = {
      full_name: req.body.fullName,
      First_Name: req.body.firstName,
      Middle_Name: req.body.middleName,
      Last_Name: req.body.lastName,
      phone: req.body.phone,
      Profile_Picture: req.body.profilePicture,
      updated_at: new Date().toISOString()
    };

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admin_accounts')
      .update(updateData)
      .eq('id', adminId)
      .select();

    if (updateError) {
      console.error('Error updating admin profile:', updateError.message);
      return res.status(400).json({
        success: false,
        message: 'Error updating admin profile',
        error: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Admin profile updated successfully',
      admin: updatedAdmin[0] || null
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  resolveAdminAccount,
  getAdminDashboard,
  getAdminStats,
  getAdminProfile,
  getAllActiveAdmins,
  getArchivedAdmins,
  archiveAdminAccount,
  restoreAdminAccount,
  updateAdminProfile,
  getAdminRankInfo
};
