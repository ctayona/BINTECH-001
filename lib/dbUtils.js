// ============================================
// SUPABASE DATABASE UTILITIES
// Helper functions for common CRUD operations
// ============================================

const supabase = require('../config/supabase');

// ============================================
// BINS OPERATIONS
// ============================================

/**
 * Get all bins
 */
async function getBins() {
  const { data, error } = await supabase
    .from('bins')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching bins: ${error.message}`);
  return data;
}

/**
 * Get a single bin by ID
 */
async function getBinById(binId) {
  const { data, error } = await supabase
    .from('bins')
    .select('*')
    .eq('id', binId)
    .single();
  
  if (error) throw new Error(`Error fetching bin: ${error.message}`);
  return data;
}

/**
 * Add a new bin
 */
async function addBin(binData) {
  const { data, error } = await supabase
    .from('bins')
    .insert([binData])
    .select();
  
  if (error) throw new Error(`Error adding bin: ${error.message}`);
  return data[0];
}

/**
 * Update a bin
 */
async function updateBin(binId, updates) {
  const { data, error } = await supabase
    .from('bins')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', binId)
    .select();
  
  if (error) throw new Error(`Error updating bin: ${error.message}`);
  return data[0];
}

/**
 * Delete a bin
 */
async function deleteBin(binId) {
  const { data, error } = await supabase
    .from('bins')
    .delete()
    .eq('id', binId);
  
  if (error) throw new Error(`Error deleting bin: ${error.message}`);
  return true;
}

// ============================================
// COLLECTION LOGS OPERATIONS
// ============================================

/**
 * Get all collection logs
 */
async function getCollectionLogs(limit = 100) {
  const { data, error } = await supabase
    .from('collection_logs')
    .select('*')
    .order('collected_at', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Error fetching collection logs: ${error.message}`);
  return data;
}

/**
 * Get collection logs for a specific bin
 */
async function getCollectionLogsByBin(binId) {
  const { data, error } = await supabase
    .from('collection_logs')
    .select('*')
    .eq('bin_id', binId)
    .order('collected_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching collection logs: ${error.message}`);
  return data;
}

/**
 * Add a new collection log
 */
async function addCollectionLog(logData) {
  const { data, error } = await supabase
    .from('collection_logs')
    .insert([{ ...logData, collected_at: new Date() }])
    .select();
  
  if (error) throw new Error(`Error adding collection log: ${error.message}`);
  return data[0];
}

/**
 * Update a collection log
 */
async function updateCollectionLog(logId, updates) {
  const { data, error } = await supabase
    .from('collection_logs')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', logId)
    .select();
  
  if (error) throw new Error(`Error updating collection log: ${error.message}`);
  return data[0];
}

/**
 * Delete a collection log
 */
async function deleteCollectionLog(logId) {
  const { data, error } = await supabase
    .from('collection_logs')
    .delete()
    .eq('id', logId);
  
  if (error) throw new Error(`Error deleting collection log: ${error.message}`);
  return true;
}

// ============================================
// REWARDS OPERATIONS
// ============================================

/**
 * Get all active rewards
 */
async function getRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('points_required', { ascending: true });
  
  if (error) throw new Error(`Error fetching rewards: ${error.message}`);
  return data;
}

/**
 * Get rewards by category
 */
async function getRewardsByCategory(category) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('category', category)
    .eq('is_active', true);
  
  if (error) throw new Error(`Error fetching rewards: ${error.message}`);
  return data;
}

/**
 * Get a single reward by ID
 */
async function getRewardById(rewardId) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .single();
  
  if (error) throw new Error(`Error fetching reward: ${error.message}`);
  return data;
}

/**
 * Add a new reward
 */
async function addReward(rewardData) {
  const { data, error } = await supabase
    .from('rewards')
    .insert([{ ...rewardData, is_active: true }])
    .select();
  
  if (error) throw new Error(`Error adding reward: ${error.message}`);
  return data[0];
}

/**
 * Update a reward
 */
async function updateReward(rewardId, updates) {
  const { data, error } = await supabase
    .from('rewards')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', rewardId)
    .select();
  
  if (error) throw new Error(`Error updating reward: ${error.message}`);
  return data[0];
}

/**
 * Deactivate a reward (soft delete)
 */
async function deactivateReward(rewardId) {
  return updateReward(rewardId, { is_active: false });
}

/**
 * Delete a reward (hard delete)
 */
async function deleteReward(rewardId) {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', rewardId);
  
  if (error) throw new Error(`Error deleting reward: ${error.message}`);
  return true;
}

// ============================================
// SCHEDULES OPERATIONS
// ============================================

/**
 * Get all schedules
 */
async function getSchedules() {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('scheduled_at', { ascending: true });
  
  if (error) throw new Error(`Error fetching schedules: ${error.message}`);
  return data;
}

/**
 * Get upcoming schedules (future dates)
 */
