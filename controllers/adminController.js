// Admin Controller
// Handles administrative operations for bins, rewards, collection logs, and schedules

const supabase = require('../config/supabase');
const timestampUtils = require('../lib/timestampUtils');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Converts assigned_to field to valid UUID
 * Handles both email strings and UUID values
 * Returns { valid: bool, value: uuid|null } with detailed status
 */
async function normalizeAssignedTo(value) {
  try {
    if (!value || value === '' || value === 'null' || value === null || value === undefined) {
      console.log('[normalizeAssignedTo] Empty/null value, returning null');
      return { valid: true, value: null };
    }

    // Ensure it's a string
    if (typeof value !== 'string') {
      console.warn('[normalizeAssignedTo] Not a string, type:', typeof value);
      return { valid: false, value: null };
    }

    const trimmed = value.trim();
    if (!trimmed) {
      console.log('[normalizeAssignedTo] Empty string after trim, returning null');
      return { valid: true, value: null };
    }

    // Check if it looks like an email (contains @)
    if (trimmed.includes('@')) {
      console.log('[normalizeAssignedTo] Email detected, looking up user by email:', trimmed);
      
      // Try user_accounts table first (without .single() to avoid errors)
      const { data: accountData, error: acctError } = await supabase
        .from('user_accounts')
        .select('system_id')
        .eq('email', trimmed)
        .limit(1);
      
      if (acctError) {
        console.warn('[normalizeAssignedTo] user_accounts query error:', acctError.message);
      }
      
      if (accountData && accountData.length > 0 && accountData[0].system_id) {
        console.log('[normalizeAssignedTo] ✓ Found user in user_accounts, email:', trimmed, '→ UUID:', accountData[0].system_id);
        return { valid: true, value: accountData[0].system_id };
      }

      // Try legacy users table
      const { data: legacyData, error: legacyError } = await supabase
        .from('users')
        .select('id')
        .eq('email', trimmed)
        .limit(1);
      
      if (legacyError) {
        console.warn('[normalizeAssignedTo] users query error:', legacyError.message);
      }
      
      if (legacyData && legacyData.length > 0 && legacyData[0].id) {
        console.log('[normalizeAssignedTo] ✓ Found user in legacy users, email:', trimmed, '→ UUID:', legacyData[0].id);
        return { valid: true, value: legacyData[0].id };
      }

      console.warn('[normalizeAssignedTo] ✗ Email not found in any table:', trimmed);
      return { valid: false, value: null };
    }

    // If it looks like a UUID, verify it exists
    console.log('[normalizeAssignedTo] UUID format detected:', trimmed);
    
    // Check in user_accounts
    const { data: accountData, error: acctError } = await supabase
      .from('user_accounts')
      .select('system_id')
      .eq('system_id', trimmed)
      .limit(1);
    
    if (acctError) {
      console.warn('[normalizeAssignedTo] user_accounts UUID query error:', acctError.message);
    }
    
    if (accountData && accountData.length > 0) {
      console.log('[normalizeAssignedTo] ✓ UUID found in user_accounts');
      return { valid: true, value: trimmed };
    }

    // Check in legacy users table
    const { data: legacyData, error: legacyError } = await supabase
      .from('users')
      .select('id')
      .eq('id', trimmed)
      .limit(1);
    
    if (legacyError) {
      console.warn('[normalizeAssignedTo] users UUID query error:', legacyError.message);
    }
    
    if (legacyData && legacyData.length > 0) {
      console.log('[normalizeAssignedTo] ✓ UUID found in legacy users table');
      return { valid: true, value: trimmed };
    }

    console.warn('[normalizeAssignedTo] ✗ UUID not found in any table:', trimmed);
    return { valid: false, value: null };
  } catch (err) {
    console.error('[normalizeAssignedTo] Unexpected error:', err);
    return { valid: false, value: null };
  }
}

// ============================================
// Admin Dashboard
// ============================================
exports.getDashboard = async (req, res) => {
  try {
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      message: 'Welcome Admin!'
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      message: 'Error loading admin dashboard'
    });
  }
};

