// Dashboard Controller
// Handles user dashboard data, stats, and waste tracking

const supabase = require('../config/supabase');
const timestampUtils = require('../lib/timestampUtils');

async function resolveUserAccount(userId, email) {
  let account = null;

  if (userId) {
    const { data: accountBySystemId, error: accountBySystemIdError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id, role, created_at')
      .eq('system_id', userId)
      .maybeSingle();

    if (accountBySystemIdError && accountBySystemIdError.code !== 'PGRST116') {
      console.warn('User account lookup by system_id error:', accountBySystemIdError.message);
    }

    if (accountBySystemId) {
      account = accountBySystemId;
    }
  }

  if (!account && email) {
    const { data: accountByEmail, error: accountByEmailError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id, role, created_at')
      .ilike('email', email)
      .maybeSingle();

    if (accountByEmailError && accountByEmailError.code !== 'PGRST116') {
      console.warn('User account lookup by email error:', accountByEmailError.message);
    }

    if (accountByEmail) {
      account = accountByEmail;
    }
  }

  if (!account && userId) {
    const { data: accountByCampusId, error: accountByCampusIdError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id, role, created_at')
      .eq('campus_id', userId)
      .maybeSingle();

    if (accountByCampusIdError && accountByCampusIdError.code !== 'PGRST116') {
      console.warn('User account lookup by campus_id error:', accountByCampusIdError.message);
    }

    if (accountByCampusId) {
      account = accountByCampusId;
    }
  }

  if (!account && (userId || email)) {
    let usersQuery = supabase
      .from('users')
      .select('id, email, role')
      .limit(1);

    if (userId) {
      usersQuery = usersQuery.or(`id.eq.${userId}${email ? `,email.eq.${email}` : ''}`);
    } else if (email) {
      usersQuery = usersQuery.ilike('email', email);
    }

    const { data: legacyUser, error: legacyUserError } = await usersQuery.maybeSingle();

    if (legacyUserError && legacyUserError.code !== 'PGRST116') {
      console.warn('Legacy users table lookup error:', legacyUserError.message);
    }

    if (legacyUser) {
      account = {
        id: legacyUser.id,
        system_id: legacyUser.id,
        email: legacyUser.email,
        role: legacyUser.role || 'user',
        campus_id: null,
        created_at: null
      };
    }
  }

  return account;
}

// ============================================
// Get User Dashboard
// ============================================
exports.getDashboard = async (req, res) => {
  try {
    // TODO: Extract user ID from JWT token or session
    const userId = req.query.userId || 'demo-user';

    res.render('user/dashboard', {
      title: 'My Dashboard',
      userId: userId,
      message: 'Welcome to your BinTECH Dashboard!'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      message: 'Error loading dashboard'
    });
  }
};

// ============================================
// Get User Statistics
// ============================================
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    const account = await resolveUserAccount(userId, email);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { data: pointsBySystemId } = await supabase
      .from('account_points')
      .select('system_id, email, points, total_points, total_waste')
      .eq('system_id', account.system_id)
      .maybeSingle();

    let pointsData = pointsBySystemId;

    if (!pointsData && account.email) {
      const { data: pointsByEmail } = await supabase
        .from('account_points')
        .select('system_id, email, points, total_points, total_waste')
        .ilike('email', account.email)
        .maybeSingle();

      pointsData = pointsByEmail || null;
    }

    const { data: categoryRows, error: categoryError } = await supabase
      .from('user_waste_category_totals')
      .select('category_type, quantity')
      .eq('system_id', account.system_id);

    if (categoryError) {
      console.warn('Dashboard category totals lookup error:', categoryError.message);
    }

    const categories = {
      Plastic: 0,
      Paper: 0,
      Metal: 0
    };

    for (const row of (categoryRows || [])) {
      const key = String(row.category_type || '').trim();
      if (Object.prototype.hasOwnProperty.call(categories, key)) {
        categories[key] = Number(row.quantity || 0);
      }
    }

    const topCategoryRow = (categoryRows || [])
      .slice()
      .sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))[0] || null;

    const totalPoints = Number(pointsData?.points ?? 0);
    const totalWaste = Number(pointsData?.total_waste ?? 0);
    const lifetimePoints = Number(pointsData?.total_points ?? totalPoints);

    const { data: leaderboardRows, error: leaderboardError } = await supabase
      .from('account_points')
      .select('system_id, points')
      .order('points', { ascending: false });

    if (leaderboardError) {
      console.warn('Dashboard leaderboard query error:', leaderboardError.message);
    }

    const leaderboardPosition = (leaderboardRows || []).findIndex((row) => row.system_id === account.system_id) + 1;

    res.json({
      success: true,
      stats: {
        totalPoints,
        totalLifetimePoints: lifetimePoints,
        disposalCount: totalWaste,
        leaderboardPosition: leaderboardPosition > 0 ? leaderboardPosition : 0,
        memberSince: account.created_at,
        level: Math.floor(lifetimePoints / 100) + 1,
        categories,
        topCategory: topCategoryRow
          ? {
              categoryType: String(topCategoryRow.category_type || ''),
              quantity: Number(topCategoryRow.quantity || 0)
            }
          : null
      },
      source: 'account_points_and_user_waste_category_totals'
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get Waste Disposal History
// ============================================
exports.getDisposalHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const { data, error } = await supabase
      .from('disposal_history')
      .select('id, waste_type, quantity, points_earned, created_at, bin_location')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching history',
        error: error.message
      });
    }

    res.json({
      success: true,
      history: data || []
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get User Leaderboard Position
// ============================================
exports.getLeaderboardPosition = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const email = req.query.email || req.body.email;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    // Query to get user rank with total users count
    // Using ROW_NUMBER to rank users by points in descending order
    const { data: rankData, error: rankError } = await supabase.rpc('get_user_rank', {
      p_user_id: userId || null,
      p_email: email || null
    });

    if (rankError) {
      console.error('Error fetching user rank:', rankError);
      
      // Fallback: Use direct query if RPC function doesn't exist
      const { data: userPoints, error: pointsError } = await supabase
        .from('account_points')
        .select('system_id, email, points, campus_id')
        .or(`system_id.eq.${userId},email.eq.${email}`)
        .single();

      if (pointsError || !userPoints) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get total users and count users with more points
      const { data: allUsers, error: allUsersError } = await supabase
        .from('account_points')
        .select('points', { count: 'exact' })
        .order('points', { ascending: false });

      if (allUsersError) {
        return res.status(400).json({
          success: false,
          message: 'Error fetching leaderboard data'
        });
      }

      // Calculate rank - find position in sorted list
      let userRank = 1;
      for (let i = 0; i < allUsers.length; i++) {
        if (allUsers[i].points < userPoints.points) {
          userRank = i + 1;
          break;
        }
      }
      
      const totalUsers = allUsers.length;

      return res.json({
        success: true,
        user: {
          system_id: userPoints.system_id,
          email: userPoints.email,
          points: userPoints.points,
          campus_id: userPoints.campus_id
        },
        leaderboardPosition: userRank,
        totalUsers: totalUsers,
        userRank: `#${userRank} of ${totalUsers}`,
        percentile: Math.round(((totalUsers - userRank + 1) / totalUsers) * 100)
      });
    }

    // If RPC function exists and returns data
    if (!rankData || rankData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in rankings'
      });
    }

    const userRankInfo = rankData[0];

    res.json({
      success: true,
      user: {
        system_id: userRankInfo.system_id,
        email: userRankInfo.email,
        points: userRankInfo.points,
        campus_id: userRankInfo.campus_id
      },
      leaderboardPosition: userRankInfo.rank,
      totalUsers: userRankInfo.total_users,
      userRank: `#${userRankInfo.rank} of ${userRankInfo.total_users}`,
      percentile: Math.round(((userRankInfo.total_users - userRankInfo.rank + 1) / userRankInfo.total_users) * 100),
      rankBadge: userRankInfo.rank === 1 ? '🥇 #1' : 
                 userRankInfo.rank === 2 ? '🥈 #2' : 
                 userRankInfo.rank === 3 ? '🥉 #3' : 
                 userRankInfo.rank <= 10 ? '⭐ Top 10' : 
                 userRankInfo.rank <= 100 ? '✨ Top 100' : 'Participant'
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard position'
    });
  }
};