async function getUpcomingSchedules() {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });
  
  if (error) throw new Error(`Error fetching schedules: ${error.message}`);
  return data;
}

/**
 * Get schedules assigned to a specific person
 */
async function getSchedulesByAssignee(userId) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('assigned_to', userId)
    .order('scheduled_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching schedules: ${error.message}`);
  return data;
}

/**
 * Add a new schedule
 */
async function addSchedule(scheduleData) {
  const { data, error } = await supabase
    .from('schedules')
    .insert([scheduleData])
    .select();
  
  if (error) throw new Error(`Error adding schedule: ${error.message}`);
  return data[0];
}

/**
 * Update a schedule
 */
async function updateSchedule(scheduleId, updates) {
  const { data, error } = await supabase
    .from('schedules')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', scheduleId)
    .select();
  
  if (error) throw new Error(`Error updating schedule: ${error.message}`);
  return data[0];
}

/**
 * Mark a schedule as completed
 */
async function completeSchedule(scheduleId) {
  return updateSchedule(scheduleId, {
    status: 'completed',
    completed_at: new Date()
  });
}

/**
 * Delete a schedule
 */
async function deleteSchedule(scheduleId) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);
  
  if (error) throw new Error(`Error deleting schedule: ${error.message}`);
  return true;
}

// ============================================
// USERS OPERATIONS
// ============================================

/**
 * Get all users
 */
async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching users: ${error.message}`);
  return data;
}

/**
 * Get a single user by ID
 */
async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw new Error(`Error fetching user: ${error.message}`);
  return data;
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) throw new Error(`Error fetching user: ${error.message}`);
  return data;
}

/**
 * Add points to a user
 */
async function addUserPoints(userId, points) {
  const user = await getUserById(userId);
  const newPoints = (user.points || 0) + points;
  
  return updateUser(userId, { points: newPoints });
}

/**
 * Update a user
 */
async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', userId)
    .select();
  
  if (error) throw new Error(`Error updating user: ${error.message}`);
  return data[0];
}

/**
 * Get leaderboard (top N users)
 */
async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, points, created_at')
    .neq('role', 'admin')
    .order('points', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Error fetching leaderboard: ${error.message}`);
  return data;
}

/**
 * Delete a user
 */
async function deleteUser(userId) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  
  if (error) throw new Error(`Error deleting user: ${error.message}`);
  return true;
}

// ============================================
// DISPOSAL HISTORY OPERATIONS
// ============================================

/**
 * Get disposal history for a user
 */
async function getUserDisposalHistory(userId) {
  const { data, error } = await supabase
    .from('disposal_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching disposal history: ${error.message}`);
  return data;
}

/**
 * Get disposal history by waste type
 */
async function getDisposalHistoryByType(wasteType) {
  const { data, error } = await supabase
    .from('disposal_history')
    .select('*')
    .eq('waste_type', wasteType)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(`Error fetching disposal history: ${error.message}`);
  return data;
}

// ============================================
// STATISTICS OPERATIONS
// ============================================

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
  const binCount = await supabase
    .from('bins')
    .select('*', { count: 'exact', head: true });
  
  const userCount = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  const rewardCount = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  const collectionCount = await supabase
    .from('collection_logs')
    .select('*', { count: 'exact', head: true });
  
  return {
    totalBins: binCount.count,
    totalUsers: userCount.count,
    activeRewards: rewardCount.count,
    totalCollections: collectionCount.count
  };
}

/**
 * Get bin fill status report
 */
async function getBinFillReport() {
  const { data, error } = await supabase
    .from('bins')
    .select('id, location, code, capacity, filled_percentage, status')
    .order('filled_percentage', { ascending: false });
  
  if (error) throw new Error(`Error fetching bin report: ${error.message}`);
  
  return data.map(bin => ({
    ...bin,
    fillLevel: bin.filled_percentage > 80 ? 'Critical' :
               bin.filled_percentage > 60 ? 'High' :
               bin.filled_percentage > 30 ? 'Medium' : 'Low'
  }));
}

// ============================================
// PEER TRANSFER LOGS
// ============================================

/**
 * Log a peer transfer (including admin adjustments)
 */
async function logPeerTransfer(logData) {
  const {
    system_id,
    campus_id,
    from_email,
    from_name,
    to_email,
    to_name,
    points_transferred,
    log_time,
    log_date
  } = logData;

  const payload = {
    system_id,
    campus_id: campus_id || null,
    from_email: String(from_email).trim().toLowerCase(),
    from_name: from_name || from_email,
    to_email: String(to_email).trim().toLowerCase(),
    to_name: to_name || to_email,
    points_transferred: Math.abs(Number(points_transferred) || 0),
    log_time: log_time || new Date().toLocaleTimeString('en-US', { hour12: false }),
    log_date: log_date || new Date().toISOString().split('T')[0]
  };

  const { data, error } = await supabase
    .from('peer_transfer_logs')
    .insert([payload])
    .select();

  if (error) throw new Error(`Error logging peer transfer: ${error.message}`);
  return data[0];
}