exports.getAdminSettings = async (req, res) => {
  try {
    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();

    if (!requesterEmail) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
    }

    if (!requesterEmail) {
      return res.status(400).json({
        success: false,
        message: 'Requester email is required'
      });
    }

    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*')
      .ilike('email', requesterEmail)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Admin settings not found',
        error: error?.message
      });
    }

    return res.json({
      success: true,
      settings: {
        id: data.id,
        email: data.email || '',
        full_name: data.full_name || '',
        role: String(data.role || 'admin').trim().toLowerCase(),
        phone: data.phone || '',
        first_name: data.First_Name || '',
        middle_name: data.Middle_Name || '',
        last_name: data.Last_Name || '',
        google_id: data.Google_ID || null,
        profile_picture: data.Profile_Picture || data.profile_picture || null,
        updated_at: data.updated_at || null
      }
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updateAdminSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    const cleanNullableString = (value) => {
      const text = String(value ?? '').trim();
      return text ? text : null;
    };

    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();
    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();

    if (!requesterEmail) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
    }

    if (!requesterEmail) {
      return res.status(400).json({
        success: false,
        message: 'Requester email is required'
      });
    }

    const { data: existingAdmin, error: existingError } = await supabase
      .from('admin_accounts')
      .select('*')
      .ilike('email', requesterEmail)
      .maybeSingle();

    if (existingError || !existingAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
        error: existingError?.message
      });
    }

    if (!requesterRole) {
      requesterRole = String(existingAdmin.role || '').trim().toLowerCase();
    }

    const updates = {
      full_name: cleanNullableString(payload.full_name),
      phone: cleanNullableString(payload.phone),
      "First_Name": cleanNullableString(payload.first_name),
      "Middle_Name": cleanNullableString(payload.middle_name),
      "Last_Name": cleanNullableString(payload.last_name),
      updated_at: new Date().toISOString()
    };

    const requestedEmail = cleanNullableString(payload.email);
    if (requestedEmail && requestedEmail.toLowerCase() !== String(existingAdmin.email || '').toLowerCase()) {
      updates.email = requestedEmail.toLowerCase();
    }

    // Role edits are intentionally blocked in settings to keep role read-only in admin panels.
    // Role changes should be handled in account management workflows only.

    const googleId = cleanNullableString(payload.google_id);
    if (Object.prototype.hasOwnProperty.call(payload, 'google_id')) {
      updates['Google_ID'] = googleId;
    }

    const passwordText = String(payload.password || '').trim();
    if (passwordText) {
      updates.password = passwordText;
    }

    const hasProfilePictureField = Object.prototype.hasOwnProperty.call(payload, 'profile_picture');
    if (hasProfilePictureField) {
      updates['Profile_Picture'] = cleanNullableString(payload.profile_picture);
    }

    let updateResult = await supabase
      .from('admin_accounts')
      .update(updates)
      .eq('id', existingAdmin.id)
      .select('*')
      .maybeSingle();

    if (updateResult.error && hasProfilePictureField && String(updateResult.error.message || '').toLowerCase().includes('profile_picture')) {
      const fallbackUpdates = { ...updates };
      delete fallbackUpdates['Profile_Picture'];
      fallbackUpdates['profile_picture'] = cleanNullableString(payload.profile_picture);

      updateResult = await supabase
        .from('admin_accounts')
        .update(fallbackUpdates)
        .eq('id', existingAdmin.id)
        .select('*')
        .maybeSingle();
    }

    const { data, error } = updateResult;

    if (error || !data) {
      return res.status(400).json({
        success: false,
        message: `Error updating admin settings: ${error?.message || 'Update failed'}`,
        error: error?.message
      });
    }

    return res.json({
      success: true,
      message: 'Settings saved successfully',
      settings: {
        id: data.id,
        email: data.email || '',
        full_name: data.full_name || '',
        role: String(data.role || 'admin').trim().toLowerCase(),
        phone: data.phone || '',
        first_name: data.First_Name || '',
        middle_name: data.Middle_Name || '',
        last_name: data.Last_Name || '',
        google_id: data.Google_ID || null,
        profile_picture: data.Profile_Picture || data.profile_picture || null,
        updated_at: data.updated_at || null
      }
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// Admin Dashboard Summary API
// ============================================
exports.getDashboardSummary = async (req, res) => {
  try {
    console.log('\n========== ADMIN DASHBOARD SUMMARY ==========');

    // 1. Get Total Bins Count
    const { data: bins, error: binsError } = await supabase
      .from('bins')
      .select('id, filled_percentage, status', { count: 'exact' });

    if (binsError) {
      console.warn('Error fetching bins:', binsError.message);
    }

    const totalBins = bins ? bins.length : 0;
    const activeBins = bins ? bins.filter(b => b.status === 'active').length : 0;

    // 1B. Get BINTECH-SORTER telemetry summary (single combined row)
    const { data: machineTelemetry, error: telemetryError } = await supabase
      .from('machine_sorting_telemetry')
      .select('*')
      .eq('machine_id', 'BINTECH-SORTER-001')
      .maybeSingle();

    if (telemetryError) {
      console.warn('Error fetching machine telemetry:', telemetryError.message);
    }

    // 2. Get Today's Collections Count & Summary
    const today = new Date().toISOString().split('T')[0];
    const { data: collectionsToday, error: collError } = await supabase
      .from('collections')
      .select('weight_kg, material_type, waste_type')
      .gte('collected_at', today + 'T00:00:00Z')
      .lt('collected_at', today + 'T23:59:59Z');

    if (collError) {
      console.warn('Error fetching collections:', collError.message);
    }

    const collectionsCount = collectionsToday ? collectionsToday.length : 0;
    const totalWeight = collectionsToday
      ? collectionsToday.reduce((sum, c) => sum + (parseFloat(c.weight_kg) || 0), 0)
      : 0;

    const safeMaterialName = (value) => {
      const material = String(value || '').trim().toLowerCase();
      if (material.includes('metal')) return 'Metal';
      if (material.includes('plastic')) return 'Plastic';
      if (material.includes('paper')) return 'Paper';
      return null;
    };

    const { data: allCollections, error: allCollectionsError } = await supabase
      .from('collections')
      .select('weight_kg, material_type, waste_type, collected_at');

    if (allCollectionsError) {
      console.warn('Error fetching all collections for waste analytics:', allCollectionsError.message);
    }

    const materialTotals = {
      Metal: 0,
      Plastic: 0,
      Paper: 0
    };

    let totalWasteCollected = 0;

    (allCollections || []).forEach((record) => {
      const weight = parseFloat(record.weight_kg) || 0;
      totalWasteCollected += weight;

      const material = safeMaterialName(record.material_type || record.waste_type);
      if (material) {
        materialTotals[material] += weight;
      }
    });

    const wasteMaterialBreakdown = Object.entries(materialTotals).map(([material, weight]) => ({
      material,
      weight: parseFloat(weight.toFixed(2)),
      percentage: totalWasteCollected > 0 ? parseFloat(((weight / totalWasteCollected) * 100).toFixed(1)) : 0
    }));

    // Prefer telemetry totals when available
    const telemetryMetalCount = Number(machineTelemetry?.metal_count || 0);
    const telemetryPlasticCount = Number(machineTelemetry?.plastic_count || 0);
    const telemetryPaperCount = Number(machineTelemetry?.paper_count || 0);
    const telemetryWasteSorted = Number(machineTelemetry?.total_waste_sorted || (telemetryMetalCount + telemetryPlasticCount + telemetryPaperCount));
    const telemetryPointsGenerated = Number(machineTelemetry?.total_points_generated || 0);

    const miniCapacity = {
      metal: {
        percentage: Number(machineTelemetry?.metal_fill_percentage || 0),
        status: String(machineTelemetry?.metal_status || 'ACTIVE').toUpperCase()
      },
      plastic: {
        percentage: Number(machineTelemetry?.plastic_fill_percentage || 0),
        status: String(machineTelemetry?.plastic_status || 'ACTIVE').toUpperCase()
      },
      paper: {
        percentage: Number(machineTelemetry?.paper_fill_percentage || 0),
        status: String(machineTelemetry?.paper_status || 'ACTIVE').toUpperCase()
      }
    };

    // 3. Get Active Routes
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .eq('status', 'active');

    if (routesError) {
      console.warn('Error fetching routes:', routesError.message);
    }

    const activeRoutes = routes ? routes.length : 0;

    // 3B. System statistics
    const [
      userAccountsStats,
      adminAccountsStats,
      machineSessionsStats,
      rewardsStats,
      collectionsStats
    ] = await Promise.all([
      supabase.from('user_accounts').select('system_id', { head: true, count: 'exact' }),
      supabase.from('admin_accounts').select('id', { head: true, count: 'exact' }),
      supabase.from('machine_sessions').select('id', { head: true, count: 'exact' }),
      supabase.from('rewards').select('id', { head: true, count: 'exact' }),
      supabase.from('collections').select('id', { head: true, count: 'exact' })
    ]);

    const systemStatistics = {
      totalAccounts: Number(userAccountsStats.count || 0) + Number(adminAccountsStats.count || 0),
      totalUserAccounts: Number(userAccountsStats.count || 0),
      totalAdminAccounts: Number(adminAccountsStats.count || 0),
      totalSessions: Number(machineSessionsStats.count || 0),
      totalRedeemableRewards: Number(rewardsStats.count || 0),
      totalCollections: Number(collectionsStats.count || 0)
    };

    // 4. Get Waste Distribution
    const { data: wasteDistribution, error: distError } = await supabase
      .from('waste_distribution')
      .select('category_name, percentage, color_hex')
      .order('priority', { ascending: true });

    if (distError) {
      console.warn('Error fetching waste distribution:', distError.message);
    }

    // 5. Get Weekly Collections (last 7 days)
    const weeklyData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today_date = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today_date);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];

      const { data: dayCollections, error: dayError } = await supabase
        .from('collections')
        .select('weight_kg')
        .gte('collected_at', dateStr + 'T00:00:00Z')
        .lt('collected_at', dateStr + 'T23:59:59Z');

      if (dayError) {
        console.warn(`Error fetching collections for ${dateStr}:`, dayError.message);
      }

      const dayWeight = dayCollections
        ? dayCollections.reduce((sum, c) => sum + (parseFloat(c.weight_kg) || 0), 0)
        : 0;

      weeklyData.push({
        day: dayName,
        quantity: parseFloat((dayWeight / 1000).toFixed(2)), // Convert to tons
        date: dateStr
      });
    }

    // 6. Get Heatmap Zones
    const { data: zones, error: zonesError } = await supabase
      .from('heatmap_zones')
      .select('zone_id, zone_name, fill_percentage, status')
      .order('zone_id', { ascending: true });

    if (zonesError) {
      console.warn('Error fetching heatmap zones:', zonesError.message);
    }

    console.log('✓ Dashboard Summary Generated:');
    console.log(`  Total Bins: ${totalBins}`);
    console.log(`  Collections Today: ${collectionsCount}`);
    console.log(`  Active Routes: ${activeRoutes}`);
    console.log(`  Waste Categories: ${wasteDistribution ? wasteDistribution.length : 0}`);
    console.log('========================================\n');

    res.json({
      success: true,
      summary: {
        totalBins: totalBins,
        activeBins: activeBins,
        collectionsToday: collectionsCount,
        totalWeightToday: parseFloat(totalWeight.toFixed(2)),
        totalWasteCollected: parseFloat(totalWasteCollected.toFixed(2)),
        totalWasteSorted: telemetryWasteSorted,
        totalPointsGenerated: parseFloat(telemetryPointsGenerated.toFixed(2)),
        sortedMaterialCounts: {
          metal: telemetryMetalCount,
          plastic: telemetryPlasticCount,
          paper: telemetryPaperCount
        },
        wasteMaterialTotals: materialTotals,
        wasteMaterialBreakdown: wasteMaterialBreakdown,
        miniCapacity,
        activeRoutes: activeRoutes,
        systemStatistics,
        wasteDistribution: wasteDistribution || [],
        weeklyCollections: weeklyData,
        heatmapZones: zones || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};

// ============================================
// Machine Session Logs API
// ============================================
exports.getMachineSessionLogs = async (req, res) => {
  try {
    const { machineId } = req.params;
    const limit = Math.min(Number(req.query.limit || 50), 200);

    if (!machineId) {
      return res.status(400).json({
        success: false,
        message: 'machineId is required'
      });
    }

    let { data: sessions, error } = await supabase
      .from('machine_sessions')
      .select('id, machine_id, user_email, metal_count, plastic_count, paper_count, total_points, status, started_at, ended_at, updated_at')
      .eq('machine_id', machineId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error && String(error.message || '').toLowerCase().includes('user_email')) {
      // Backward compatibility for schemas without user_email
      const fallback = await supabase
        .from('machine_sessions')
        .select('id, machine_id, metal_count, plastic_count, paper_count, total_points, status, started_at, ended_at, updated_at')
        .eq('machine_id', machineId)
        .order('started_at', { ascending: false })
        .limit(limit);
      sessions = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching machine session logs',
        error: error.message
      });
    }

    const logs = (sessions || []).map((session) => ({
      id: session.id,
      machineId: session.machine_id,
      email: session.user_email || 'Unknown',
      metalCount: Number(session.metal_count || 0),
      plasticCount: Number(session.plastic_count || 0),
      paperCount: Number(session.paper_count || 0),
      totalPoints: Number(session.total_points || 0),
      status: session.status || 'unknown',
      startedAt: session.started_at || null,
      endedAt: session.ended_at || null,
      updatedAt: session.updated_at || null
    }));

    return res.json({
      success: true,
      machineId,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Machine session logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// Waste Sorting Overview API
// ============================================
exports.getSortingOverview = async (req, res) => {
  try {
    const machineId = 'BINTECH-SORTER-001';

    const { data: telemetryRow, error: telemetryError } = await supabase
      .from('machine_sorting_telemetry')
      .select('*')
      .eq('machine_id', machineId)
      .maybeSingle();

    if (telemetryError) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching sorting overview',
        error: telemetryError.message
      });
    }

    if (telemetryRow) {
      return res.json({
        success: true,
        summary: {
          machineId: telemetryRow.machine_id,
          metalCount: Number(telemetryRow.metal_count || 0),
          plasticCount: Number(telemetryRow.plastic_count || 0),
          paperCount: Number(telemetryRow.paper_count || 0),
          totalWasteSorted: Number(telemetryRow.total_waste_sorted || 0),
          totalPointsGenerated: Number(telemetryRow.total_points_generated || 0),
          metalFillPercentage: Number(telemetryRow.metal_fill_percentage || 0),
          plasticFillPercentage: Number(telemetryRow.plastic_fill_percentage || 0),
          paperFillPercentage: Number(telemetryRow.paper_fill_percentage || 0),
          metalStatus: telemetryRow.metal_status || 'ACTIVE',
          plasticStatus: telemetryRow.plastic_status || 'ACTIVE',
          paperStatus: telemetryRow.paper_status || 'ACTIVE',
          updatedAt: telemetryRow.updated_at || new Date().toISOString()
        }
      });
    }

    const { data: sessions, error } = await supabase
      .from('machine_sessions')
      .select('metal_count, plastic_count, paper_count, total_points');

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching sorting overview',
        error: error.message
      });
    }

    const totals = (sessions || []).reduce((acc, session) => {
      acc.metalCount += Number(session.metal_count || 0);
      acc.plasticCount += Number(session.plastic_count || 0);
      acc.paperCount += Number(session.paper_count || 0);
      acc.totalPointsGenerated += Number(session.total_points || 0);
      return acc;
    }, {
      metalCount: 0,
      plasticCount: 0,
      paperCount: 0,
      totalPointsGenerated: 0
    });

    const totalWasteSorted = totals.metalCount + totals.plasticCount + totals.paperCount;

    return res.json({
      success: true,
      summary: {
        ...totals,
        metalFillPercentage: 0,
        plasticFillPercentage: 0,
        paperFillPercentage: 0,
        metalStatus: 'ACTIVE',
        plasticStatus: 'ACTIVE',
        paperStatus: 'ACTIVE',
        totalWasteSorted,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Sorting overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// BIN MANAGEMENT
// ============================================

exports.getBinManagement = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching bins'
      });
    }

    res.json({
      success: true,
      bins: data || []
    });
  } catch (error) {
    console.error('Get bins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.addBin = async (req, res) => {
  try {
    const { location, capacity, waste_type, qr_code, code, filled_percentage, created_by } = req.body;

    // Prefer your current bins schema: code + filled_percentage
    let { data, error } = await supabase
      .from('bins')
      .insert([
        {
          location,
          code: code || qr_code || `BIN-${Date.now()}`,
          capacity: capacity || 100,
          filled_percentage: Number.isFinite(Number(filled_percentage)) ? Number(filled_percentage) : 0,
          created_by: created_by || null,
          status: 'active',
          created_at: new Date()
        }
      ])
      .select();

    // Backward compatibility for older schemas (e.g., qr_code/waste_type/current_fill)
    if (
      error &&
      (
        String(error.message || '').toLowerCase().includes('code') ||
        String(error.message || '').toLowerCase().includes('filled_percentage') ||
        String(error.message || '').toLowerCase().includes('created_by')
      )
    ) {
      const fallback = await supabase
        .from('bins')
        .insert([
          {
            location,
            capacity: capacity || 100,
            waste_type: waste_type || 'mixed',
            qr_code,
            current_fill: 0,
            status: 'active',
            created_at: new Date()
          }
        ])
        .select();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error adding bin',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Bin added successfully',
      bin: data[0]
    });
  } catch (error) {
    console.error('Add bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateBin = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, capacity, waste_type, status, code, filled_percentage } = req.body;

    let { data, error } = await supabase
      .from('bins')
      .update({
        location,
        code,
        capacity,
        filled_percentage: Number.isFinite(Number(filled_percentage)) ? Number(filled_percentage) : undefined,
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .select();

    // Backward compatibility for schemas with waste_type instead of code/filled_percentage
    if (
      error &&
      (
        String(error.message || '').toLowerCase().includes('code') ||
        String(error.message || '').toLowerCase().includes('filled_percentage')
      )
    ) {
      const fallback = await supabase
        .from('bins')
        .update({
          location,
          capacity,
          waste_type,
          status,
          updated_at: new Date()
        })
        .eq('id', id)
        .select();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error updating bin'
      });
    }

    res.json({
      success: true,
      message: 'Bin updated successfully',
      bin: data[0]
    });
  } catch (error) {
    console.error('Update bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteBin = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bins')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error deleting bin'
      });
    }

    res.json({
      success: true,
      message: 'Bin deleted successfully'
    });
  } catch (error) {
    console.error('Delete bin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// COLLECTION LOGS
// ============================================

exports.getCollectionLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('collection_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching collection logs'
      });
    }

    res.json({
      success: true,
      logs: data || []
    });
  } catch (error) {
    console.error('Get collection logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.addCollectionLog = async (req, res) => {
  try {
    const { bin_id, collector_name, weight_collected, notes } = req.body;

    const { data, error } = await supabase
      .from('collection_logs')
      .insert([
        {
          bin_id,
          collector_name,
          weight_collected,
          notes,
          collected_at: new Date(),
          created_at: new Date()
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error adding collection log'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Collection log added successfully',
      log: data[0]
    });
  } catch (error) {
    console.error('Add collection log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// REWARDS MANAGEMENT
// ============================================

exports.getRewards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching rewards'
      });
    }

    res.json({
      success: true,
      rewards: data || []
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.addReward = async (req, res) => {
  try {
    const { name, description, points_required, category, image_url } = req.body;

    const { data, error } = await supabase
      .from('rewards')
      .insert([
        {
          name,
          description,
          points_required,
          category,
          image_url,
          is_active: true,
          created_at: new Date()
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error adding reward'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reward added successfully',
      reward: data[0]
    });
  } catch (error) {
    console.error('Add reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, points_required, category, is_active } = req.body;

    const { data, error } = await supabase
      .from('rewards')
      .update({
        name,
        description,
        points_required,
        category,
        is_active,
        updated_at: new Date()
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error updating reward'
      });
    }

    res.json({
      success: true,
      message: 'Reward updated successfully',
      reward: data[0]
    });
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteReward = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error deleting reward'
      });
    }

    res.json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// WEBSITE LOGS
// ============================================
exports.getWebsiteLogs = async (req, res) => {
  try {
    const safeQuery = async (label, primaryQuery, fallbackQuery = null) => {
      const primary = await primaryQuery();
      if (!primary.error) {
        return primary.data || [];
      }

      console.warn(`[getWebsiteLogs] ${label} primary query failed:`, primary.error.message);

      if (!fallbackQuery) {
        return [];
      }

      const fallback = await fallbackQuery(primary.error);
      if (fallback && !fallback.error) {
        return fallback.data || [];
      }

      if (fallback?.error) {
        console.warn(`[getWebsiteLogs] ${label} fallback query failed:`, fallback.error.message);
      }

      return [];
    };

    const userAccounts = await safeQuery(
      'user_accounts',
      () => supabase
        .from('user_accounts')
        .select('system_id, campus_id, role, email, full_name, first_name, middle_name, last_name, created_at, updated_at, google_id')
        .order('created_at', { ascending: false })
    );

    const legacyUsers = await safeQuery(
      'users',
      () => supabase
        .from('users')
        .select('id, email, first_name, middle_name, last_name, role, created_at, updated_at, google_id')
        .order('created_at', { ascending: false })
    );

    const studentAccounts = await safeQuery(
      'student_accounts',
      () => supabase
        .from('student_accounts')
        .select('*')
        .order('created_at', { ascending: false })
    );

    const facultyAccounts = await safeQuery(
      'faculty_accounts',
      () => supabase
        .from('faculty_accounts')
        .select('*')
        .order('created_at', { ascending: false })
    );

    const otherAccounts = await safeQuery(
      'other_accounts',
      () => supabase
        .from('other_accounts')
        .select('*')
        .order('created_at', { ascending: false })
    );

    const adminAccounts = await safeQuery(
      'admin_accounts',
      () => supabase
        .from('admin_accounts')
        .select('id, email, full_name, First_Name, Last_Name, role, created_at, updated_at, phone')
        .order('created_at', { ascending: false })
        .limit(100)
    );

    const machineSessions = await safeQuery(
      'machine_sessions',
      () => supabase
        .from('machine_sessions')
        .select('id, machine_id, user_email, metal_count, plastic_count, paper_count, total_points, status, started_at, ended_at, updated_at')
        .order('started_at', { ascending: false })
        .limit(100),
      async (primaryError) => {
        if (!String(primaryError.message || '').toLowerCase().includes('user_email')) return null;
        return supabase
          .from('machine_sessions')
          .select('id, machine_id, metal_count, plastic_count, paper_count, total_points, status, started_at, ended_at, updated_at')
          .order('started_at', { ascending: false })
          .limit(100);
      }
    );

    const rewards = await safeQuery(
      'rewards',
      () => supabase
        .from('rewards')
        .select('id, name, description, points_cost, inventory, active, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100)
    );

    const redemptions = await safeQuery(
      'redemptions',
      () => supabase
        .from('redemptions')
        .select('id, user_id, gmail, reward_id, points_spent, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      async (primaryError) => {
        if (!String(primaryError.message || '').toLowerCase().includes('gmail')) return null;
        return supabase
          .from('redemptions')
          .select('id, user_id, reward_id, points_spent, status, created_at')
          .order('created_at', { ascending: false })
          .limit(100);
      }
    );

    const userAccountMap = new Map();
    const accountLogs = [];

    const registerAccount = (row, source, roleOverride) => {
      const identifier = String(row.system_id || row.id || '').trim();
      if (!identifier) return;

      const firstName = row.first_name || row.First_Name || '';
      const middleName = row.middle_name || '';
      const lastName = row.last_name || row.Last_Name || '';
      const fullName = String(row.full_name || `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim() || row.email || 'Unknown').trim();
      const email = String(row.email || 'Unknown').trim();
      const role = String(roleOverride || row.role || 'user').trim();
      const createdAt = row.created_at || null;
      const updatedAt = row.updated_at || null;
      const campusId = String(row.campus_id || row.student_id || row.faculty_id || row.account_id || '').trim();

      const entry = {
        id: `${source}-${identifier}`,
        source,
        systemId: identifier,
        name: fullName,
        email,
        role,
        createdAt,
        updatedAt,
        raw: row
      };

      accountLogs.push(entry);

      const lookupValue = {
        name: fullName,
        email,
        role,
        createdAt
      };

      if (identifier) {
        userAccountMap.set(identifier, lookupValue);
      }

      if (campusId) {
        userAccountMap.set(campusId, lookupValue);
      }

      const rowId = String(row.id || '').trim();
      if (rowId) {
        userAccountMap.set(rowId, lookupValue);
      }

      if (email && email !== 'Unknown') {
        userAccountMap.set(email.toLowerCase(), lookupValue);
      }
    };

    (userAccounts || []).forEach((row) => registerAccount(row, 'user_accounts'));
    (legacyUsers || []).forEach((row) => registerAccount(row, 'users'));
    (studentAccounts || []).forEach((row) => registerAccount(row, 'student_accounts', 'student'));
    (facultyAccounts || []).forEach((row) => registerAccount(row, 'faculty_accounts', 'faculty'));
    (otherAccounts || []).forEach((row) => registerAccount(row, 'other_accounts', 'staff'));
    (adminAccounts || []).forEach((row) => {
      const firstName = row.First_Name || row.full_name?.split(' ')[0] || '';
      const lastName = row.Last_Name || row.full_name?.split(' ').slice(1).join(' ') || '';
      registerAccount(
        {
          ...row,
          system_id: row.id,
          first_name: firstName,
          last_name: lastName
        },
        'admin_accounts',
        row.role || 'admin'
      );
    });

    const sessionLogs = (machineSessions || []).map((session) => ({
      id: session.id,
      machineId: session.machine_id,
      email: session.user_email || 'Unknown',
      metalCount: Number(session.metal_count || 0),
      plasticCount: Number(session.plastic_count || 0),
      paperCount: Number(session.paper_count || 0),
      totalPoints: Number(session.total_points || 0),
      status: session.status || 'unknown',
      startedAt: session.started_at || null,
      endedAt: session.ended_at || null,
      updatedAt: session.updated_at || null
    }));

    const rewardCreationLogs = (rewards || []).map((reward) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description || '',
      pointsCost: Number(reward.points_cost || 0),
      inventory: Number(reward.inventory || 0),
      active: reward.active === true,
      createdAt: reward.created_at || null,
      updatedAt: reward.updated_at || null
    }));

    const rewardLookup = new Map((rewards || []).map((reward) => [String(reward.id), reward]));
    const redemptionLogs = (redemptions || []).map((redemption) => {
      const redemptionUserKey = String(redemption.user_id || '').trim();
      const redemptionEmailKey = String(redemption.gmail || redemption.email || '').trim().toLowerCase();
      const account = userAccountMap.get(redemptionUserKey)
        || userAccountMap.get(redemptionUserKey.toLowerCase())
        || (redemptionEmailKey ? userAccountMap.get(redemptionEmailKey) : null)
        || null;
      const reward = rewardLookup.get(String(redemption.reward_id || '')) || null;
      const redemptionEmail = String(redemption.gmail || redemption.email || account?.email || '').trim();

      return {
        id: redemption.id,
        userId: redemption.user_id,
        userName: account?.name || 'Unknown user',
        userEmail: redemptionEmail || 'Unknown',
        gmail: redemptionEmail || 'Unknown',
        rewardId: redemption.reward_id,
        rewardName: reward?.name || 'Unknown reward',
        pointsSpent: Number(redemption.points_spent || reward?.points_cost || 0),
        status: redemption.status || 'completed',
        createdAt: redemption.created_at || null
      };
    });

    accountLogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({
      success: true,
      summary: {
        accountCreations: accountLogs.length,
        machineSessions: sessionLogs.length,
        rewardCreations: rewardCreationLogs.length,
        rewardRedemptions: redemptionLogs.length
      },
      logs: {
        accountCreations: accountLogs,
        machineSessions: sessionLogs,
        rewardCreations: rewardCreationLogs,
        rewardRedemptions: redemptionLogs
      }
    });
  } catch (error) {
    console.error('Website logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// USERS (ASSIGNEES) - for scheduling
// ============================================
exports.getAssignableUsers = async (req, res) => {
  try {
    // Prefer current app schema (user_accounts), fallback to legacy users table.
    let data = null;
    let error = null;

    const userAccountsRes = await supabase
      .from('user_accounts')
      .select('system_id,email,role,campus_id')
      .order('role', { ascending: true })
      .order('email', { ascending: true });

    if (!userAccountsRes.error) {
      data = (userAccountsRes.data || []).map((u) => ({
        system_id: u.system_id,
        email: u.email,
        role: u.role,
        campus_id: u.campus_id
      }));
    } else {
      const usersRes = await supabase
        .from('users')
        .select('id,email,role')
        .order('role', { ascending: true })
        .order('email', { ascending: true });

      if (usersRes.error) {
        error = usersRes.error;
      } else {
        data = (usersRes.data || []).map((u) => ({
          system_id: u.id,
          email: u.email,
          role: u.role || 'user',
          campus_id: null
        }));
      }
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Error fetching users: ${error.message}`,
        error: error.message
      });
    }

    res.json({
      success: true,
      users: data || []
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get Admin Accounts (for Schedule assignees)
// ============================================
exports.getAdminAccounts = async (req, res) => {
  try {
    console.log('\n========== GET ADMIN ACCOUNTS ==========');
    
    // Fetch all admins from admin_accounts table
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('id, email, full_name, First_Name, Last_Name, role, phone')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching admin accounts:', error.message);
      return res.status(400).json({
        success: false,
        message: `Error fetching admin accounts: ${error.message}`,
        error: error.message
      });
    }

    // Format data for frontend
    const formattedData = (data || []).map((admin) => {
      const firstName = admin.First_Name || admin.full_name?.split(' ')[0] || '';
      const lastName = admin.Last_Name || admin.full_name?.split(' ')[1] || '';
      const fullName = admin.full_name || `${firstName} ${lastName}`.trim() || admin.email;
      
      return {
        system_id: admin.id,
        id: admin.id,
        email: admin.email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: admin.role || 'admin',
        phone: admin.phone
      };
    });

    console.log(`✓ Found ${formattedData.length} admin accounts`);
    console.log('========================================\n');

    res.json({
      success: true,
      users: formattedData,
      admins: formattedData  // Also return as 'admins' for clarity
    });
  } catch (error) {
    console.error('Get admin accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getAccountsOverview = async (req, res) => {
  try {
    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();

    // Fallback for clients that do not send Bearer tokens on admin API calls.
    // We still verify role against admin_accounts before allowing access.
    if (!requesterRole) {
      const requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
      console.log('[DEBUG BACKEND] X-User-Email header:', requesterEmail);
      
      if (requesterEmail) {
        const { data: requesterAdmin, error: adminError } = await supabase
          .from('admin_accounts')
          .select('role')
          .ilike('email', requesterEmail)
          .maybeSingle();

        console.log('[DEBUG BACKEND] Admin query result:', requesterAdmin);
        console.log('[DEBUG BACKEND] Admin query error:', adminError);
        
        requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
        console.log('[DEBUG BACKEND] Resolved requester role:', requesterRole);
      }
    }

    console.log('[DEBUG BACKEND] Final role check - requesterRole:', requesterRole);
    
    if (requesterRole !== 'head') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: head role required'
      });
    }

    const { data: usersData, error: usersError } = await supabase
      .from('user_accounts')
      .select('system_id, campus_id, role, email, status, created_at, updated_at, google_id')
      .order('created_at', { ascending: false });

    if (usersError) {
      return res.status(400).json({
        success: false,
        message: `Error fetching user accounts: ${usersError.message}`,
        error: usersError.message
      });
    }

    const [studentRes, facultyRes, otherRes] = await Promise.all([
      supabase
        .from('student_accounts')
        .select('system_id, student_id, email, first_name, middle_name, last_name, program, year_level, birthdate, sex, profile_picture, cor, updated_at, qr_code, qr_value'),
      supabase
        .from('faculty_accounts')
        .select('system_id, faculty_id, email, first_name, middle_name, last_name, department, position, birthdate, sex, profile_picture, updated_at, qr_code, qr_value'),
      supabase
        .from('other_accounts')
        .select('system_id, account_id, email, first_name, middle_name, last_name, designation, affiliation, birthdate, sex, profile_picture, updated_at, qr_code, qr_value, points')
    ]);

    const studentMap = (studentRes.data || []).reduce((acc, row) => {
      acc[row.system_id] = row;
      return acc;
    }, {});
    const facultyMap = (facultyRes.data || []).reduce((acc, row) => {
      acc[row.system_id] = row;
      return acc;
    }, {});
    const otherMap = (otherRes.data || []).reduce((acc, row) => {
      acc[row.system_id] = row;
      return acc;
    }, {});

    const { data: accountPointsData, error: accountPointsError } = await supabase
      .from('account_points')
      .select('system_id, email, points, total_points, total_waste');

    if (accountPointsError) {
      console.warn('Error fetching account points:', accountPointsError.message);
    }

    const accountPointsBySystemId = (accountPointsData || []).reduce((acc, row) => {
      acc[String(row.system_id || '').trim()] = row;
      return acc;
    }, {});

    const accountPointsByEmail = (accountPointsData || []).reduce((acc, row) => {
      acc[String(row.email || '').trim().toLowerCase()] = row;
      return acc;
    }, {});

    const { data: adminsData, error: adminsError } = await supabase
      .from('admin_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (adminsError) {
      return res.status(400).json({
        success: false,
        message: `Error fetching admin accounts: ${adminsError.message}`,
        error: adminsError.message
      });
    }

    const users = (usersData || []).map((u) => {
      const normalizedRole = String(u.role || '').trim().toLowerCase();
      const profile = normalizedRole === 'student'
        ? (studentMap[u.system_id] || null)
        : normalizedRole === 'faculty'
          ? (facultyMap[u.system_id] || null)
          : (otherMap[u.system_id] || null);
      const pointsRecord = accountPointsBySystemId[String(u.system_id || '').trim()] || accountPointsByEmail[String(u.email || '').trim().toLowerCase()] || null;

      const firstName = profile?.first_name || '';
      const middleName = profile?.middle_name || '';
      const lastName = profile?.last_name || '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
      const pointsValue = Number(pointsRecord?.points ?? profile?.points ?? 0);
      const totalPointsValue = Number(pointsRecord?.total_points ?? pointsValue);

      return {
        id: u.system_id,
        system_id: u.system_id,
        campus_id: u.campus_id || '',
        role: normalizedRole === 'student' || normalizedRole === 'faculty' ? normalizedRole : 'other',
        email: u.email || profile?.email || '',
        status: u.status || 'active',
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        full_name: fullName || (u.email || ''),
        student_id: profile?.student_id || '',
        faculty_id: profile?.faculty_id || '',
        account_id: profile?.account_id || '',
        program: profile?.program || '',
        year_level: profile?.year_level || '',
        department: profile?.department || '',
        position: profile?.position || '',
        designation: profile?.designation || '',
        affiliation: profile?.affiliation || '',
        birthdate: profile?.birthdate || null,
        sex: profile?.sex || '',
        profile_picture: profile?.profile_picture || null,
        cor: profile?.cor || null,
        qr_code: profile?.qr_code || null,
        qr_value: profile?.qr_value || null,
        points: pointsValue,
        quantity: pointsValue,
        total_points: totalPointsValue,
        total_waste: 0,
        created_at: u.created_at || null,
        updated_at: profile?.updated_at || u.updated_at || null,
        google_id: u.google_id || null
      };
    });

    const admins = (adminsData || [])
      .filter((a) => {
        const roleText = String(a.role || '').trim().toLowerCase();
        const archivedByRole = roleText === 'archived';
        const archivedByFlag = Boolean(a.is_archived);
        return !archivedByRole && !archivedByFlag;
      })
      .map((a) => ({
      id: a.id,
      email: a.email || '',
      full_name:
        a.full_name ||
        [a.First_Name, a.Middle_Name, a.Last_Name].filter(Boolean).join(' ').trim() ||
        a.email ||
        '',
      role: String(a.role || 'admin').trim().toLowerCase(),
      phone: a.phone || '',
      first_name: a.First_Name || '',
      middle_name: a.Middle_Name || '',
      last_name: a.Last_Name || '',
      google_id: a.Google_ID || null,
      profile_picture: a.Profile_Picture || a.profile_picture || null,
      created_at: a.created_at || null,
      updated_at: a.updated_at || null
    }));

    const userRoleCounts = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    const adminRoleCounts = admins.reduce((acc, a) => {
      acc[a.role] = (acc[a.role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      users,
      admins,
      summary: {
        usersTotal: users.length,
        adminsTotal: admins.length,
        userRoleCounts,
        adminRoleCounts
      }
    });
  } catch (error) {
    console.error('Get accounts overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// User Points Management
exports.getAccountDetails = async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim().toLowerCase();

    if (!email || !['user', 'admin'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'email and type=user|admin are required'
      });
    }

    if (type === 'user') {
      const { data: userData, error: userError } = await supabase
        .from('user_accounts')
        .select('system_id, campus_id, role, email, status, password, created_at, updated_at, google_id')
        .ilike('email', email)
        .maybeSingle();

      if (userError || !userData) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const role = String(userData.role || '').trim().toLowerCase();
      const tableName = role === 'student' ? 'student_accounts' : role === 'faculty' ? 'faculty_accounts' : 'other_accounts';

      const profileRes = await supabase 
        .from(tableName)
        .select('*')
        .eq('system_id', userData.system_id)
        .maybeSingle();

      const { data: pointsData, error: pointsError } = await supabase
        .from('account_points')
        .select('system_id, email, points, total_points, total_waste')
        .or(`system_id.eq.${String(userData.system_id || '').trim()},email.ilike.${email}`)
        .maybeSingle();

      if (pointsError) {
        console.warn('Error fetching account points detail:', pointsError.message);
      }

      const profile = profileRes.data || null;

      const firstName = profile?.first_name || '';
      const middleName = profile?.middle_name || '';
      const lastName = profile?.last_name || '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();

      return res.json({
        success: true,
        account: {
          type: 'user',
          id: userData.system_id,
          system_id: userData.system_id,
          campus_id: userData.campus_id || '',
          role,
          email: userData.email || '',
          status: userData.status || 'active',
          has_password: Boolean(userData.password),
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          full_name: fullName || userData.email || '',
          student_id: profile?.student_id || '',
          faculty_id: profile?.faculty_id || '',
          account_id: profile?.account_id || '',
          program: profile?.program || '',
          year_level: profile?.year_level || '',
          department: profile?.department || '',
          position: profile?.position || '',
          designation: profile?.designation || '',
          affiliation: profile?.affiliation || '',
          birthdate: profile?.birthdate || null,
          sex: profile?.sex || '',
          profile_picture: profile?.profile_picture || null,
          cor: profile?.cor || null,
          qr_code: profile?.qr_code || null,
          qr_value: profile?.qr_value || null,
          points: Number(pointsData?.points ?? profile?.points ?? 0),
          quantity: Number(pointsData?.points ?? profile?.points ?? 0),
          total_points: Number(pointsData?.total_points ?? pointsData?.points ?? profile?.points ?? 0),
          total_waste: 0,
          google_id: userData.google_id || null,
          created_at: userData.created_at || null,
          updated_at: profile?.updated_at || userData.updated_at || null
        }
      });
    }

    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    return res.json({
      success: true,
      account: {
        type: 'admin',
        id: data.id,
        system_id: data.id,
        email: data.email || '',
        full_name: data.full_name || [data.First_Name, data.Middle_Name, data.Last_Name].filter(Boolean).join(' ').trim() || data.email || '',
        role: String(data.role || 'admin').trim().toLowerCase(),
        phone: data.phone || '',
        has_password: Boolean(data.password),
        first_name: data.First_Name || '',
        middle_name: data.Middle_Name || '',
        last_name: data.Last_Name || '',
        google_id: data.Google_ID || null,
        profile_picture: data.Profile_Picture || data.profile_picture || null,
        created_at: data.created_at || null,
        updated_at: data.updated_at || null
      }
    });
  } catch (error) {
    console.error('Get account details error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateAccountDetails = async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim().toLowerCase();
    const payload = req.body || {};
    const cleanNullableString = (value) => {
      const text = String(value ?? '').trim();
      return text ? text : null;
    };

    if (!email || !['user', 'admin'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'email and type=user|admin are required'
      });
    }

    const requestedEmail = String(payload.email || '').trim().toLowerCase();
    if (requestedEmail && requestedEmail !== email) {
      return res.status(400).json({
        success: false,
        message: 'Email cannot be changed'
      });
    }

    // Only head role can edit admin accounts.
    if (type === 'admin') {
      let requesterRole = String(req?.user?.role || '').trim().toLowerCase();
      if (!requesterRole) {
        const requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
        if (requesterEmail) {
          const { data: requesterAdmin } = await supabase
            .from('admin_accounts')
            .select('role')
            .ilike('email', requesterEmail)
            .maybeSingle();
          requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
        }
      }

      if (requesterRole !== 'head') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: head role required to edit admin accounts'
        });
      }
    }

    if (type === 'user') {
      // First, fetch the current user to check if they exist
      const { data: currentUser, error: fetchError } = await supabase
        .from('user_accounts')
        .select('system_id, campus_id, role, email, password, created_at, updated_at, google_id')
        .eq('email', email)
        .maybeSingle();

      if (fetchError || !currentUser) {
        return res.status(400).json({
          success: false,
          message: 'User not found',
          error: fetchError?.message
        });
      }

      // Build updates object with only fields that are being changed
      const updates = {};
      let hasChanges = false;
      
      // Only add role if it's being changed
      if (payload.role !== undefined && payload.role !== currentUser.role) {
        updates.role = payload.role ?? 'student';
        hasChanges = true;
      }
      
      // Only add status if it's being changed
      if (payload.status !== undefined && payload.status !== currentUser.status) {
        updates.status = payload.status ?? 'active';
        hasChanges = true;
      }
      
      // Handle password - validate if provided
      const passwordText = String(payload.password || '').trim();
      if (passwordText) {
        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(passwordText)) {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
          });
        }
        
        // Hash the password with bcrypt
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(passwordText, 10);
        updates.password = hashedPassword;
        hasChanges = true;
      }

      // IMPORTANT: Never modify campus_id - it's set at creation and referenced by account_points
      // If campus_id is in payload, log warning but don't update
      if (payload.campus_id !== undefined) {
        console.warn(`[SECURITY] Attempted to modify campus_id for ${email}. This is not allowed.`);
      }

      // Always include updated_at if there are changes
      if (hasChanges) {
        updates.updated_at = new Date().toISOString();
      }

      let data = currentUser;

      // Only update if there are actual changes
      if (hasChanges) {
        const updateResult = await supabase
          .from('user_accounts')
          .update(updates)
          .eq('email', email)
          .select('system_id, campus_id, role, email, password, created_at, updated_at, google_id')
          .maybeSingle();

        if (updateResult.error || !updateResult.data) {
          return res.status(400).json({ 
            success: false, 
            message: `Error updating user: ${updateResult.error?.message || 'Update failed'}`, 
            error: updateResult.error?.message 
          });
        }
        
        data = updateResult.data;
      }

      const role = String(data.role || '').trim().toLowerCase();
      const targetTable = role === 'student' ? 'student_accounts' : role === 'faculty' ? 'faculty_accounts' : 'other_accounts';

      const existingTargetRes = await supabase
        .from(targetTable)
        .select('*')
        .eq('system_id', data.system_id)
        .maybeSingle();

      const existingProfile = existingTargetRes.data || {};
      const emailLocalPart = String(data.email || '').split('@')[0] || 'user';
      const defaultFirst = String(existingProfile.first_name || payload.first_name || emailLocalPart || 'User').trim();
      const defaultLast = String(existingProfile.last_name || payload.last_name || 'User').trim();

      const profilePayload = {
        system_id: data.system_id,
        email: data.email,
        first_name: cleanNullableString(payload.first_name) || defaultFirst,
        middle_name: cleanNullableString(payload.middle_name),
        last_name: cleanNullableString(payload.last_name) || defaultLast,
        birthdate: cleanNullableString(payload.birthdate),
        sex: cleanNullableString(payload.sex),
        profile_picture: cleanNullableString(payload.profile_picture),
        updated_at: new Date().toISOString(),
        qr_code: cleanNullableString(payload.qr_code),
        qr_value: cleanNullableString(payload.qr_value)
      };

      if (targetTable === 'student_accounts') {
        profilePayload.student_id =
          cleanNullableString(payload.student_id) ||
          cleanNullableString(existingProfile.student_id) ||
          cleanNullableString(data.campus_id) ||
          `STU-${String(data.system_id).slice(0, 8)}`;
        profilePayload.program = cleanNullableString(payload.program);
        profilePayload.year_level = cleanNullableString(payload.year_level);
        profilePayload.cor = cleanNullableString(payload.cor);
      } else if (targetTable === 'faculty_accounts') {
        profilePayload.faculty_id = cleanNullableString(payload.faculty_id) || cleanNullableString(existingProfile.faculty_id);
        profilePayload.department = cleanNullableString(payload.department);
        profilePayload.position = cleanNullableString(payload.position);
      } else {
        profilePayload.account_id =
          cleanNullableString(payload.account_id) ||
          cleanNullableString(existingProfile.account_id) ||
          `OTH-${String(data.system_id).slice(0, 8)}`;
        profilePayload.designation = cleanNullableString(payload.designation);
        profilePayload.affiliation = cleanNullableString(payload.affiliation);
        profilePayload.points = Number(payload.points ?? existingProfile.points ?? 0) || 0;
      }

      const upsertProfileRes = await supabase
        .from(targetTable)
        .upsert(profilePayload, { onConflict: 'system_id' })
        .select('*')
        .single();

      if (upsertProfileRes.error) {
        return res.status(400).json({
          success: false,
          message: `Error updating ${targetTable}: ${upsertProfileRes.error.message}`,
          error: upsertProfileRes.error.message
        });
      }

      await Promise.all([
        targetTable === 'student_accounts' ? Promise.resolve() : supabase.from('student_accounts').delete().eq('system_id', data.system_id),
        targetTable === 'faculty_accounts' ? Promise.resolve() : supabase.from('faculty_accounts').delete().eq('system_id', data.system_id),
        targetTable === 'other_accounts' ? Promise.resolve() : supabase.from('other_accounts').delete().eq('system_id', data.system_id)
      ]);

      const profile = upsertProfileRes.data;
      const firstName = profile?.first_name || '';
      const middleName = profile?.middle_name || '';
      const lastName = profile?.last_name || '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
      const pointsValue = Number(profile?.points || 0);

      return res.json({
        success: true,
        message: 'User updated successfully',
        account: {
          type: 'user',
          id: data.system_id,
          system_id: data.system_id,
          campus_id: data.campus_id || '',
          role,
          email: data.email || '',
          has_password: Boolean(data.password),
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          full_name: fullName || data.email || '',
          student_id: profile?.student_id || '',
          faculty_id: profile?.faculty_id || '',
          account_id: profile?.account_id || '',
          program: profile?.program || '',
          year_level: profile?.year_level || '',
          department: profile?.department || '',
          position: profile?.position || '',
          designation: profile?.designation || '',
          affiliation: profile?.affiliation || '',
          birthdate: profile?.birthdate || null,
          sex: profile?.sex || '',
          profile_picture: profile?.profile_picture || null,
          cor: profile?.cor || null,
          qr_code: profile?.qr_code || null,
          qr_value: profile?.qr_value || null,
          points: pointsValue,
          quantity: pointsValue,
          total_points: pointsValue,
          total_waste: 0,
          google_id: data.google_id || null,
          created_at: data.created_at || null,
          updated_at: profile?.updated_at || data.updated_at || null
        }
      });
    }

    const updates = {
      role: payload.role ?? 'admin',
      phone: cleanNullableString(payload.phone),
      "First_Name": cleanNullableString(payload.first_name),
      "Middle_Name": cleanNullableString(payload.middle_name),
      "Last_Name": cleanNullableString(payload.last_name),
      "Google_ID": cleanNullableString(payload.google_id),
      full_name: cleanNullableString(payload.full_name) || [payload.first_name, payload.middle_name, payload.last_name].map(cleanNullableString).filter(Boolean).join(' ') || null,
      updated_at: new Date().toISOString()
    };

    const profilePictureText = cleanNullableString(payload.profile_picture);
    const hasProfilePictureField = Object.prototype.hasOwnProperty.call(payload, 'profile_picture');
    let usedProfilePictureFallback = false;
    if (hasProfilePictureField) {
      updates['Profile_Picture'] = profilePictureText;
    }

    const passwordText = String(payload.password || '').trim();
    if (passwordText) {
      updates.password = passwordText;
    }

    let updateResult = await supabase
      .from('admin_accounts')
      .update(updates)
      .ilike('email', email)
      .select('*')
      .maybeSingle();

    // Backward compatibility:
    // 1) retry with lowercase profile_picture
    // 2) if still missing, fail clearly when profile picture update was requested
    if (updateResult.error && hasProfilePictureField && String(updateResult.error.message || '').toLowerCase().includes('profile_picture')) {
      const lowercaseFallbackUpdates = { ...updates };
      delete lowercaseFallbackUpdates['Profile_Picture'];
      lowercaseFallbackUpdates['profile_picture'] = profilePictureText;

      updateResult = await supabase
        .from('admin_accounts')
        .update(lowercaseFallbackUpdates)
        .ilike('email', email)
        .select('*')
        .maybeSingle();

      if (!updateResult.error) {
        usedProfilePictureFallback = true;
      } else if (String(updateResult.error.message || '').toLowerCase().includes('profile_picture')) {
        return res.status(400).json({
          success: false,
          message: 'Admin profile picture column is missing. Run migrations/admin_accounts_archiving_and_profile_picture.sql, then retry.',
          error: updateResult.error.message
        });
      }
    }

    const { data, error } = updateResult;

    if (error || !data) {
      return res.status(400).json({ success: false, message: `Error updating admin: ${error?.message || 'Admin not found'}`, error: error?.message });
    }

    return res.json({
      success: true,
      message: usedProfilePictureFallback ? 'Admin updated successfully (using lowercase profile_picture column)' : 'Admin updated successfully',
      account: {
        type: 'admin',
        id: data.id,
        system_id: data.id,
        email: data.email || '',
        full_name: data.full_name || [data.First_Name, data.Middle_Name, data.Last_Name].filter(Boolean).join(' ').trim() || data.email || '',
        role: String(data.role || 'admin').trim().toLowerCase(),
        phone: data.phone || '',
        has_password: Boolean(data.password),
        first_name: data.First_Name || '',
        middle_name: data.Middle_Name || '',
        last_name: data.Last_Name || '',
        google_id: data.Google_ID || null,
        profile_picture: data.Profile_Picture || data.profile_picture || null,
        created_at: data.created_at || null,
        updated_at: data.updated_at || null
      }
    });
  } catch (error) {
    console.error('Update account details error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    console.log('=== CREATE ACCOUNT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { type, email, role, password, profile_picture, google_id } = req.body;
    
    // Validate required fields
    if (!type || !['admin', 'user'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Account type (admin or user) is required'
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const cleanNullableString = (value) => {
      const text = String(value ?? '').trim();
      return text ? text : null;
    };

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedType = type.toLowerCase();
    const now = new Date().toISOString();

    // Hash the password with bcrypt
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if email already exists
    if (normalizedType === 'admin') {
      const { data: existingAdmin } = await supabase
        .from('admin_accounts')
        .select('email')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists in admin accounts'
        });
      }
    } else {
      const { data: existingUser } = await supabase
        .from('user_accounts')
        .select('email')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists in user accounts'
        });
      }
    }

    if (normalizedType === 'admin') {
      // Create Admin Account
      const adminPayload = {
        email: normalizedEmail,
        role: role.toLowerCase(),
        password: hashedPassword,
        phone: cleanNullableString(req.body.phone),
        "First_Name": cleanNullableString(req.body.first_name),
        "Middle_Name": cleanNullableString(req.body.middle_name),
        "Last_Name": cleanNullableString(req.body.last_name),
        "Google_ID": cleanNullableString(google_id),
        "Profile_Picture": cleanNullableString(profile_picture),
        full_name: cleanNullableString(req.body.full_name) || [req.body.first_name, req.body.middle_name, req.body.last_name].map(cleanNullableString).filter(Boolean).join(' ') || null,
        created_at: now,
        updated_at: now
      };

      console.log('Admin payload:', JSON.stringify(adminPayload, null, 2));

      const { data: newAdmin, error: adminError } = await supabase
        .from('admin_accounts')
        .insert([adminPayload])
        .select();

      if (adminError) {
        console.error('Admin creation error:', adminError.message);
        return res.status(400).json({
          success: false,
          message: 'Failed to create admin account: ' + adminError.message,
          error: adminError.message
        });
      }

      console.log('✓ Admin account created:', JSON.stringify(newAdmin, null, 2));

      console.log('✓ Admin account created:', JSON.stringify(newAdmin, null, 2));

      return res.json({
        success: true,
        message: 'Admin account created successfully',
        account: {
          type: 'admin',
          email: normalizedEmail,
          role: role.toLowerCase(),
          created_at: now
        }
      });

    } else {
      // Create User Account
      const campusId = cleanNullableString(req.body.campus_id) || `USR-${Date.now()}`;
      
      const userPayload = {
        email: normalizedEmail,
        campus_id: campusId,
        role: role.toLowerCase(),
        password: hashedPassword,
        google_id: cleanNullableString(google_id),
        created_at: now,
        updated_at: now
      };

      const { data: newUser, error: userError } = await supabase
        .from('user_accounts')
        .insert([userPayload])
        .select('system_id, email, campus_id, role');

      if (userError) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create user account: ' + userError.message,
          error: userError.message
        });
      }

      if (!newUser || newUser.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User account was created but could not retrieve system_id'
        });
      }

      const systemId = newUser[0].system_id;
      const normalizedRole = String(role || '').trim().toLowerCase();
      const targetTable = normalizedRole === 'student' ? 'student_accounts' : normalizedRole === 'faculty' ? 'faculty_accounts' : 'other_accounts';

      console.log(`Creating profile in table: ${targetTable} for role: ${normalizedRole}`);

      const profilePayload = {
        system_id: systemId,
        email: normalizedEmail,
        first_name: cleanNullableString(req.body.first_name) || 'User',
        middle_name: cleanNullableString(req.body.middle_name),
        last_name: cleanNullableString(req.body.last_name) || 'Account',
        birthdate: cleanNullableString(req.body.birthdate),
        sex: cleanNullableString(req.body.sex),
        profile_picture: cleanNullableString(profile_picture),
        created_at: now,
        updated_at: now
      };

      if (targetTable === 'student_accounts') {
        profilePayload.student_id = cleanNullableString(req.body.student_id) || `STU-${String(systemId).slice(0, 8)}`;
        profilePayload.program = cleanNullableString(req.body.program);
        profilePayload.year_level = cleanNullableString(req.body.year_level);
        profilePayload.cor = cleanNullableString(req.body.cor);
      } else if (targetTable === 'faculty_accounts') {
        profilePayload.faculty_id = cleanNullableString(req.body.faculty_id) || `FAC-${String(systemId).slice(0, 8)}`;
        profilePayload.department = cleanNullableString(req.body.department);
        profilePayload.position = cleanNullableString(req.body.position);
      } else {
        profilePayload.account_id = cleanNullableString(req.body.account_id) || `OTH-${String(systemId).slice(0, 8)}`;
        profilePayload.designation = cleanNullableString(req.body.designation);
        profilePayload.affiliation = cleanNullableString(req.body.affiliation);
      }

      console.log(`Profile payload for ${targetTable}:`, JSON.stringify(profilePayload, null, 2));

      const { data: profileData, error: profileError } = await supabase
        .from(targetTable)
        .insert([profilePayload])
        .select();

      if (profileError) {
        console.error(`Failed to create ${targetTable} profile: ${profileError.message}`, profileError);
        return res.status(400).json({
          success: false,
          message: `Failed to create user profile in ${targetTable}: ${profileError.message}`,
          error: profileError.message,
          details: 'User account was created but profile setup failed'
        });
      }

      if (!profileData || profileData.length === 0) {
        console.warn(`Profile was created but returned no data from ${targetTable}`);
      } else {
        console.log(`✓ Profile created in ${targetTable}:`, JSON.stringify(profileData, null, 2));
      }

      // Create account_points record
      const { error: pointsError } = await supabase
        .from('account_points')
        .insert([{
          system_id: systemId,
          email: normalizedEmail,
          campus_id: campusId,
          points: 0,
          total_points: 0,
          total_waste: 0,
          created_at: now,
          updated_at: now
        }]);

      if (pointsError) {
        console.warn(`Failed to create account_points record: ${pointsError.message}`);
      } else {
        console.log(`✓ Account points record created for ${email}`);
      }

      console.log('=== ACCOUNT CREATION COMPLETE ===');
      return res.json({
        success: true,
        message: 'User account created successfully',
        account: {
          type: 'user',
          email: normalizedEmail,
          campus_id: campusId,
          role: role.toLowerCase(),
          system_id: systemId,
          created_at: now
        }
      });
    }

  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating account',
      error: error.message
    });
  }
};