// ============================================
// Get User Rank (Helper function)
// ============================================
async function getUserRankInfo(userId, email) {
  try {
    // Get user's points
    const { data: userPoints, error: userError } = await supabase
      .from('account_points')
      .select('system_id, email, points, campus_id')
      .or(`system_id.eq.${userId},email.eq.${email}`)
      .single();

    if (userError || !userPoints) {
      return null;
    }

    // Get all users sorted by points only (no secondary sort)
    const { data: allUsers, error: allUsersError } = await supabase
      .from('account_points')
      .select('system_id, email, points')
      .order('points', { ascending: false });

    if (allUsersError || !allUsers) {
      return null;
    }

    // Calculate rank with no skipped ranks (RANK() behavior)
    // Count how many users have MORE points than this user
    let rank = 1;
    for (let i = 0; i < allUsers.length; i++) {
      if (allUsers[i].system_id === userPoints.system_id || allUsers[i].email === userPoints.email) {
        rank = i + 1;
        break;
      }
    }

    const totalUsers = allUsers.length;
    const percentile = Math.round(((totalUsers - rank + 1) / totalUsers) * 100);

    return {
      system_id: userPoints.system_id,
      email: userPoints.email,
      points: userPoints.points,
      campus_id: userPoints.campus_id,
      rank: rank,
      totalUsers: totalUsers,
      percentile: percentile
    };
  } catch (error) {
    console.error('Error calculating user rank:', error);
    return null;
  }
}

