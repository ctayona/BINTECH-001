// Waste Sorter Controller
// Manages ESP32 hardware sessions and point transfers
// Uses: machine_sessions table for audit trail
//       account_points table for actual point storage

const supabase = require('../config/supabase');
const crypto = require('crypto');

const MATERIAL_KEYS = ['metal', 'plastic', 'paper'];
const TELEMETRY_TABLE = 'machine_sorting_telemetry';
const DEFAULT_MACHINE_ID = 'BINTECH-SORTER-001';

// ============================================
// Helper: Generate Unique Token
// ============================================
function generateSessionToken() {
  return crypto.randomBytes(16).toString('hex');
}

function normalizeMaterial(material) {
  const value = String(material || '').trim().toLowerCase();
  if (value.includes('metal')) return 'metal';
  if (value.includes('plastic')) return 'plastic';
  if (value.includes('paper')) return 'paper';
  return null;
}

function coercePercentage(value, fallback = null) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, numeric));
}

function extractCapacitySnapshot(material, payload, fallbackIsFull = false) {
  if (payload === null || payload === undefined) {
    return {
      material,
      fillPercentage: fallbackIsFull ? 100 : null,
      isFull: fallbackIsFull
    };
  }

  if (typeof payload === 'number' || typeof payload === 'string') {
    const fill = coercePercentage(payload, fallbackIsFull ? 100 : null);
    return {
      material,
      fillPercentage: fill,
      isFull: fallbackIsFull || (fill !== null && fill >= 100)
    };
  }

  if (typeof payload === 'object') {
    const fill = coercePercentage(
      payload.fillPercentage ?? payload.fill ?? payload.percentage,
      fallbackIsFull ? 100 : null
    );
    const isFull = payload.isFull === true || fallbackIsFull || (fill !== null && fill >= 100);
    return {
      material,
      fillPercentage: fill,
      isFull
    };
  }

  return {
    material,
    fillPercentage: fallbackIsFull ? 100 : null,
    isFull: fallbackIsFull
  };
}

async function updateSorterBinCapacity({ machineId, material, fillPercentage, isFull = false }) {
  const normalizedMaterial = normalizeMaterial(material);
  if (!machineId || !normalizedMaterial) {
    return { updated: false, reason: 'missing-machine-or-material' };
  }

  const safeFill = coercePercentage(fillPercentage, isFull ? 100 : null);
  if (safeFill === null) {
    return { updated: false, reason: 'missing-fill' };
  }

  const { data: bins, error: binsError } = await supabase
    .from('bins')
    .select('*')
    .limit(500);

  if (binsError) {
    return { updated: false, reason: 'bins-fetch-failed', error: binsError.message };
  }

  const targetBin = (bins || []).find((bin) => {
    const machine = String(machineId || '').trim().toLowerCase();
    const code = String(bin.code || '').toLowerCase();
    const location = String(bin.location || '').toLowerCase();
    const wasteType = String(bin.waste_type || '').toLowerCase();
    const binMachineId = String(bin.machine_id || '').toLowerCase();

    const belongsToMachine =
      code.includes(machine) ||
      location.includes(machine) ||
      binMachineId.includes(machine);

    const matchesMaterial =
      code.includes(normalizedMaterial) ||
      location.includes(normalizedMaterial) ||
      wasteType.includes(normalizedMaterial);

    return belongsToMachine && matchesMaterial;
  });

  if (!targetBin) {
    return { updated: false, reason: 'bin-not-found' };
  }

  const nowIso = new Date().toISOString();
  let updatePayload = {
    filled_percentage: safeFill,
    updated_at: nowIso,
    last_collected_at: nowIso
  };

  if (targetBin.status && String(targetBin.status).toLowerCase() !== 'maintenance') {
    updatePayload.status = isFull || safeFill >= 100 ? 'full' : 'active';
  }

  let updateResult = await supabase
    .from('bins')
    .update(updatePayload)
    .eq('id', targetBin.id)
    .select('*')
    .maybeSingle();

  if (updateResult.error && String(updateResult.error.message || '').toLowerCase().includes('filled_percentage')) {
    const fallbackPayload = {
      current_fill: safeFill,
      status: isFull || safeFill >= 100 ? 'full' : 'active',
      updated_at: nowIso
    };
    updateResult = await supabase
      .from('bins')
      .update(fallbackPayload)
      .eq('id', targetBin.id)
      .select('*')
      .maybeSingle();
  }

  if (updateResult.error) {
    return { updated: false, reason: 'bin-update-failed', error: updateResult.error.message };
  }

  return {
    updated: true,
    binId: targetBin.id,
    code: targetBin.code || null,
    material: normalizedMaterial,
    fillPercentage: safeFill
  };
}