exports.updateUserPoints = async (req, res) => {
  try {
    const { email } = req.params;
    const points = Number(req.body?.points || 0);
    const operation = String(req.body?.operation || '').trim().toLowerCase();
    let logDate = String(req.body?.log_date || '').trim();
    let logTime = String(req.body?.log_time || '').trim();
    
    // Validate and sanitize timestamp formats using shared utilities
    logDate = timestampUtils.sanitizeDate(logDate);
    logTime = timestampUtils.sanitizeTime(logTime);
    
    console.log('[TIMESTAMP] Sanitized timestamps - Date:', logDate, 'Time:', logTime);

    if (!email || !operation || Number.isNaN(points)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, points, operation'
      });
    }

    if (!['add', 'deduct'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Operation must be either "add" or "deduct"'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: userData, error: userError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { data: pointsData, error: pointsError } = await supabase
      .from('account_points')
      .select('system_id, email, campus_id, points, total_points, total_waste')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    const currentPoints = Number(pointsData?.points || 0);
    const currentTotalPoints = Number(pointsData?.total_points || currentPoints);
    let newPoints = currentPoints;
    let newTotalPoints = currentTotalPoints;

    if (operation === 'add') {
      newPoints = currentPoints + points;
      newTotalPoints = currentTotalPoints + points;
    } else {
      newPoints = Math.max(0, currentPoints - points);
    }

    const payload = {
      system_id: userData.system_id,
      email: userData.email,
      campus_id: userData.campus_id || null,
      points: newPoints,
      total_points: newTotalPoints,
      total_waste: Number(pointsData?.total_waste || 0),
      updated_at: new Date().toISOString()
    };

    const upsertRes = await supabase
      .from('account_points')
      .upsert(payload, { onConflict: 'system_id' })
      .select('system_id, email, campus_id, points, total_points, total_waste, updated_at')
      .single();

    if (upsertRes.error) {
      console.error('Points update error:', upsertRes.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update points',
        error: upsertRes.error.message
      });
    }

    // Log the admin adjustment to peer_transfer_logs
    try {
      // Use provided timestamps from client (device local time), fallback to server time
      const fallbackTimestamp = timestampUtils.getCurrentTimestamp();
      
      const logPayload = {
        system_id: userData.system_id,
        campus_id: userData.campus_id || null,
        from_email: operation === 'add' ? 'admin@system' : normalizedEmail,
        from_name: operation === 'add' ? 'System Admin' : normalizedEmail,
        to_email: operation === 'add' ? normalizedEmail : 'admin@system',
        to_name: operation === 'add' ? normalizedEmail : 'System Admin',
        points_transferred: Math.abs(points),
        log_date: logDate || fallbackTimestamp.date,
        log_time: logTime || fallbackTimestamp.time
      };

      console.log('[LOGGING] Attempting to log peer transfer:', logPayload);

      const { data: logData, error: logError } = await supabase
        .from('peer_transfer_logs')
        .insert([logPayload])
        .select();

      if (logError) {
        console.error('❌ Failed to log admin points adjustment:', logError);
        console.error('Error details:', logError.code, logError.message, logError.details);
      } else {
        console.log(`✅ Admin points adjustment logged successfully:`, logData);
        
        // Also add transfer details
        if (logData && logData.length > 0) {
          const peertransfer_id = logData[0].peertransfer_id;
          
          const detailPayload = {
            peertransfer_id,
            transaction_type: operation === 'add' ? 'admin-added' : 'admin-deducted',
            description: `Points ${operation === 'add' ? 'added' : 'deducted'} for ${normalizedEmail}`,
            subdescription: `Admin adjustment by system`,
            quantity: `${Math.abs(points)} points`,
            reason: operation === 'add' ? 'admin bonus' : 'admin adjustment',
            status: 'Completed'
          };

          const { data: detailData, error: detailError } = await supabase
            .from('peer_transfer_details')
            .insert([detailPayload])
            .select();

          if (detailError) {
            console.error('❌ Failed to add transfer detail:', detailError);
          } else {
            console.log(`✅ Transfer detail added:`, detailData);
          }
        }
      }
    } catch (logErr) {
      console.error('❌ Exception logging admin points adjustment:', logErr);
    }

    res.json({
      success: true,
      message: `Points ${operation === 'add' ? 'added' : 'deducted'} successfully`,
      points: Number(upsertRes.data?.points || newPoints),
      total_points: Number(upsertRes.data?.total_points || newTotalPoints),
      previousPoints: currentPoints,
      operation
    });
  } catch (error) {
    console.error('Update user points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// SCHEDULE MANAGEMENT
// ============================================

exports.getSchedule = async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('scheduled_at', { ascending: true });

    // Backward compatibility: old schema used scheduled_date
    if (error && String(error.message || '').toLowerCase().includes('scheduled_at')) {
      const legacyRes = await supabase
        .from('schedules')
        .select('*')
        .order('scheduled_date', { ascending: true });
      data = legacyRes.data;
      error = legacyRes.error;
    }

    if (error) {
      console.error('[getSchedule] Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: `Error fetching schedules: ${error.message}`,
        error: error.message
      });
    }

    // DEBUG: Log what we're returning from database (safely)
    if (data && data.length > 0) {
      console.log('[getSchedule] Fetched ' + data.length + ' schedules from DB');
      console.log('[getSchedule] First schedule assigned_to:', {
        assigned_to: data[0].assigned_to,
        assigned_to_type: typeof data[0].assigned_to,
        assigned_to_isNull: data[0].assigned_to === null
      });
    }

    // IMPORTANT: Ensure assigned_to is always a string (UUID) or null, never an object
    const cleanedData = (data || []).map(d => {
      let cleanedAssignedTo = d.assigned_to;
      
      // If assigned_to is an object, try to extract the ID
      if (typeof cleanedAssignedTo === 'object' && cleanedAssignedTo !== null) {
        console.warn('[getSchedule] assigned_to is an object, extracting id:', cleanedAssignedTo);
        cleanedAssignedTo = cleanedAssignedTo.id || cleanedAssignedTo.system_id || null;
      }
      
      return {
        ...d,
        assigned_to: cleanedAssignedTo
      };
    });

    res.json({
      success: true,
      schedules: cleanedData
    });
  } catch (error) {
    console.error('[getSchedule] Server error:', error.message, error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: error.message
    });
  }
};