// ============================================
// Get User Points
// ============================================
exports.getUserPoints = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    const account = await resolveUserAccount(userId, email);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { data: pointsBySystemId, error: pointsBySystemIdError } = await supabase
      .from('account_points')
      .select('system_id, email, points, total_points, total_waste')
      .eq('system_id', account.system_id)
      .maybeSingle();

    if (pointsBySystemIdError && pointsBySystemIdError.code !== 'PGRST116') {
      console.warn('Dashboard points lookup by system_id error:', pointsBySystemIdError.message);
    }

    let pointsData = pointsBySystemId;

    if (!pointsData && account.email) {
      const { data: pointsByEmail, error: pointsByEmailError } = await supabase
        .from('account_points')
        .select('system_id, email, points, total_points, total_waste')
        .ilike('email', account.email)
        .maybeSingle();

      if (pointsByEmailError && pointsByEmailError.code !== 'PGRST116') {
        console.warn('Dashboard points lookup by email error:', pointsByEmailError.message);
      }

      pointsData = pointsByEmail || null;
    }

    const pointsValue = Number(pointsData?.points ?? 0);
    const totalPointsValue = Number(pointsData?.total_points ?? pointsValue);
    const totalWasteValue = Number(pointsData?.total_waste ?? 0);

    // Get user rank information
    const rankInfo = await getUserRankInfo(account.system_id, account.email);

    res.json({
      success: true,
      user: {
        id: account.system_id,
        email: account.email,
        role: account.role,
        points: pointsValue,
        total_points: totalPointsValue,
        total_waste: totalWasteValue
      },
      rank: rankInfo ? {
        rank: rankInfo.rank,
        totalUsers: rankInfo.totalUsers,
        percentile: rankInfo.percentile,
        rankBadge: rankInfo.rankBadge,
        displayText: `#${rankInfo.rank} of ${rankInfo.totalUsers}`
      } : null,
      source: 'account_points'
    });
  } catch (error) {
    console.error('Points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get User Activity Overview
// ============================================
exports.getActivityOverview = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    const account = await resolveUserAccount(userId, email);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const accountEmail = String(account.email || email || '').trim().toLowerCase();
    const accountIds = Array.from(new Set([
      String(account.id || '').trim(),
      String(account.system_id || '').trim(),
      String(account.campus_id || '').trim(),
    ].filter(Boolean)));

    const [pointsBySystemIdRes, pointsByEmailRes, categoryRes, redemptionsRes, sessionsRes, transfersRes] = await Promise.all([
      supabase
        .from('account_points')
        .select('points, total_points, total_waste')
        .eq('system_id', account.system_id)
        .maybeSingle(),
      accountEmail
        ? supabase
          .from('account_points')
          .select('points, total_points, total_waste')
          .ilike('email', accountEmail)
          .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('user_waste_category_totals')
        .select('category_type, quantity')
        .eq('system_id', account.system_id),
      supabase
        .from('redemptions')
        .select('id, reward_id, points_spent, status, created_at, rewards(name, description, points_cost)')
        .in('user_id', accountIds)
        .order('created_at', { ascending: false })
        .limit(100),
      accountEmail
        ? supabase
          .from('machine_sessions')
          .select('id, machine_id, user_email, metal_count, plastic_count, paper_count, total_points, status, started_at, ended_at, updated_at')
          .ilike('user_email', accountEmail)
          .order('started_at', { ascending: false })
          .limit(100)
        : Promise.resolve({ data: [] }),
      accountEmail
        ? supabase
          .from('peer_transfer_logs')
          .select(`
            peertransfer_id,
            system_id,
            campus_id,
            from_email,
            from_name,
            to_email,
            to_name,
            log_time,
            log_date,
            points_transferred,
            details:peer_transfer_details(*)
          `)
          .or(`from_email.ilike.${accountEmail},to_email.ilike.${accountEmail}`)
          .order('log_date', { ascending: false })
          .order('log_time', { ascending: false })
          .limit(100)
        : Promise.resolve({ data: [] })
    ]);

    const pointsData = pointsBySystemIdRes.data || pointsByEmailRes.data || null;

    const categories = {
      Plastic: 0,
      Paper: 0,
      Metal: 0
    };

    for (const row of (categoryRes.data || [])) {
      const key = String(row.category_type || '').trim();
      if (Object.prototype.hasOwnProperty.call(categories, key)) {
        categories[key] = Number(row.quantity || 0);
      }
    }

    const totalPoints = Number(pointsData?.points ?? 0);
    const totalWaste = Number(pointsData?.total_waste ?? 0);
    const lifetimePoints = Number(pointsData?.total_points ?? totalPoints);

    const redemptionLogs = (redemptionsRes.data || []).map((redemption) => ({
      id: redemption.id,
      type: 'redemption',
      date: redemption.created_at || null,
      time: redemption.created_at ? timestampUtils.formatTimeForDisplay(redemption.created_at) : '00:00',
      rewardName: redemption.rewards?.name || 'Reward',
      description: redemption.rewards?.description || `Redeemed ${redemption.rewards?.name || 'reward'}`,
      quantity: '1 redemption',
      points: -Math.abs(Number(redemption.points_spent || redemption.rewards?.points_cost || 0)),
      status: redemption.status || 'completed'
    }));

    const sessionLogs = (sessionsRes.data || []).map((session) => ({
      id: session.id,
      type: 'machine-session',
      date: session.started_at || session.updated_at || null,
      time: session.started_at ? timestampUtils.formatTimeForDisplay(session.started_at) : '00:00',
      machineId: session.machine_id,
      description: `Machine session at ${session.machine_id}`,
      quantity: `Metal ${Number(session.metal_count || 0)} / Plastic ${Number(session.plastic_count || 0)} / Paper ${Number(session.paper_count || 0)}`,
      points: Number(session.total_points || 0),
      status: session.status || 'completed',
      metalCount: Number(session.metal_count || 0),
      plasticCount: Number(session.plastic_count || 0),
      paperCount: Number(session.paper_count || 0),
      totalWasteSorted: Number(session.metal_count || 0) + Number(session.plastic_count || 0) + Number(session.paper_count || 0)
    }));

    const transferLogs = (transfersRes.data || []).map((log) => {
      const detail = log.details && log.details.length > 0 ? log.details[0] : null;
      const fromEmail = String(log.from_email || '').toLowerCase();
      let type = 'transfer';
      let points = Number(log.points_transferred || 0);

      if (detail) {
        type = detail.transaction_type;
        if (['redemption', 'p2p-sent', 'admin-deducted'].includes(type) && points > 0) {
          points = -points;
        }
      } else if (fromEmail === 'admin@system') {
        type = 'admin-added';
      } else if (String(log.to_email || '').toLowerCase() === 'admin@system') {
        type = 'admin-deducted';
        points = -Math.abs(points);
      } else if (fromEmail === accountEmail) {
        type = 'p2p-sent';
        points = -Math.abs(points);
      } else {
        type = 'p2p-received';
      }

      return {
        peertransfer_id: log.peertransfer_id,
        date: log.log_date || null,
        time: log.log_time || '00:00',
        type,
        from_email: log.from_email,
        from_name: log.from_name,
        to_email: log.to_email,
        to_name: log.to_name,
        points_transferred: Number(log.points_transferred || 0),
        points,
        description: detail?.description || `Transfer from ${log.from_name} to ${log.to_name}`,
        subdescription: detail?.subdescription || '',
        quantity: detail?.quantity || `${log.points_transferred} points`,
        reason: detail?.reason || '',
        status: detail?.status || 'Completed'
      };
    });

    const pointsSpentOnRedeems = redemptionLogs.reduce((sum, item) => sum + Math.abs(Number(item.points || 0)), 0);
    const pointsSpentOnTransfers = transferLogs
      .filter((item) => item.type === 'p2p-sent')
      .reduce((sum, item) => sum + Math.abs(Number(item.points || 0)), 0);

    return res.json({
      success: true,
      summary: {
        totalPoints,
        totalLifetimePoints: lifetimePoints,
        totalWaste,
        metalCount: categories.Metal,
        plasticCount: categories.Plastic,
        paperCount: categories.Paper,
        totalRedemptions: redemptionLogs.length,
        totalSessions: sessionLogs.length,
        totalTransfers: transferLogs.length,
        pointsSpentOnRedeems,
        pointsSpentOnTransfers,
        totalRewardsRedeemed: redemptionLogs.length
      },
      stats: {
        totalPoints,
        totalLifetimePoints: lifetimePoints,
        disposalCount: totalWaste,
        categories,
        memberSince: account.created_at
      },
      logs: {
        redemptions: redemptionLogs,
        sessions: sessionLogs,
        transfers: transferLogs
      }
    });
  } catch (error) {
    console.error('Activity overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// Get User Transaction History
// ============================================
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();
    const limit = parseInt(req.query.limit || '50');

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    const account = await resolveUserAccount(userId, email);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const accountEmail = String(account.email || email || '').trim().toLowerCase();

    console.log('[HISTORY API] Fetching history for:', accountEmail, 'limit:', limit);

    // Fetch peer_transfer_logs with related details
    const { data: logs, error: logsError } = await supabase
      .from('peer_transfer_logs')
      .select(`
        peertransfer_id,
        system_id,
        campus_id,
        from_email,
        from_name,
        to_email,
        to_name,
        log_time,
        log_date,
        points_transferred,
        details:peer_transfer_details(*)
      `)
      .or(`from_email.ilike.${accountEmail},to_email.ilike.${accountEmail}`)
      .order('log_date', { ascending: false })
      .order('log_time', { ascending: false })
      .limit(limit);

    if (logsError) {
      console.error('[HISTORY API] Database error:', logsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction history',
        error: logsError.message
      });
    }

    console.log('[HISTORY API] Found logs:', logs ? logs.length : 0);

    // Transform logs to history format
    const history = (logs || []).map(log => {
      const detail = log.details && log.details.length > 0 ? log.details[0] : null;
      
      // Determine transaction type and points direction
      let type = 'transfer';
      let points = log.points_transferred;
      
      if (detail) {
        type = detail.transaction_type;
        // Apply correct sign based on transaction type
        if (['redemption', 'p2p-sent', 'admin-deducted'].includes(type) && points > 0) {
          points = -points;
        }
      } else {
        // Infer type from email direction
        if (log.from_email === 'admin@system') {
          type = 'admin-added';
        } else if (log.to_email === 'admin@system') {
          type = 'admin-deducted';
          points = -log.points_transferred;
        } else if (String(log.from_email || '').toLowerCase() === accountEmail) {
          type = 'p2p-sent';
          points = -log.points_transferred;
        } else {
          type = 'p2p-received';
        }
      }
      
      return {
        peertransfer_id: log.peertransfer_id,
        log_date: log.log_date,
        log_time: log.log_time,
        transaction_type: type,
        from_email: log.from_email,
        from_name: log.from_name,
        to_email: log.to_email,
        to_name: log.to_name,
        points_transferred: log.points_transferred,
        points: points,
        // Details
        description: detail?.description || `Transfer from ${log.from_name} to ${log.to_name}`,
        subdescription: detail?.subdescription || '',
        quantity: detail?.quantity || `${log.points_transferred} points`,
        reason: detail?.reason || '',
        status: detail?.status || 'Completed'
      };
    });

    console.log('[HISTORY API] Returning history:', history.length, 'records');

    res.json({
      success: true,
      email: accountEmail,
      history: history,
      count: history.length
    });
  } catch (error) {
    console.error('[HISTORY API] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching transaction history',
      error: error.message
    });
  }
};