function emptyTelemetryRow(machineId) {
  return {
    machine_id: machineId,
    metal_fill_percentage: 0,
    plastic_fill_percentage: 0,
    paper_fill_percentage: 0,
    metal_status: 'ACTIVE',
    plastic_status: 'ACTIVE',
    paper_status: 'ACTIVE',
    metal_count: 0,
    plastic_count: 0,
    paper_count: 0,
    total_waste_sorted: 0,
    total_points_generated: 0,
    last_session_id: null,
    last_user_id: null,
    updated_at: new Date().toISOString()
  };
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function displayNameFromEmail(email) {
  const safeEmail = String(email || '').trim();
  if (!safeEmail) {
    return '';
  }

  const atIndex = safeEmail.indexOf('@');
  if (atIndex > 0) {
    return safeEmail.substring(0, atIndex);
  }

  return safeEmail;
}

async function resolveSessionUserDisplayName(userId, fallbackEmail = '') {
  if (!userId) {
    return displayNameFromEmail(fallbackEmail);
  }

  const { data: userAccount, error: userError } = await supabase
    .from('user_accounts')
    .select('role, email')
    .eq('system_id', userId)
    .maybeSingle();

  if (userError) {
    console.warn('[SESSION] Failed to read user_accounts for display name:', userError.message);
    return displayNameFromEmail(fallbackEmail);
  }

  const role = String(userAccount?.role || '').trim().toLowerCase();
  const preferredEmail = String(userAccount?.email || fallbackEmail || '').trim();

  let roleTable = '';
  if (role === 'student') {
    roleTable = 'student_accounts';
  } else if (role === 'faculty') {
    roleTable = 'faculty_accounts';
  } else if (role === 'staff' || role === 'other') {
    roleTable = 'other_accounts';
  }

  if (roleTable) {
    const { data: profile, error: profileError } = await supabase
      .from(roleTable)
      .select('first_name, last_name')
      .eq('system_id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn(`[SESSION] Failed to read ${roleTable} for display name:`, profileError.message);
    } else {
      const firstName = String(profile?.first_name || '').trim();
      const lastName = String(profile?.last_name || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) {
        return fullName;
      }
    }
  }

  return displayNameFromEmail(preferredEmail);
}

async function getTelemetryRow(machineId) {
  const { data, error } = await supabase
    .from(TELEMETRY_TABLE)
    .select('*')
    .eq('machine_id', machineId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

async function saveTelemetryRow(machineId, updater) {
  const { data: existing, error: fetchError } = await getTelemetryRow(machineId);

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  const base = existing || emptyTelemetryRow(machineId);
  const next = updater({ ...base });
  next.machine_id = machineId;
  next.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TELEMETRY_TABLE)
    .upsert(next, { onConflict: 'machine_id' })
    .select('*')
    .maybeSingle();

  return { data, error };
}

async function applyLiveTelemetry(machineId, capacities = {}) {
  return saveTelemetryRow(machineId, (row) => {
    const metal = capacities.metal || {};
    const plastic = capacities.plastic || {};
    const paper = capacities.paper || {};

    if (metal.fillPercentage !== undefined && metal.fillPercentage !== null) {
      row.metal_fill_percentage = coercePercentage(metal.fillPercentage, row.metal_fill_percentage);
      row.metal_status = metal.isFull ? 'FULL' : 'ACTIVE';
    }

    if (plastic.fillPercentage !== undefined && plastic.fillPercentage !== null) {
      row.plastic_fill_percentage = coercePercentage(plastic.fillPercentage, row.plastic_fill_percentage);
      row.plastic_status = plastic.isFull ? 'FULL' : 'ACTIVE';
    }

    if (paper.fillPercentage !== undefined && paper.fillPercentage !== null) {
      row.paper_fill_percentage = coercePercentage(paper.fillPercentage, row.paper_fill_percentage);
      row.paper_status = paper.isFull ? 'FULL' : 'ACTIVE';
    }

    return row;
  });
}

async function accumulateCompletedSession(machineId, session, userId = null) {
  const sessionMetal = safeNumber(session?.metal_count);
  const sessionPlastic = safeNumber(session?.plastic_count);
  const sessionPaper = safeNumber(session?.paper_count);
  const sessionPoints = safeNumber(session?.total_points);

  return saveTelemetryRow(machineId, (row) => {
    row.metal_count = safeNumber(row.metal_count) + sessionMetal;
    row.plastic_count = safeNumber(row.plastic_count) + sessionPlastic;
    row.paper_count = safeNumber(row.paper_count) + sessionPaper;
    row.total_waste_sorted = row.metal_count + row.plastic_count + row.paper_count;
    row.total_points_generated = safeNumber(row.total_points_generated) + sessionPoints;
    row.last_session_id = session?.id || row.last_session_id || null;
    row.last_user_id = userId || session?.user_id || row.last_user_id || null;
    return row;
  });
}

function telemetryToSummary(row) {
  if (!row) {
    return null;
  }

  return {
    machineId: row.machine_id,
    metalFillPercentage: safeNumber(row.metal_fill_percentage),
    plasticFillPercentage: safeNumber(row.plastic_fill_percentage),
    paperFillPercentage: safeNumber(row.paper_fill_percentage),
    metalStatus: row.metal_status || 'ACTIVE',
    plasticStatus: row.plastic_status || 'ACTIVE',
    paperStatus: row.paper_status || 'ACTIVE',
    metalCount: safeNumber(row.metal_count),
    plasticCount: safeNumber(row.plastic_count),
    paperCount: safeNumber(row.paper_count),
    totalWasteSorted: safeNumber(row.total_waste_sorted),
    totalPointsGenerated: safeNumber(row.total_points_generated),
    lastSessionId: row.last_session_id || null,
    lastUserId: row.last_user_id || null,
    updatedAt: row.updated_at || null
  };
}

async function getSortingOverviewFromTelemetry(machineId = DEFAULT_MACHINE_ID) {
  const { data, error } = await getTelemetryRow(machineId);

  if (error || !data) {
    return { data: null, error };
  }

  return { data: telemetryToSummary(data), error: null };
}

async function getSortingOverviewFromSessions() {
  const { data: sessions, error } = await supabase
    .from('machine_sessions')
    .select('metal_count, plastic_count, paper_count, total_points, status, machine_id, started_at, ended_at');

  if (error) {
    throw error;
  }

  const totals = {
    metalCount: 0,
    plasticCount: 0,
    paperCount: 0,
    totalPointsGenerated: 0,
    sessionCount: 0
  };

  (sessions || []).forEach((session) => {
    totals.metalCount += Number(session.metal_count || 0);
    totals.plasticCount += Number(session.plastic_count || 0);
    totals.paperCount += Number(session.paper_count || 0);
    totals.totalPointsGenerated += Number(session.total_points || 0);
    totals.sessionCount += 1;
  });

  const totalWasteSorted = totals.metalCount + totals.plasticCount + totals.paperCount;

  return {
    ...totals,
    totalWasteSorted
  };
}

// ============================================
// Helper: Log Session Event
// ============================================
async function logSessionEvent(sessionId, userId, eventType, eventData = {}) {
  try {
    await supabase
      .from('hardware_session_logs')
      .insert([
        {
          session_id: sessionId,
          user_id: userId,
          event_type: eventType,
          event_data: eventData
        }
      ]);
  } catch (error) {
    console.error('Error logging session event:', error);
  }
}

// ============================================
// START SESSION
// ============================================
exports.startSession = async (req, res) => {
  try {
    const { userId, hardwareDeviceId, qrCodeData } = req.body;

    // DEBUG: Log received data
    console.log('\n========== START SESSION ==========');
    console.log('Received userId:', userId);
    console.log('Received hardwareDeviceId:', hardwareDeviceId);
    console.log('Request body:', req.body);
    console.log('===================================\n');

    // Validate input
    if (!userId || !hardwareDeviceId) {
      console.error('❌ Missing userId or hardwareDeviceId');
      return res.status(400).json({
        success: false,
        message: 'userId and hardwareDeviceId are required'
      });
    }

    // Verify user exists in user_accounts and get their details
    const { data: userAccount, error: userAccountError } = await supabase
      .from('user_accounts')
      .select('system_id, email')
      .eq('system_id', userId)
      .single();

    console.log('✓ User lookup for system_id:', userId);
    console.log('  Found:', userAccount ? 'YES' : 'NO', userAccount);
    console.log('  Error:', userAccountError?.message || 'none');

    if (userAccountError || !userAccount) {
      console.error('❌ USER NOT FOUND');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Auto-create account_points record if it doesn't exist
    const { data: userPoints, error: userPointsError } = await supabase
      .from('account_points')
      .select('system_id, email, points')
      .eq('system_id', userId)
      .maybeSingle();

    // If user doesn't have account_points record, create it
    if (!userPoints) {
      const { error: createError } = await supabase
        .from('account_points')
        .insert([
          {
            system_id: userId,
            email: userAccount.email,
            points: 0,
            total_points: 0
          }
        ]);

      if (createError) {
        console.error('Error creating account_points record:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize user account'
        });
      }
    }

    // Generate unique session ID and token
    const sessionId = generateSessionToken();
    const sessionToken = generateSessionToken();

    // Keep a single active session per machine to avoid ESP32/frontend sync conflicts.
    const { error: closeExistingError } = await supabase
      .from('machine_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('machine_id', hardwareDeviceId)
      .eq('status', 'active');

    if (closeExistingError) {
      console.error('❌ Failed to close existing active sessions:', closeExistingError);
      return res.status(500).json({
        success: false,
        message: 'Failed to prepare machine session',
        error: closeExistingError.message
      });
    }

    console.log('✓ Creating session:');
    console.log('  sessionId:', sessionId);
    console.log('  machine_id:', hardwareDeviceId);
    console.log('  user_id:', userId);

    // Create new session in machine_sessions table
    const { data: session, error: sessionError } = await supabase
      .from('machine_sessions')
      .insert([
        {
          id: sessionId,
          user_id: userId,
          user_email: userAccount.email,
          session_token: sessionToken,
          status: 'active',
          started_at: new Date().toISOString(),
          paper_count: 0,
          metal_count: 0,
          plastic_count: 0,
          total_points: 0,
          machine_id: hardwareDeviceId
        }
      ])
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create session',
        error: sessionError.message
      });
    }

    console.log('✅ Session created successfully');
    console.log('  Stored in DB with machine_id:', session.machine_id);
    console.log('  Session ID:', session.id);
    console.log('=====================================\n');

    res.json({
      success: true,
      message: 'Session started successfully',
      session: {
        id: session.id,
        sessionToken: session.session_token,
        hardwareDeviceId: hardwareDeviceId,
        userId: userId,
        userEmail: session.user_email || userAccount.email,
        is_active: session.status === 'active',
        points_earned: Number(session.total_points || 0),
        metal_count: Number(session.metal_count || 0),
        plastic_count: Number(session.plastic_count || 0),
        paper_count: Number(session.paper_count || 0),
        started_at: session.started_at
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting session',
      error: error.message
    });
  }
};

// ============================================
// GET SESSION STATUS
// ============================================
exports.getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    console.log('[GET_SESSION_STATUS] Fetching session:', sessionId);

    const { data: session, error } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[GET_SESSION_STATUS] Query error:', error.message);
    }

    if (error || !session) {
      console.warn('[GET_SESSION_STATUS] Session not found:', sessionId);
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const responseData = {
      success: true,
      session: {
        id: session.id,
        is_active: session.status === 'active',
        points_earned: Number(session.total_points || 0),
        metal_count: Number(session.metal_count || 0),
        plastic_count: Number(session.plastic_count || 0),
        paper_count: Number(session.paper_count || 0),
        user_email: session.user_email || null,
        started_at: session.started_at,
        last_updated: session.updated_at
      }
    };

    console.log('[GET_SESSION_STATUS] Returning session:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Get session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// TRANSFER POINTS
// ============================================
exports.transferPoints = async (req, res) => {
  try {
    const { userId, sessionId, pointsToTransfer, metalCount, plasticCount, paperCount } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'userId and sessionId are required'
      });
    }

    // Get session from machine_sessions
    const { data: session, error: sessionError } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify session belongs to user
    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'This session does not belong to you'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is already completed'
      });
    }

    const safeSessionPoints = Number(session.total_points || 0);
    const safeSessionMetal = Number(session.metal_count || 0);
    const safeSessionPlastic = Number(session.plastic_count || 0);
    const safeSessionPaper = Number(session.paper_count || 0);
    const safeRequestPoints = pointsToTransfer !== undefined ? Number(pointsToTransfer) : NaN;
    const normalizedPointsToTransfer = Number.isFinite(safeRequestPoints)
      ? Math.max(safeRequestPoints, safeSessionPoints)
      : safeSessionPoints;

    if (normalizedPointsToTransfer <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No points available to transfer yet'
      });
    }

    // Get current user points from account_points
    const { data: userAccount, error: userError } = await supabase
      .from('account_points')
      .select('system_id, points, total_points')
      .eq('system_id', userId)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to read user account points',
        error: userError.message
      });
    }

    let userPointsRecord = userAccount;

    if (!userPointsRecord) {
      const { data: userRow, error: userLookupError } = await supabase
        .from('user_accounts')
        .select('system_id, email')
        .eq('system_id', userId)
        .single();

      if (userLookupError || !userRow) {
        return res.status(404).json({
          success: false,
          message: 'User account not found'
        });
      }

      const { data: createdPoints, error: createPointsError } = await supabase
        .from('account_points')
        .insert([
          {
            system_id: userId,
            email: userRow.email,
            points: 0,
            total_points: 0
          }
        ])
        .select('system_id, points, total_points')
        .single();

      if (createPointsError || !createdPoints) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize user points account',
          error: createPointsError?.message
        });
      }

      userPointsRecord = createdPoints;
    }

    // Calculate new points
    const oldPoints = Number(userPointsRecord.points || 0);
    const oldTotalPoints = Number(userPointsRecord.total_points || 0);
    const newPoints = oldPoints + normalizedPointsToTransfer;
    const newTotalPoints = oldTotalPoints + normalizedPointsToTransfer;

    // Update account_points table
    const { error: updateError } = await supabase
      .from('account_points')
      .update({ 
        points: newPoints,
        total_points: newTotalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('system_id', userId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user points',
        error: updateError.message
      });
    }

    // Update machine_sessions to mark session as completed
    const { error: sessionUpdateError } = await supabase
      .from('machine_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        total_points: normalizedPointsToTransfer,
        metal_count: metalCount !== undefined ? Number(metalCount) : safeSessionMetal,
        plastic_count: plasticCount !== undefined ? Number(plasticCount) : safeSessionPlastic,
        paper_count: paperCount !== undefined ? Number(paperCount) : safeSessionPaper,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      console.error('Session update error:', sessionUpdateError);
      // Revert points update
      await supabase
        .from('account_points')
        .update({ 
          points: oldPoints,
          total_points: oldTotalPoints
        })
        .eq('system_id', userId);

      return res.status(500).json({
        success: false,
        message: 'Failed to complete session',
        error: sessionUpdateError.message
      });
    }

    const telemetryResult = await accumulateCompletedSession(session.machine_id || DEFAULT_MACHINE_ID, {
      id: session.id,
      user_id: session.user_id,
      metal_count: metalCount !== undefined ? Number(metalCount) : safeSessionMetal,
      plastic_count: plasticCount !== undefined ? Number(plasticCount) : safeSessionPlastic,
      paper_count: paperCount !== undefined ? Number(paperCount) : safeSessionPaper,
      total_points: normalizedPointsToTransfer
    }, userId);

    if (telemetryResult.error) {
      console.warn('Telemetry accumulation failed:', telemetryResult.error.message);
    }

    res.json({
      success: true,
      message: `${normalizedPointsToTransfer} points transferred successfully`,
      data: {
        sessionId: session.id,
        resetMachine: true,
        pointsTransferred: normalizedPointsToTransfer,
        oldPoints: oldPoints,
        newPoints: newPoints,
        metalCount: metalCount !== undefined ? Number(metalCount) : safeSessionMetal,
        plasticCount: plasticCount !== undefined ? Number(plasticCount) : safeSessionPlastic,
        paperCount: paperCount !== undefined ? Number(paperCount) : safeSessionPaper,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Transfer points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// END SESSION
// ============================================
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    const { data: session, error: sessionError } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.json({
        success: true,
        message: 'Session already completed',
        data: {
          sessionId: session.id,
          pointsEarned: session.total_points,
          metalCount: session.metal_count,
          plasticCount: session.plastic_count,
          paperCount: session.paper_count
        }
      });
    }

    // End the session
    const { error: endError } = await supabase
      .from('machine_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (endError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to end session',
        error: endError.message
      });
    }

    const telemetryResult = await accumulateCompletedSession(session.machine_id || DEFAULT_MACHINE_ID, session, session.user_id);

    if (telemetryResult.error) {
      console.warn('Telemetry accumulation failed:', telemetryResult.error.message);
    }

    res.json({
      success: true,
      message: 'Session ended',
      data: {
        sessionId: session.id,
        pointsEarned: session.total_points,
        metalCount: session.metal_count,
        plasticCount: session.plastic_count,
        paperCount: session.paper_count
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET USER'S SESSION HISTORY
// ============================================
exports.getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 20;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const { data: sessions, error } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching sessions',
        error: error.message
      });
    }

    res.json({
      success: true,
      sessions: sessions || []
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// UPDATE SESSION POINTS (Called by ESP32)
// ============================================
exports.updateSessionPoints = async (req, res) => {
  try {
    const { sessionId, machineId, pointsEarned, totalPoints, metalCount, plasticCount, paperCount, binCapacities } = req.body;

    console.log('\n========== ESP32 UPDATE POINTS ==========');
    console.log('Received Payload:');
    console.log('  sessionId:', sessionId);
    console.log('  machineId:', machineId);
    console.log('  pointsEarned:', pointsEarned);
    console.log('  totalPoints:', totalPoints);
    console.log('  metalCount:', metalCount);
    console.log('  plasticCount:', plasticCount);
    console.log('  paperCount:', paperCount);
    console.log('  Raw body:', req.body);

    if (!sessionId && !machineId) {
      console.error('❌ REJECT: No sessionId or machineId provided');
      return res.status(400).json({
        success: false,
        message: 'sessionId or machineId is required'
      });
    }

    const incomingTotalPoints = totalPoints ?? pointsEarned;

    // Find session by sessionId first, fallback to active session by machineId
    let session = null;
    let sessionError = null;

    if (sessionId) {
      console.log('🔍 Searching by sessionId:', sessionId);
      const byId = await supabase
        .from('machine_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      session = byId.data;
      sessionError = byId.error;
      console.log('  Result:', session ? 'FOUND' : 'NOT FOUND', sessionError?.message);
    }

    if ((!session || sessionError) && machineId) {
      console.log('🔍 Searching by machineId:', machineId);
      const byMachine = await supabase
        .from('machine_sessions')
        .select('*')
        .eq('machine_id', machineId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      session = byMachine.data;
      sessionError = byMachine.error;
      console.log('  Result:', session ? 'FOUND' : 'NOT FOUND', sessionError?.message);
      if (session) {
        console.log('  Found session:', session.id, 'for machine:', session.machine_id);
      }
    }

    if (sessionError || !session) {
      console.error('❌ REJECT: No active session found');
      console.warn('[ESP32 UPDATE] No active session found', { sessionId, machineId, sessionError: sessionError?.message });
      return res.status(404).json({
        success: false,
        message: 'Active session not found'
      });
    }

    if (session.status !== 'active') {
      console.warn('⚠️  Session status is not active:', session.status);
      return res.json({
        success: true,
        message: 'Session already completed. Reset machine counters.',
        sessionId: session.id,
        resetMachine: true,
        pointsEarned: Number(session.total_points || 0),
        metalCount: Number(session.metal_count || 0),
        plasticCount: Number(session.plastic_count || 0),
        paperCount: Number(session.paper_count || 0)
      });
    }

    console.log('✓ Matched active session:', { id: session.id, machine_id: session.machine_id, current_points: session.total_points });

    // Update session with new points/items from ESP32
    console.log('📝 Updating session with:');
    console.log('  total_points:', incomingTotalPoints);
    console.log('  metal_count:', metalCount);
    console.log('  plastic_count:', plasticCount);
    console.log('  paper_count:', paperCount);

    const { error: updateError } = await supabase
      .from('machine_sessions')
      .update({
        total_points: incomingTotalPoints ?? session.total_points,
        metal_count: metalCount !== undefined ? metalCount : session.metal_count,
        plastic_count: plasticCount !== undefined ? plasticCount : session.plastic_count,
        paper_count: paperCount !== undefined ? paperCount : session.paper_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Supabase update failed:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update session',
        error: updateError.message
      });
    }

    console.log('✅ Session updated successfully in database');

    const responsePayload = {
      success: true,
      message: 'Session updated',
      sessionId: session.id,
      pointsEarned: incomingTotalPoints ?? session.total_points,
      metalCount: metalCount !== undefined ? metalCount : session.metal_count,
      plasticCount: plasticCount !== undefined ? plasticCount : session.plastic_count,
      paperCount: paperCount !== undefined ? paperCount : session.paper_count
    };

    if (machineId && binCapacities && typeof binCapacities === 'object') {
      const capacityUpdates = [];
      for (const material of MATERIAL_KEYS) {
        const snapshot = extractCapacitySnapshot(material, binCapacities[material]);
        if (snapshot.fillPercentage === null) {
          continue;
        }

        const updateResult = await updateSorterBinCapacity({
          machineId,
          material,
          fillPercentage: snapshot.fillPercentage,
          isFull: snapshot.isFull
        });
        capacityUpdates.push(updateResult);
      }

      const telemetryResult = await applyLiveTelemetry(machineId, binCapacities);
      if (telemetryResult.error) {
        console.warn('Live telemetry update failed:', telemetryResult.error.message);
      }

      responsePayload.capacityUpdates = capacityUpdates;
    }

    console.log('✅ COMPLETE - Returning response:', responsePayload);
    console.log('=========================================\n');
    
    res.json(responsePayload);
  } catch (error) {
    console.error('Update session points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET DEVICE SESSION (Called by ESP32)
// ============================================
exports.getDeviceSession = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      });
    }

    console.log('\n========== ESP32 SYNC SESSION ==========');
    console.log('ESP32 requesting active session for deviceId:', deviceId);

    // Find active session for this device
    const { data: session, error } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('machine_id', deviceId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Query result:');
    console.log('  Found:', session ? 'YES' : 'NO');
    console.log('  Error:', error?.message || 'none');

    if (error || !session) {
      console.warn('⚠️  No active session found for device:', deviceId);
      console.log('========================================\n');
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    const userDisplayName = await resolveSessionUserDisplayName(session.user_id, session.user_email);

    const responsePayload = {
      success: true,
      session: {
        sessionId: session.id,
        userId: session.user_id,
        userEmail: session.user_email || null,
        userDisplayName: userDisplayName || null,
        isActive: session.status === 'active',
        pointsEarned: session.total_points,
        metalCount: session.metal_count,
        plasticCount: session.plastic_count,
        paperCount: session.paper_count
      }
    };

    console.log('✅ Returning session to ESP32:');
    console.log('  sessionId:', responsePayload.session.sessionId);
    console.log('  userDisplayName:', responsePayload.session.userDisplayName || 'N/A');
    console.log('  pointsEarned:', responsePayload.session.pointsEarned);
    console.log('========================================\n');

    res.json(responsePayload);
  } catch (error) {
    console.error('Get device session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// BIN FULL WARNING (Called by ESP32)
// ============================================
exports.binFullWarning = async (req, res) => {
  try {
    const { sessionId, machineId, binType, bin, material, fillPercentage, isFull } = req.body;

    const normalizedMaterial = normalizeMaterial(binType || bin || material);
    const resolvedMachineId = machineId || req.body.deviceId || req.body.machine;

    if (!resolvedMachineId || !normalizedMaterial) {
      return res.status(400).json({
        success: false,
        message: 'machineId and binType are required'
      });
    }

    const fill = coercePercentage(fillPercentage, isFull === true ? 100 : 100);
    const updateResult = await updateSorterBinCapacity({
      machineId: resolvedMachineId,
      material: normalizedMaterial,
      fillPercentage: fill,
      isFull: isFull === true || fill >= 100
    });

    const telemetryUpdate = await applyLiveTelemetry(resolvedMachineId, {
      [normalizedMaterial]: {
        fillPercentage: fill,
        isFull: isFull === true || fill >= 100
      }
    });

    res.json({
      success: true,
      message: 'Bin status updated',
      sessionId: sessionId || null,
      machineId: resolvedMachineId,
      binType: normalizedMaterial,
      fillPercentage: fill,
      updateResult,
      telemetryUpdate: telemetryUpdate.error ? { updated: false, error: telemetryUpdate.error.message } : { updated: true }
    });
  } catch (error) {
    console.error('Bin warning error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// BIN CAPACITY TELEMETRY (Called by ESP32)
// ============================================
exports.updateBinCapacityTelemetry = async (req, res) => {
  try {
    const { machineId, capacities, bins, timestamp } = req.body;

    if (!machineId) {
      return res.status(400).json({
        success: false,
        message: 'machineId is required'
      });
    }

    const payload = capacities || bins;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'capacities object is required'
      });
    }

    const updates = [];
    for (const material of MATERIAL_KEYS) {
      const snapshot = extractCapacitySnapshot(material, payload[material]);
      if (snapshot.fillPercentage === null) {
        continue;
      }

      const result = await updateSorterBinCapacity({
        machineId,
        material,
        fillPercentage: snapshot.fillPercentage,
        isFull: snapshot.isFull
      });

      updates.push(result);
    }

    const telemetryUpdate = await applyLiveTelemetry(machineId, payload);

    return res.json({
      success: true,
      machineId,
      timestamp: timestamp || new Date().toISOString(),
      updates,
      telemetryUpdate: telemetryUpdate.error ? { updated: false, error: telemetryUpdate.error.message } : { updated: true }
    });
  } catch (error) {
    console.error('Update bin capacity telemetry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// SORTING OVERVIEW METRICS
// ============================================
exports.getSortingOverview = async (req, res) => {
  try {
    const telemetry = await getSortingOverviewFromTelemetry(DEFAULT_MACHINE_ID);

    if (!telemetry.error && telemetry.data) {
      const summary = telemetry.data;
      return res.json({
        success: true,
        summary
      });
    }

    const totals = await getSortingOverviewFromSessions();

    return res.json({
      success: true,
      summary: {
        metalCount: totals.metalCount,
        plasticCount: totals.plasticCount,
        paperCount: totals.paperCount,
        totalWasteSorted: totals.totalWasteSorted,
        totalPointsGenerated: Number(totals.totalPointsGenerated.toFixed(2)),
        sessionCount: totals.sessionCount,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get sorting overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sorting overview',
      error: error.message
    });
  }
};

// ============================================
// TEST: MANUALLY ADD POINTS TO SESSION (for debugging without ESP32)
// ============================================
exports.testAddPoints = async (req, res) => {
  try {
    const { sessionId, points, metalCount, plasticCount, paperCount } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    console.log('[TEST] Manually adding points to session:', { sessionId, points, metalCount, plasticCount, paperCount });

    const { data: session, error: sessionError } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update session with test points
    const newPoints = Number(points || 0);
    const newMetal = Number(metalCount || 0);
    const newPlastic = Number(plasticCount || 0);
    const newPaper = Number(paperCount || 0);

    const { error: updateError } = await supabase
      .from('machine_sessions')
      .update({
        total_points: newPoints,
        metal_count: newMetal,
        plastic_count: newPlastic,
        paper_count: newPaper,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[TEST] Update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update session',
        error: updateError.message
      });
    }

    console.log('[TEST] Points added successfully');

    res.json({
      success: true,
      message: 'Test points added',
      session: {
        id: session.id,
        points_earned: newPoints,
        metal_count: newMetal,
        plastic_count: newPlastic,
        paper_count: newPaper
      }
    });
  } catch (error) {
    console.error('Test add points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// DEBUG: LIST ALL ACTIVE SESSIONS
// ============================================
exports.debugListActiveSessions = async (req, res) => {
  try {
    console.log('\n========== DEBUG: LISTING ACTIVE SESSIONS ==========');

    const { data: sessions, error } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list sessions',
        error: error.message
      });
    }

    console.log('Found', sessions?.length || 0, 'active sessions');
    
    const sessionList = (sessions || []).map(s => ({
      id: s.id,
      user_id: s.user_id,
      machine_id: s.machine_id,
      status: s.status,
      total_points: s.total_points,
      metal_count: s.metal_count,
      plastic_count: s.plastic_count,
      paper_count: s.paper_count,
      started_at: s.started_at,
      updated_at: s.updated_at
    }));

    sessionList.forEach((s, i) => {
      console.log(`\n${i + 1}. Session: ${s.id}`);
      console.log(`   User: ${s.user_id}`);
      console.log(`   Machine: ${s.machine_id}`);
      console.log(`   Points: ${s.total_points}`);
      console.log(`   Items: Metal=${s.metal_count}, Plastic=${s.plastic_count}, Paper=${s.paper_count}`);
      console.log(`   Created: ${s.started_at}`);
      console.log(`   Updated: ${s.updated_at}`);
    });

    console.log('\n================================================\n');

    res.json({
      success: true,
      count: sessions?.length || 0,
      sessions: sessionList
    });
  } catch (error) {
    console.error('Debug list sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