exports.addSchedule = async (req, res) => {
  try {
    let { bin_id, assigned_to, task, scheduled_at, end_time, notes, status } = req.body;

    console.log('[addSchedule] Raw assigned_to value:', assigned_to, '(type:', typeof assigned_to, ')');

    // Normalize bin_id
    if (bin_id === '') bin_id = null;

    console.log('[addSchedule] Received payload:', {
      bin_id,
      assigned_to,
      task,
      scheduled_at,
      end_time,
      notes,
      status
    });

    if (!task || !scheduled_at) {
      console.error('[addSchedule] Validation failed - missing task or scheduled_at');
      return res.status(400).json({
        success: false,
        message: 'task and scheduled_at are required'
      });
    }

    // DEBUG: Include assigned_to to see what frontend sends
    console.log('[addSchedule] Frontend sent assigned_to:', assigned_to, '(type:', typeof assigned_to, ', length:', assigned_to ? assigned_to.length : 0, ')');
    
    const insertData = {
      bin_id: bin_id || null,
      task,
      scheduled_at,
      assigned_to: assigned_to || null,  // ✅ Re-enabled for debugging
      notes: notes || null,
      status: status || 'pending'
    };

    // Try to include end_time if provided
    if (end_time) {
      insertData.end_time = end_time;
    }

    console.log('[addSchedule] Final insert payload:', insertData);
    console.log('[addSchedule] About to insert with payload:', JSON.stringify(insertData, null, 2));

    let { data, error } = await supabase
      .from('schedules')
      .insert([insertData])
      .select();

    // If FK constraint error on assigned_to, retry with assigned_to = null
    if (error && String(error.message || '').toLowerCase().includes('assigned_to_fkey')) {
      console.warn('[addSchedule] FK constraint error - assigned_to is invalid:', assigned_to, '- retrying with assigned_to = null');
      const retryData = { ...insertData };
      retryData.assigned_to = null;
      const retry = await supabase
        .from('schedules')
        .insert([retryData])
        .select();
      data = retry.data;
      error = retry.error;
    }

    // If there's an end_time field error, retry without it
    if (error && String(error.message || '').toLowerCase().includes('end_time')) {
      console.warn('[addSchedule] end_time field not supported, retrying without it');
      const retryData = { ...insertData };
      delete retryData.end_time;
      const retry = await supabase
        .from('schedules')
        .insert([retryData])
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[addSchedule] Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: `Error adding schedule: ${error.message}`,
        error: error.message
      });
    }

    console.log('[addSchedule] Success:', data);
    
    // Send email notification if assigned_to is set
    if (assigned_to && data && data.length > 0) {
      try {
        const emailService = require('../services/emailService');
        
        console.log('[addSchedule] Attempting to send email - assigned_to:', assigned_to);
        
        // Get admin details from admin_accounts table
        // Note: admin_accounts uses 'id' as primary key, not 'system_id'
        const { data: adminData, error: adminError } = await supabase
          .from('admin_accounts')
          .select('email, full_name')
          .eq('id', assigned_to)
          .single();
        
        if (adminError) {
          console.warn('[addSchedule] Could not fetch admin details for email:', adminError.message);
          console.warn('[addSchedule] Tried to query admin_accounts with id =', assigned_to);
        } else if (adminData && adminData.email) {
          console.log('[addSchedule] ✓ Found admin:', adminData.email);
          console.log('[addSchedule] Sending schedule notification to:', adminData.email);
          
          const eventDetails = {
            task: task,
            scheduled_at: scheduled_at,
            end_time: end_time,
            type: req.body.type || 'Collection',
            notes: notes,
            bin_id: bin_id,
            bin_label: req.body.bin_label || null
          };
          
          const emailSent = await emailService.sendScheduleNotification(
            adminData.email,
            adminData.full_name || 'Admin',
            eventDetails
          );
          
          if (emailSent) {
            console.log('[addSchedule] ✓ Schedule notification email sent successfully');
          } else {
            console.warn('[addSchedule] ⚠️ Failed to send schedule notification email (non-blocking)');
          }
        } else {
          console.warn('[addSchedule] Admin data found but no email:', adminData);
        }
      } catch (emailError) {
        console.error('[addSchedule] Error sending schedule notification:', emailError.message);
        console.error('[addSchedule] Error details:', emailError);
        // Don't fail the schedule creation if email fails
      }
    } else {
      console.log('[addSchedule] No email to send - assigned_to:', assigned_to, 'data length:', data?.length);
    }
    
    res.status(201).json({
      success: true,
      message: 'Schedule added successfully',
      schedules: data
    });
  } catch (error) {
    console.error('[addSchedule] Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    let { bin_id, assigned_to, task, scheduled_at, end_time, status, notes } = req.body;

    console.log('[updateSchedule] Raw assigned_to value:', assigned_to, '(type:', typeof assigned_to, ')');

    if (bin_id === '') bin_id = null;

    console.log('[updateSchedule] Received payload:', {
      id,
      bin_id,
      assigned_to,
      task,
      scheduled_at,
      end_time,
      status,
      notes
    });

    // DEBUG: Include assigned_to to see what frontend sends
    console.log('[updateSchedule] Frontend sent assigned_to:', assigned_to, '(type:', typeof assigned_to, ', length:', assigned_to ? assigned_to.length : 0, ')');
    
    const updateData = {
      bin_id: bin_id || null,
      task,
      scheduled_at,
      assigned_to: assigned_to || null,  // ✅ Re-enabled for debugging
      status: status || 'pending',
      notes: notes || null
    };

    // Try to include end_time if provided
    if (end_time) {
      updateData.end_time = end_time;
    }

    console.log('[updateSchedule] Final update payload:', updateData);

    let { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select();

    // If FK constraint error on assigned_to, retry with assigned_to = null
    if (error && String(error.message || '').toLowerCase().includes('assigned_to_fkey')) {
      console.warn('[updateSchedule] FK constraint error - assigned_to is invalid:', assigned_to, '- retrying with assigned_to = null');
      const retryData = { ...updateData };
      retryData.assigned_to = null;
      const retry = await supabase
        .from('schedules')
        .update(retryData)
        .eq('id', id)
        .select();
      data = retry.data;
      error = retry.error;
    }

    // Backward compatibility for legacy schedule schema
    if (error && String(error.message || '').toLowerCase().includes('scheduled_at')) {
      console.log('[updateSchedule] Falling back to legacy schema');
      const legacyUpdateData = {
        task,
        scheduled_date: scheduled_at ? new Date(scheduled_at).toISOString().slice(0, 10) : null,
        status: status || 'pending',
        notes: notes || null
      };
      
      const legacyUpdate = await supabase
        .from('schedules')
        .update(legacyUpdateData)
        .eq('id', id)
        .select();
      data = legacyUpdate.data;
      error = legacyUpdate.error;
    }

    // If there's an end_time field error, retry without it
    if (error && String(error.message || '').toLowerCase().includes('end_time')) {
      console.warn('[updateSchedule] end_time field not supported, retrying without it');
      const retryData = { ...updateData };
      delete retryData.end_time;
      const retry = await supabase
        .from('schedules')
        .update(retryData)
        .eq('id', id)
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[updateSchedule] Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: `Error updating schedule: ${error.message}`,
        error: error.message
      });
    }

    console.log('[updateSchedule] Success:', data);
    
    // Send email notification if assigned_to is set (for updates)
    if (assigned_to && data && data.length > 0) {
      try {
        const emailService = require('../services/emailService');
        
        console.log('[updateSchedule] Attempting to send email - assigned_to:', assigned_to);
        
        // Get admin details from admin_accounts table
        // Note: admin_accounts uses 'id' as primary key, not 'system_id'
        const { data: adminData, error: adminError } = await supabase
          .from('admin_accounts')
          .select('email, full_name')
          .eq('id', assigned_to)
          .single();
        
        if (adminError) {
          console.warn('[updateSchedule] Could not fetch admin details for email:', adminError.message);
          console.warn('[updateSchedule] Tried to query admin_accounts with id =', assigned_to);
        } else if (adminData && adminData.email) {
          console.log('[updateSchedule] ✓ Found admin:', adminData.email);
          console.log('[updateSchedule] Sending schedule update notification to:', adminData.email);
          
          const eventDetails = {
            task: task,
            scheduled_at: scheduled_at,
            end_time: end_time,
            type: req.body.type || 'Collection',
            notes: notes,
            bin_id: bin_id,
            bin_label: req.body.bin_label || null
          };
          
          const emailSent = await emailService.sendScheduleNotification(
            adminData.email,
            adminData.full_name || 'Admin',
            eventDetails
          );
          
          if (emailSent) {
            console.log('[updateSchedule] ✓ Schedule update notification email sent successfully');
          } else {
            console.warn('[updateSchedule] ⚠️ Failed to send schedule update notification email (non-blocking)');
          }
        } else {
          console.warn('[updateSchedule] Admin data found but no email:', adminData);
        }
      } catch (emailError) {
        console.error('[updateSchedule] Error sending schedule notification:', emailError.message);
        console.error('[updateSchedule] Error details:', emailError);
        // Don't fail the schedule update if email fails
      }
    } else {
      console.log('[updateSchedule] No email to send - assigned_to:', assigned_to, 'data length:', data?.length);
    }
    
    res.json({
      success: true,
      message: 'Schedule updated successfully',
      schedules: data
    });
  } catch (error) {
    console.error('[updateSchedule] Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });

  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Error deleting schedule: ${error.message}`,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// COLLECTIONS TRACKING (New Schema)
// ============================================

exports.getCollections = async (req, res) => {
  try {
    console.log('\n========== GET COLLECTIONS ==========');
    
    // Fetch all collections with related data
    // Using raw SQL or joins to get admin names and waste type info
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        bin_id,
        collected_by,
        collected_at,
        waste_amount,
        waste_type,
        status,
        eco_points,
        notes,
        created_at
      `)
      .order('collected_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching collections:', error.message);
      return res.status(400).json({
        success: false,
        message: `Error fetching collections: ${error.message}`,
        error: error.message
      });
    }

    // Enrich with admin and bin information
    let enrichedData = [];
    if (data && data.length > 0) {
      // Fetch all admin accounts
      const { data: admins } = await supabase
        .from('admin_accounts')
        .select('id, full_name, email');
      
      const adminMap = {};
      if (admins) {
        admins.forEach(a => {
          adminMap[a.id] = { full_name: a.full_name, email: a.email };
        });
      }

      // Fetch all bins
      const { data: bins } = await supabase
        .from('bins')
        .select('id, code');
      
      const binMap = {};
      if (bins) {
        bins.forEach(b => {
          binMap[b.id] = b.code;
        });
      }

      // Fetch waste types for points
      const { data: wasteTypes } = await supabase
        .from('waste_types')
        .select('type, points_per_item');
      
      const wasteMap = {};
      if (wasteTypes) {
        wasteTypes.forEach(w => {
          wasteMap[w.type] = w.points_per_item;
        });
      }

      enrichedData = data.map(col => ({
        ...col,
        collected_by_name: adminMap[col.collected_by]?.full_name || 'Unknown',
        collected_by_email: adminMap[col.collected_by]?.email || 'N/A',
        bin_name: binMap[col.bin_id] || 'N/A',
        points_per_item: wasteMap[col.waste_type] || 0,
        total_points_calculated: (wasteMap[col.waste_type] || 0) * (col.waste_amount || 0)
      }));
    }

    console.log(`✓ Found ${enrichedData.length} collections`);
    console.log('========================================\n');

    res.json({
      success: true,
      collections: enrichedData
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// USER ROLE MANAGEMENT
// ============================================

/**
 * Get all users with their roles (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Error fetching users: ${error.message}`,
        error: error.message
      });
    }

    res.json({
      success: true,
      users: data || []
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update user role (admin only)
 * Body: { user_id, role }
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({
        success: false,
        message: 'user_id and role are required'
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "admin" or "user"'
      });
    }

    console.log('[updateUserRole] Updating user:', user_id, '→ role:', role);

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user_id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Error updating user role: ${error.message}`,
        error: error.message
      });
    }

    console.log('[updateUserRole] ✓ Successfully updated user role');

    res.json({
      success: true,
      message: `User role updated to "${role}"`,
      user: data[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Delete user account and related records (head only)
 * Route: DELETE /api/admin/users/:email
 */
exports.deleteUserAccount = async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();
    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();

    if (!requesterRole) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
      if (requesterEmail) {
        const { data: requesterAdmin } = await supabase
          .from('admin_accounts')
          .select('role')
          .ilike('email', requesterEmail)
          .maybeSingle();

        requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
      }
    }

    if (requesterRole !== 'head') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: head role required to delete user accounts'
      });
    }

    const { data: userAccount, error: userLookupError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id, role')
      .ilike('email', email)
      .maybeSingle();

    if (userLookupError || !userAccount) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
        error: userLookupError?.message
      });
    }

    const systemId = String(userAccount.system_id || '').trim();
    const campusId = String(userAccount.campus_id || '').trim();
    const role = String(userAccount.role || '').trim().toLowerCase();

    const safeDeleteByEq = async (tableName, conditions = []) => {
      try {
        let query = supabase.from(tableName).delete();
        conditions.forEach(({ column, value }) => {
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            query = query.eq(column, value);
          }
        });

        const { error } = await query;
        if (error) {
          // Ignore missing tables in partially migrated environments.
          if (error.code === '42P01') {
            return;
          }
          throw error;
        }
      } catch (err) {
        if (err?.code === '42P01') {
          return;
        }
        throw err;
      }
    };

    // Remove role profiles first to avoid role/profile mismatch leftovers.
    await Promise.all([
      safeDeleteByEq('student_accounts', [{ column: 'system_id', value: systemId }]),
      safeDeleteByEq('faculty_accounts', [{ column: 'system_id', value: systemId }]),
      safeDeleteByEq('other_accounts', [{ column: 'system_id', value: systemId }])
    ]);

    // Remove account-owned numeric/profile aggregates only.
    await Promise.all([
      safeDeleteByEq('account_points', [{ column: 'system_id', value: systemId }]),
      safeDeleteByEq('account_points', [{ column: 'email', value: email }]),
      safeDeleteByEq('user_waste_category_totals', [{ column: 'system_id', value: systemId }])
    ]);

    // Best-effort cleanup for legacy rows if present.
    await Promise.all([
      safeDeleteByEq('users', [{ column: 'email', value: email }]),
      safeDeleteByEq('users', [{ column: 'id', value: systemId }])
    ]);

    // Finally remove from the main auth table.
    const { error: deleteUserError } = await supabase
      .from('user_accounts')
      .delete()
      .eq('system_id', systemId);

    if (deleteUserError) {
      return res.status(400).json({
        success: false,
        message: `Failed to delete user account: ${deleteUserError.message}`,
        error: deleteUserError.message
      });
    }

    return res.json({
      success: true,
      message: 'User account and account data deleted successfully',
      deleted: {
        email,
        system_id: systemId,
        campus_id: campusId || null,
        role: role || 'unknown'
      }
    });
  } catch (error) {
    console.error('Delete user account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting user account',
      error: error.message
    });
  }
};