/**
 * Get peer transfer history for a user (sent or received)
 */
async function getPeerTransferHistory(email, limit = 50) {
  const normalizedEmail = String(email).trim().toLowerCase();
  
  const { data, error } = await supabase
    .from('peer_transfer_logs')
    .select('*')
    .or(`from_email.ilike.${normalizedEmail},to_email.ilike.${normalizedEmail}`)
    .order('log_date', { ascending: false })
    .order('log_time', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error fetching peer transfer history: ${error.message}`);
  return data;
}

/**
 * Get admin adjustment logs (from_email = 'admin@system')
 */
async function getAdminAdjustmentLogs(limit = 50) {
  const { data, error } = await supabase
    .from('peer_transfer_logs')
    .select('*')
    .eq('from_email', 'admin@system')
    .order('log_date', { ascending: false })
    .order('log_time', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error fetching admin adjustment logs: ${error.message}`);
  return data;
}

// ============================================
// PEER TRANSFER DETAILS
// ============================================

/**
 * Add transfer details record
 */
async function addTransferDetail(detailData) {
  const {
    peertransfer_id,
    transaction_type,
    description,
    subdescription,
    quantity,
    reason,
    status = 'Completed',
    metadata
  } = detailData;

  const payload = {
    peertransfer_id,
    transaction_type: String(transaction_type).trim().toLowerCase(),
    description: description || null,
    subdescription: subdescription || null,
    quantity: quantity || null,
    reason: reason || null,
    status: status || 'Completed',
    metadata: metadata || null
  };

  const { data, error } = await supabase
    .from('peer_transfer_details')
    .insert([payload])
    .select();

  if (error) throw new Error(`Error adding transfer detail: ${error.message}`);
  return data[0];
}

/**
 * Get transfer details for a specific transfer log
 */
async function getTransferDetails(peertransfer_id) {
  const { data, error } = await supabase
    .from('peer_transfer_details')
    .select('*')
    .eq('peertransfer_id', peertransfer_id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching transfer details: ${error.message}`);
  return data;
}

/**
 * Get transfer logs with details (JOIN)
 */
async function getTransferWithDetails(peertransfer_id) {
  const { data, error } = await supabase
    .from('peer_transfer_logs')
    .select(`
      *,
      details:peer_transfer_details(*)
    `)
    .eq('peertransfer_id', peertransfer_id)
    .single();

  if (error) throw new Error(`Error fetching transfer with details: ${error.message}`);
  return data;
}

/**
 * Get user transfer history with details
 */
async function getUserTransferHistoryWithDetails(email, limit = 50) {
  const normalizedEmail = String(email).trim().toLowerCase();
  
  const { data, error } = await supabase
    .from('peer_transfer_logs')
    .select(`
      *,
      details:peer_transfer_details(*)
    `)
    .or(`from_email.ilike.${normalizedEmail},to_email.ilike.${normalizedEmail}`)
    .order('log_date', { ascending: false })
    .order('log_time', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error fetching user transfer history with details: ${error.message}`);
  return data;
}

/**
 * Get transactions by type
 */
async function getTransactionsByType(type, limit = 50) {
  const { data, error } = await supabase
    .from('peer_transfer_details')
    .select(`
      *,
      log:peer_transfer_logs(*)
    `)
    .eq('transaction_type', type)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error fetching transactions by type: ${error.message}`);
  return data;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Bins
  getBins,
  getBinById,
  addBin,
  updateBin,
  deleteBin,
  
  // Collection Logs
  getCollectionLogs,
  getCollectionLogsByBin,
  addCollectionLog,
  updateCollectionLog,
  deleteCollectionLog,
  
  // Rewards
  getRewards,
  getRewardsByCategory,
  getRewardById,
  addReward,
  updateReward,
  deactivateReward,
  deleteReward,
  
  // Schedules
  getSchedules,
  getUpcomingSchedules,
  getSchedulesByAssignee,
  addSchedule,
  updateSchedule,
  completeSchedule,
  deleteSchedule,
  
  // Users
  getUsers,
  getUserById,
  getUserByEmail,
  addUserPoints,
  updateUser,
  getLeaderboard,
  deleteUser,
  
  // Disposal History
  getUserDisposalHistory,
  getDisposalHistoryByType,
  
  // Peer Transfer Logs
  logPeerTransfer,
  getPeerTransferHistory,
  getAdminAdjustmentLogs,
  
  // Peer Transfer Details
  addTransferDetail,
  getTransferDetails,
  getTransferWithDetails,
  getUserTransferHistoryWithDetails,
  getTransactionsByType,
  
  // Statistics
  getDashboardStats,
  getBinFillReport
};