/**
 * Convert account type between user <-> admin (head only)
 * Route: POST /api/admin/accounts/:email/convert
 * Body: { target_type: 'admin' | 'user', demote_role?: 'student' | 'faculty' | 'staff' | 'other' }
 */
exports.convertAccountType = async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const targetType = String(req.body?.target_type || '').trim().toLowerCase();

    if (!email || !['admin', 'user'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'email and target_type (admin|user) are required'
      });
    }

    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();
    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();
    if (!requesterRole) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
      if (requesterEmail) {
        const { data: requesterAdmin } = await supabase
          .from('admin_accounts')
          .select('role')
          .ilike('email', requesterEmail)
          .maybeSingle();
        requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
      }
    }

    if (requesterRole !== 'head') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: head role required'
      });
    }

    const normalizeDemoteRole = (value) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === 'student' || normalized === 'faculty') return normalized;
      if (normalized === 'staff' || normalized === 'other') return 'staff';
      return null;
    };

    const getRoleProfileTable = (role) => {
      const normalized = String(role || '').trim().toLowerCase();
      if (normalized === 'student') return 'student_accounts';
      if (normalized === 'faculty') return 'faculty_accounts';
      return 'other_accounts';
    };

    const generateUniqueOtherId = async (excludeCampusId = null) => {
      const { data: otherRows, error: otherError } = await supabase
        .from('other_accounts')
        .select('account_id');

      if (otherError) {
        throw new Error(`Failed to read other_accounts IDs: ${otherError.message}`);
      }

      const { data: userRows, error: userError } = await supabase
        .from('user_accounts')
        .select('campus_id')
        .not('campus_id', 'is', null);

      if (userError && userError.code !== '42P01') {
        throw new Error(`Failed to read user_accounts campus IDs: ${userError.message}`);
      }

      const taken = new Set(
        (otherRows || [])
          .map((row) => String(row.account_id || '').trim().toUpperCase())
          .filter(Boolean)
      );

      (userRows || [])
        .map((row) => String(row.campus_id || '').trim().toUpperCase())
        .filter(Boolean)
        .forEach((value) => taken.add(value));

      if (excludeCampusId) {
        taken.delete(String(excludeCampusId).trim().toUpperCase());
      }

      for (let index = 1; index <= 9999; index++) {
        const candidate = `OTH${String(index).padStart(3, '0')}`;
        if (!taken.has(candidate)) {
          return candidate;
        }
      }

      const fallback = `OTH${Date.now().toString().slice(-6)}`;
      if (!taken.has(fallback)) {
        return fallback;
      }

      throw new Error('Unable to allocate a unique account ID for demoted user');
    };

    const generateRoleCampusId = async (role, existingCampusId = null) => {
      const normalizedRole = normalizeDemoteRole(role) || String(role || '').trim().toLowerCase();
      const current = String(existingCampusId || '').trim();

      if (normalizedRole === 'student') {
        if (current && !/^OTH\d+/i.test(current)) {
          return current;
        }
        return `STU-${Date.now().toString().slice(-6)}`;
      }

      if (normalizedRole === 'faculty') {
        if (current && !/^OTH\d+/i.test(current)) {
          return current;
        }
        return `FAC-${Date.now().toString().slice(-6)}`;
      }

      // staff/other
      if (current && /^OTH\d+/i.test(current)) {
        return current.toUpperCase();
      }

      return generateUniqueOtherId(current || null);
    };

    const upsertProfileCompat = async (tableName, profilePayload) => {
      const attempts = [
        { ...profilePayload },
        (() => {
          const fallback = { ...profilePayload };
          delete fallback.created_at;
          return fallback;
        })(),
        (() => {
          const fallback = { ...profilePayload };
          delete fallback.created_at;
          delete fallback.updated_at;
          return fallback;
        })()
      ];

      let lastError = null;
      for (const payload of attempts) {
        const result = await supabase
          .from(tableName)
          .upsert([payload], { onConflict: 'system_id' });

        if (!result.error) {
          return;
        }

        lastError = result.error;
        const msg = String(result.error.message || '').toLowerCase();
        if (!msg.includes('created_at') && !msg.includes('updated_at')) {
          break;
        }
      }

      throw new Error(lastError?.message || `Failed to upsert ${tableName}`);
    };

    const removeNonTargetProfiles = async (systemId, targetTable) => {
      const profileTables = ['student_accounts', 'faculty_accounts', 'other_accounts'];
      const tablesToDelete = profileTables.filter((table) => table !== targetTable);

      for (const tableName of tablesToDelete) {
        const { error } = await supabase.from(tableName).delete().eq('system_id', systemId);
        if (error && error.code !== '42P01') {
          throw new Error(`Failed cleaning ${tableName}: ${error.message}`);
        }
      }
    };

    const ensureRoleProfile = async ({ systemId, emailAddress, role, campusId, firstName, middleName, lastName }) => {
      const tableName = getRoleProfileTable(role);

      const basePayload = {
        system_id: systemId,
        email: emailAddress,
        first_name: String(firstName || '').trim() || 'User',
        middle_name: String(middleName || '').trim() || null,
        last_name: String(lastName || '').trim() || 'Account'
      };

      if (tableName === 'student_accounts') {
        basePayload.student_id = campusId;
        basePayload.created_at = new Date().toISOString();
        basePayload.updated_at = new Date().toISOString();
      } else if (tableName === 'faculty_accounts') {
        basePayload.faculty_id = campusId;
        basePayload.created_at = new Date().toISOString();
        basePayload.updated_at = new Date().toISOString();
      } else {
        basePayload.account_id = campusId;
      }

      await upsertProfileCompat(tableName, basePayload);
      await removeNonTargetProfiles(systemId, tableName);
    };

    if (targetType === 'admin') {
      const { data: sourceUser, error: userError } = await supabase
        .from('user_accounts')
        .select('system_id, email, campus_id, role, password, google_id')
        .ilike('email', email)
        .maybeSingle();

      if (userError || !sourceUser) {
        return res.status(404).json({
          success: false,
          message: 'Source user account not found',
          error: userError?.message
        });
      }

      const { data: existingAdmin } = await supabase
        .from('admin_accounts')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Account is already in admin_accounts'
        });
      }

      const profileTable = String(sourceUser.role || '').trim().toLowerCase() === 'student'
        ? 'student_accounts'
        : String(sourceUser.role || '').trim().toLowerCase() === 'faculty'
          ? 'faculty_accounts'
          : 'other_accounts';

      const { data: sourceProfile } = await supabase
        .from(profileTable)
        .select('first_name, middle_name, last_name')
        .eq('system_id', sourceUser.system_id)
        .maybeSingle();

      const firstName = String(sourceProfile?.first_name || '').trim() || String(email.split('@')[0] || 'Admin').trim();
      const middleName = String(sourceProfile?.middle_name || '').trim() || null;
      const lastName = String(sourceProfile?.last_name || '').trim() || 'User';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();

      const adminInsert = {
        email,
        role: 'admin',
        password: sourceUser.password || null,
        full_name: fullName || email,
        First_Name: firstName,
        Middle_Name: middleName,
        Last_Name: lastName,
        Google_ID: sourceUser.google_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: adminInsertError } = await supabase
        .from('admin_accounts')
        .insert([adminInsert]);

      if (adminInsertError) {
        return res.status(400).json({
          success: false,
          message: `Failed to create admin account: ${adminInsertError.message}`,
          error: adminInsertError.message
        });
      }

      return res.json({
        success: true,
        message: 'Account promoted to admin successfully',
        converted: {
          email,
          from: 'user',
          to: 'admin',
          retained_user_account: true
        }
      });
    }

    // targetType === 'user' (demote admin to user)
    const demoteRole = normalizeDemoteRole(req.body?.demote_role);
    if (!demoteRole) {
      return res.status(400).json({
        success: false,
        message: 'demote_role is required and must be student, faculty, or staff'
      });
    }

    const { data: sourceAdmin, error: adminError } = await supabase
      .from('admin_accounts')
      .select('id, email, role, password, full_name, First_Name, Middle_Name, Last_Name, Google_ID')
      .ilike('email', email)
      .maybeSingle();

    if (adminError || !sourceAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Source admin account not found',
        error: adminError?.message
      });
    }

    const sourceAdminRole = String(sourceAdmin.role || '').trim().toLowerCase();
    if (sourceAdminRole === 'head') {
      return res.status(400).json({
        success: false,
        message: 'Head accounts cannot be demoted directly'
      });
    }

    const { data: existingUser } = await supabase
      .from('user_accounts')
      .select('system_id, campus_id, role, password, google_id')
      .ilike('email', email)
      .maybeSingle();

    const now = new Date().toISOString();

    let targetUser = existingUser;
    let campusId = await generateRoleCampusId(demoteRole, existingUser?.campus_id || null);

    if (!targetUser) {
      const userInsert = {
        email,
        campus_id: campusId,
        role: demoteRole,
        password: sourceAdmin.password || null,
        google_id: sourceAdmin.Google_ID || null,
        created_at: now,
        updated_at: now
      };

      const { data: insertedUser, error: userInsertError } = await supabase
        .from('user_accounts')
        .insert([userInsert])
        .select('system_id, email, campus_id, role')
        .maybeSingle();

      if (userInsertError || !insertedUser) {
        return res.status(400).json({
          success: false,
          message: `Failed to create user account: ${userInsertError?.message || 'Insert failed'}`,
          error: userInsertError?.message
        });
      }

      targetUser = insertedUser;
    } else {
      const updatePayload = {
        role: demoteRole,
        campus_id: campusId,
        password: targetUser.password || sourceAdmin.password || null,
        google_id: targetUser.google_id || sourceAdmin.Google_ID || null,
        updated_at: now
      };

      const { error: userUpdateError } = await supabase
        .from('user_accounts')
        .update(updatePayload)
        .eq('system_id', targetUser.system_id);

      if (userUpdateError) {
        return res.status(400).json({
          success: false,
          message: `Failed to update user account: ${userUpdateError.message}`,
          error: userUpdateError.message
        });
      }
    }

    const firstName = String(sourceAdmin.First_Name || sourceAdmin.full_name?.split(' ')[0] || 'User').trim();
    const middleName = String(sourceAdmin.Middle_Name || '').trim() || null;
    const lastName = String(sourceAdmin.Last_Name || sourceAdmin.full_name?.split(' ').slice(1).join(' ') || 'Account').trim();

    await ensureRoleProfile({
      systemId: targetUser.system_id,
      emailAddress: email,
      role: demoteRole,
      campusId,
      firstName,
      middleName,
      lastName
    });

    // Optional account points row.
    await supabase
      .from('account_points')
      .upsert([
        {
          system_id: targetUser.system_id,
          email,
          campus_id: campusId,
          points: 0,
          total_points: 0,
          total_waste: 0,
          created_at: now,
          updated_at: now
        }
      ], { onConflict: 'system_id' });

    const { error: deleteAdminError } = await supabase
      .from('admin_accounts')
      .delete()
      .eq('id', sourceAdmin.id);

    if (deleteAdminError) {
      return res.status(400).json({
        success: false,
        message: `User account created, but failed to remove old admin account: ${deleteAdminError.message}`,
        error: deleteAdminError.message
      });
    }

    return res.json({
      success: true,
      message: 'Account demoted to user successfully',
      converted: {
        email,
        from: 'admin',
        to: 'user',
        role: demoteRole,
        campus_id: campusId,
        retained_user_account: Boolean(existingUser)
      }
    });
  } catch (error) {
    console.error('Convert account type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while converting account type',
      error: error.message
    });
  }
};

// ============================================
// ADMIN ACCOUNTS ARCHIVAL
// ============================================

/**
 * Archive an admin account
 * Route: POST /admin/accounts/:id/archive
 * Auth: Requires Head/Super Admin role
 * Body: { archive_reason?: string }
 */
exports.archiveAdminAccount = async (req, res) => {
  try {
    const adminId = String(req.params.id || '').trim();
    const archiveReason = String(req.body?.archive_reason || '').trim() || null;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    // Get requester info
    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();
    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();

    if (!requesterEmail) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
    }

    if (!requesterRole && requesterEmail) {
      const { data: requesterAdmin } = await supabase
        .from('admin_accounts')
        .select('role')
        .ilike('email', requesterEmail)
        .maybeSingle();
      requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
    }

    // Authorization check
    if (requesterRole !== 'head') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: head role required to archive accounts'
      });
    }

    // Get the account to archive
    const { data: accountToArchive, error: fetchError } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('id', adminId)
      .maybeSingle();

    if (fetchError || !accountToArchive) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
        error: fetchError?.message
      });
    }

    // Prevent archiving own account
    if (accountToArchive.email && requesterEmail && accountToArchive.email.toLowerCase() === requesterEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot archive your own account'
      });
    }

    // Prevent archiving head accounts
    const accountRole = String(accountToArchive.role || '').trim().toLowerCase();
    if (accountRole === 'head') {
      return res.status(400).json({
        success: false,
        message: 'Head accounts cannot be archived'
      });
    }

    // Archive the account
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('admin_accounts')
      .update({
        is_archived: true,
        archived_at: now,
        archived_by_email: requesterEmail,
        archive_reason: archiveReason,
        updated_at: now
      })
      .eq('id', adminId);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to archive account',
        error: updateError.message
      });
    }

    // The trigger function will automatically create the archive history entry
    // Fetch the created archive history entry
    const { data: archiveHistory } = await supabase
      .from('admin_accounts_archive_history')
      .select('archive_id')
      .eq('admin_id', adminId)
      .order('archived_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return res.json({
      success: true,
      message: 'Account archived successfully',
      archive_id: archiveHistory?.archive_id || null,
      archived_account: {
        id: accountToArchive.id,
        email: accountToArchive.email,
        role: accountRole,
        archived_at: now,
        archived_by: requesterEmail
      }
    });
  } catch (error) {
    console.error('Archive admin account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while archiving account',
      error: error.message
    });
  }
};

/**
 * Get archive history
 * Route: GET /admin/accounts/archive-history
 * Auth: Requires Admin role
 * Query: limit, offset, search, sort, order
 */
exports.getArchiveHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const search = String(req.query.search || '').trim().toLowerCase();
    const sort = String(req.query.sort || 'archived_at').trim();
    const order = String(req.query.order || 'desc').trim().toLowerCase();

    // Get requester role
    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();
    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();

    if (!requesterRole) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
      if (requesterEmail) {
        const { data: requesterAdmin } = await supabase
          .from('admin_accounts')
          .select('role')
          .ilike('email', requesterEmail)
          .maybeSingle();
        requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
      }
    }

    // Authorization check
    if (!['admin', 'head'].includes(requesterRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: admin role required'
      });
    }

    // Build query
    let query = supabase
      .from('admin_accounts_archive_history')
      .select('archive_id, admin_id, email, archived_at, archived_by_email, archive_reason, previous_role', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    // Apply sorting
    const validSortFields = ['archived_at', 'email', 'archived_by_email'];
    const sortField = validSortFields.includes(sort) ? sort : 'archived_at';
    const isAscending = order === 'asc';

    query = query.order(sortField, { ascending: isAscending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: archives, error: queryError, count } = await query;

    if (queryError) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching archive history',
        error: queryError.message
      });
    }

    return res.json({
      success: true,
      archives: archives || [],
      total: count || 0,
      limit,
      offset,
      hasMore: offset + limit < (count || 0)
    });
  } catch (error) {
    console.error('Get archive history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching archive history',
      error: error.message
    });
  }
};

/**
 * Get archive snapshot
 * Route: GET /admin/accounts/archive-history/:archive_id
 * Auth: Requires Admin role
 */
exports.getArchiveSnapshot = async (req, res) => {
  try {
    const archiveId = String(req.params.archive_id || '').trim();

    if (!archiveId) {
      return res.status(400).json({
        success: false,
        message: 'Archive ID is required'
      });
    }

    // Get requester role
    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();
    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();

    if (!requesterRole) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
      if (requesterEmail) {
        const { data: requesterAdmin } = await supabase
          .from('admin_accounts')
          .select('role')
          .ilike('email', requesterEmail)
          .maybeSingle();
        requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
      }
    }

    // Authorization check
    if (!['admin', 'head'].includes(requesterRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: admin role required'
      });
    }

    // Fetch archive record
    const { data: archive, error: fetchError } = await supabase
      .from('admin_accounts_archive_history')
      .select('*')
      .eq('archive_id', archiveId)
      .maybeSingle();

    if (fetchError || !archive) {
      return res.status(404).json({
        success: false,
        message: 'Archive record not found',
        error: fetchError?.message
      });
    }

    return res.json({
      success: true,
      archive: {
        archive_id: archive.archive_id,
        admin_id: archive.admin_id,
        email: archive.email,
        archived_at: archive.archived_at,
        archived_by_email: archive.archived_by_email,
        archive_reason: archive.archive_reason,
        previous_role: archive.previous_role,
        snapshot: archive.snapshot
      }
    });
  } catch (error) {
    console.error('Get archive snapshot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching snapshot',
      error: error.message
    });
  }
};

/**
 * Restore archived admin account
 * Route: POST /admin/accounts/archive-history/:archive_id/restore
 * Auth: Requires Head role
 * Body: { restore_reason?: string }
 */
exports.restoreArchivedAccount = async (req, res) => {
  try {
    const archiveId = String(req.params.archive_id || '').trim();
    const restoreReason = String(req.body?.restore_reason || '').trim() || null;

    if (!archiveId) {
      return res.status(400).json({
        success: false,
        message: 'Archive ID is required'
      });
    }

    // Get requester info
    let requesterEmail = String(req?.user?.email || '').trim().toLowerCase();
    let requesterRole = String(req?.user?.role || '').trim().toLowerCase();

    if (!requesterEmail) {
      requesterEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
    }

    if (!requesterRole && requesterEmail) {
      const { data: requesterAdmin } = await supabase
        .from('admin_accounts')
        .select('role')
        .ilike('email', requesterEmail)
        .maybeSingle();
      requesterRole = String(requesterAdmin?.role || '').trim().toLowerCase();
    }

    // Authorization check
    if (requesterRole !== 'head') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: head role required to restore accounts'
      });
    }

    // Fetch archive record
    const { data: archive, error: fetchError } = await supabase
      .from('admin_accounts_archive_history')
      .select('*')
      .eq('archive_id', archiveId)
      .maybeSingle();

    if (fetchError || !archive) {
      return res.status(404).json({
        success: false,
        message: 'Archive record not found',
        error: fetchError?.message
      });
    }

    const adminId = archive.admin_id;
    const email = archive.email;
    const snapshot = archive.snapshot || {};

    // Check if account still exists
    const { data: existingAccount } = await supabase
      .from('admin_accounts')
      .select('id, email')
      .eq('id', adminId)
      .maybeSingle();

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: 'Original admin account no longer exists'
      });
    }

    // Check for email conflicts with other active accounts
    const { data: emailConflict } = await supabase
      .from('admin_accounts')
      .select('id')
      .ilike('email', email)
      .neq('id', adminId)
      .eq('is_archived', false)
      .maybeSingle();

    if (emailConflict) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another active account'
      });
    }

    // Restore the account
    const now = new Date().toISOString();
    const restoreUpdate = {
      is_archived: false,
      archived_at: null,
      archived_by_email: null,
      archive_reason: null,
      updated_at: now
    };

    // Restore fields from snapshot if available
    if (snapshot.email) restoreUpdate.email = snapshot.email;
    if (snapshot.role) restoreUpdate.role = snapshot.role;
    if (snapshot.full_name) restoreUpdate.full_name = snapshot.full_name;
    if (snapshot.First_Name) restoreUpdate.First_Name = snapshot.First_Name;
    if (snapshot.Middle_Name) restoreUpdate.Middle_Name = snapshot.Middle_Name;
    if (snapshot.Last_Name) restoreUpdate.Last_Name = snapshot.Last_Name;
    if (snapshot.phone) restoreUpdate.phone = snapshot.phone;
    if (snapshot.Google_ID) restoreUpdate.Google_ID = snapshot.Google_ID;
    if (snapshot.Profile_Picture) restoreUpdate.Profile_Picture = snapshot.Profile_Picture;

    const { error: updateError } = await supabase
      .from('admin_accounts')
      .update(restoreUpdate)
      .eq('id', adminId);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to restore account',
        error: updateError.message
      });
    }

    // Create a new archive history entry noting the restoration
    const { error: historyError } = await supabase
      .from('admin_accounts_archive_history')
      .insert([
        {
          admin_id: adminId,
          email: email,
          archived_at: now,
          archived_by_email: requesterEmail,
          archive_reason: `RESTORED: ${restoreReason || 'Account restored'}`,
          previous_role: snapshot.role || 'admin',
          snapshot: snapshot
        }
      ]);

    if (historyError) {
      console.warn('Warning: Failed to create restoration history entry:', historyError.message);
      // Don't fail the restore if history entry fails
    }

    return res.json({
      success: true,
      message: 'Account restored successfully',
      restored_account: {
        id: adminId,
        email: email,
        role: snapshot.role || 'admin',
        restored_at: now,
        restored_by: requesterEmail
      }
    });
  } catch (error) {
    console.error('Restore archived account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while restoring account',
      error: error.message
    });
  }
};
