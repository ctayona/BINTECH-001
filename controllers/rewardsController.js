// Rewards Controller
// Handles rewards management, listing, and redemption

const supabase = require('../config/supabase');
const timestampUtils = require('../lib/timestampUtils');

async function resolveAccountPointsByEmail(normalizedEmail) {
  const email = String(normalizedEmail || '').trim().toLowerCase();
  if (!email) return null;

  const { data: byEmail, error: byEmailError } = await supabase
    .from('account_points')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (byEmailError && byEmailError.code !== 'PGRST116') {
    console.warn('[rewards] account_points lookup error:', byEmailError.message);
  }

  return byEmail || null;
}

async function resolveRedemptionIdentity({ userId, normalizedEmail, accountPoints }) {
  const email = String(normalizedEmail || '').trim().toLowerCase();
  const sessionUserId = String(userId || '').trim();
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionUserId);

  let userAccount = null;
  let roleProfile = null;

  if (sessionUserId && looksLikeUuid) {
    const { data: accountBySystemId, error: accountBySystemIdError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id, role')
      .eq('system_id', sessionUserId)
      .maybeSingle();

    if (accountBySystemIdError && accountBySystemIdError.code !== 'PGRST116') {
      console.warn('[rewards] user_accounts lookup by system_id error:', accountBySystemIdError.message);
    }

    userAccount = accountBySystemId || null;
  }

  if (!userAccount && email) {
    const { data: accountByEmail, error: accountByEmailError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id, role')
      .ilike('email', email)
      .maybeSingle();

    if (accountByEmailError && accountByEmailError.code !== 'PGRST116') {
      console.warn('[rewards] user_accounts lookup by email error:', accountByEmailError.message);
    }

    userAccount = accountByEmail || null;
  }

  if (!userAccount && sessionUserId) {
    const { data: accountByCampusId, error: accountByCampusIdError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id, role')
      .eq('campus_id', sessionUserId)
      .maybeSingle();

    if (accountByCampusIdError && accountByCampusIdError.code !== 'PGRST116') {
      console.warn('[rewards] user_accounts lookup by campus_id error:', accountByCampusIdError.message);
    }

    userAccount = accountByCampusId || null;
  }

  const accountEmail = String(userAccount?.email || accountPoints?.email || email || '').trim().toLowerCase();
  const role = String(userAccount?.role || '').trim().toLowerCase();

  if (role === 'student') {
    const { data: studentProfile } = await supabase
      .from('student_accounts')
      .select('*')
      .or(sessionUserId ? `system_id.eq.${sessionUserId}${accountEmail ? `,email.ilike.${accountEmail}` : ''}` : `email.ilike.${accountEmail}`)
      .maybeSingle();
    roleProfile = studentProfile || null;
  } else if (role === 'faculty') {
    const { data: facultyProfile } = await supabase
      .from('faculty_accounts')
      .select('*')
      .or(sessionUserId ? `system_id.eq.${sessionUserId}${accountEmail ? `,email.ilike.${accountEmail}` : ''}` : `email.ilike.${accountEmail}`)
      .maybeSingle();
    roleProfile = facultyProfile || null;
  } else if (role === 'staff') {
    const { data: staffProfile } = await supabase
      .from('other_accounts')
      .select('*')
      .or(sessionUserId ? `system_id.eq.${sessionUserId}${accountEmail ? `,email.ilike.${accountEmail}` : ''}` : `email.ilike.${accountEmail}`)
      .maybeSingle();
    roleProfile = staffProfile || null;
  }

  const redemptionUserId = String(
    roleProfile?.campus_id
    || roleProfile?.account_id
    || roleProfile?.student_id
    || roleProfile?.faculty_id
    || userAccount?.campus_id
    || accountPoints?.campus_id
    || userAccount?.system_id
    || accountPoints?.system_id
    || sessionUserId
    || ''
  ).trim() || null;

  return {
    redemptionUserId,
    gmail: accountEmail || null,
    userAccount,
    roleProfile
  };
}

// ============================================
// Get All Available Rewards (View Page)
// ============================================
exports.getAllRewards = async (req, res) => {
  try {
    // Render the rewards page view
    res.render('public/rewards', {
      title: 'Available Rewards',
      description: 'Redeem your EcoPoints for amazing rewards'
    });
  } catch (error) {
    console.error('Error rendering rewards page:', error);
    res.status(500).render('error', { 
      message: 'Error loading rewards page',
      error: error 
    });
  }
};

// ============================================
// Get All Available Rewards (API Endpoint)
// ============================================
exports.getRewardsAPI = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('points_cost', { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching rewards'
      });
    }

    // ============================================
    // FILTER OUT INACTIVE REWARDS (ADDITIONAL SAFETY)
    // ============================================
    // Double-check that all returned rewards are active
    const activeRewards = (data || []).filter(reward => reward.active === true);
    
    console.log(`✅ Loaded ${activeRewards.length} active rewards for user display`);

    res.json({
      success: true,
      rewards: activeRewards
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get Rewards by Category
// ============================================
exports.getRewardsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching rewards'
      });
    }

    res.json({
      success: true,
      category: category,
      rewards: data || []
    });
  } catch (error) {
    console.error('Get rewards by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get Reward Details
// ============================================
exports.getRewardDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found or is inactive'
      });
    }

    res.json({
      success: true,
      reward: data
    });
  } catch (error) {
    console.error('Get reward details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Redeem Reward
// ============================================
exports.redeemReward = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.query.userId;
    const email = String(req.body.email || req.query.email || '').trim().toLowerCase();
    const quantity = Math.max(1, parseInt(req.body.quantity || req.query.quantity || '1', 10) || 1);
    const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(userId || '').trim());

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();

    if (rewardError || !reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // ============================================
    // CHECK IF REWARD IS ACTIVE
    // ============================================
    if (!reward.active) {
      return res.status(400).json({
        success: false,
        message: 'This reward is no longer available'
      });
    }

    if (reward.inventory < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough reward inventory available'
      });
    }

    const accountPoints = email
      ? await resolveAccountPointsByEmail(email)
      : null;

    if (!accountPoints && !userId) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    const { data: userAccount, error: userAccountError } = userId && looksLikeUuid
      ? await supabase
        .from('account_points')
        .select('*')
        .eq('system_id', userId)
        .maybeSingle()
      : { data: accountPoints, error: null };

    const { data: userAccountByCampusId } = !userAccount && userId
      ? await supabase
        .from('account_points')
        .select('*')
        .eq('campus_id', userId)
        .maybeSingle()
      : { data: null };

    if (userAccountError && userAccountError.code !== 'PGRST116') {
      console.warn('[rewards] account_points lookup by system_id error:', userAccountError.message);
    }

    const account = userAccount || userAccountByCampusId || accountPoints;
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    const pointsRequired = Number(reward.points_cost || 0) * quantity;
    const currentPoints = Number(account.points || 0);

    // Check if user has enough points
    if (currentPoints < pointsRequired) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You have ${currentPoints} points but need ${pointsRequired} points.`,
        availablePoints: currentPoints,
        requiredPoints: pointsRequired
      });
    }

    const redemptionIdentity = await resolveRedemptionIdentity({
      userId,
      normalizedEmail: account.email || email,
      accountPoints: account
    });

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert([
        {
          user_id: redemptionIdentity.redemptionUserId,
          gmail: redemptionIdentity.gmail || account.email || email,
          reward_id: id,
          points_spent: pointsRequired,
          status: 'completed',
          created_at: new Date()
        }
      ])
      .select();

    if (redemptionError) {
      return res.status(400).json({
        success: false,
        message: 'Error redeeming reward'
      });
    }

    // Deduct points from account_points, but keep lifetime total_points unchanged
    const newPoints = currentPoints - pointsRequired;
    const updateQuery = accountSystemId
      ? supabase.from('account_points').update({ points: newPoints, updated_at: new Date().toISOString() }).eq('system_id', accountSystemId)
      : supabase.from('account_points').update({ points: newPoints, updated_at: new Date().toISOString() }).ilike('email', email);

    await updateQuery;

    // Keep the legacy users table aligned when available
    if (userId) {
      await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', userId);
    }

    await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    res.json({
      success: true,
      message: 'Reward redeemed successfully!',
      reward: reward.name,
      pointsSpent: pointsRequired,
      remainingPoints: newPoints
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Get Redemption History
// ============================================
exports.getRedemptionHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const email = String(req.query.email || req.body.email || '').trim().toLowerCase();

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    let account = null;
    if (userId) {
      const { data } = await supabase
        .from('account_points')
        .select('system_id, email, campus_id')
        .eq('system_id', userId)
        .maybeSingle();
      account = data || null;

      if (!account) {
        const { data: campusAccount } = await supabase
          .from('account_points')
          .select('system_id, email, campus_id')
          .eq('campus_id', userId)
          .maybeSingle();
        account = campusAccount || null;
      }
    }

    if (!account && email) {
      account = await resolveAccountPointsByEmail(email);
    }

    const accountIds = Array.from(new Set([
      String(account?.system_id || userId || '').trim(),
      String(account?.campus_id || '').trim()
    ].filter(Boolean)));
    const accountEmail = String(account?.email || email || '').trim().toLowerCase();

    const { data, error } = await supabase
      .from('redemptions')
      .select('*, rewards(name, description, points_cost)')
      .in('user_id', accountIds)
      .order('created_at', { ascending: false });

    const filtered = accountEmail
      ? (data || []).filter((item) => String(item.user_email || '').toLowerCase() === accountEmail || String(item.email || '').toLowerCase() === accountEmail || accountIds.includes(String(item.user_id || '').trim()))
      : (data || []);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching redemption history'
      });
    }

    res.json({
      success: true,
      history: filtered
    });
  } catch (error) {
    console.error('Get redemption history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// ADMIN: Get All Rewards (Admin API)
// ============================================
exports.adminGetAllRewards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error fetching rewards',
        error: error.message
      });
    }

    res.json({
      success: true,
      rewards: data || []
    });
  } catch (error) {
    console.error('Admin get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// ADMIN: Create Reward
// ============================================
exports.adminCreateReward = async (req, res) => {
  try {
    const { name, description, points_cost, inventory, image_url, active } = req.body;

    // Validation
    if (!name || !description || points_cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, points_cost'
      });
    }

    if (isNaN(points_cost) || points_cost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Points cost must be a positive number'
      });
    }

    if (inventory !== undefined && (isNaN(inventory) || inventory < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Inventory must be a non-negative number'
      });
    }

    const { data, error } = await supabase
      .from('rewards')
      .insert([
        {
          name: name.trim(),
          description: description.trim(),
          points_cost: parseInt(points_cost),
          inventory: inventory !== undefined ? parseInt(inventory) : 0,
          active: active !== undefined ? active : true,
          image_url: image_url || null
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error adding reward: ' + error.message,
        error: error.message
      });
    }

    // If creation successful, update with image_url if provided
    if (data && data[0]) {
      if (image_url) {
        const { data: updatedData, error: updateError } = await supabase
          .from('rewards')
          .update({ image_url })
          .eq('id', data[0].id)
          .select();
        
        if (!updateError && updatedData && updatedData.length > 0) {
          data[0] = updatedData[0];
        } else if (updateError) {
          console.error('Error updating image_url:', updateError);
          data[0].image_url = image_url;
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Reward created successfully',
      reward: data[0]
    });
  } catch (error) {
    console.error('Admin create reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// ADMIN: Update Reward
// ============================================
exports.adminUpdateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, points_cost, inventory, active, image_url } = req.body;

    console.log('Update reward request:', { id, name, description, points_cost, inventory, active, image_url });

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Reward ID is required'
      });
    }

    // Build update object - only include fields that are provided
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (points_cost !== undefined) {
      if (isNaN(points_cost) || points_cost < 0) {
        return res.status(400).json({
          success: false,
          message: 'Points cost must be a positive number'
        });
      }
      updateData.points_cost = parseInt(points_cost);
    }
    if (inventory !== undefined) {
      if (isNaN(inventory) || inventory < 0) {
        return res.status(400).json({
          success: false,
          message: 'Inventory must be a non-negative number'
        });
      }
      updateData.inventory = parseInt(inventory);
    }
    
    // If explicitly setting active status
    if (active !== undefined) updateData.active = active;

    // ============================================
    // AUTO-DEACTIVATE WHEN INVENTORY REACHES 0
    // ============================================
    // CRITICAL: When inventory is 0, ALWAYS set active to false
    // This ensures out-of-stock rewards are never shown to users
    if (inventory !== undefined && parseInt(inventory) === 0) {
      console.log('✅ OUT OF STOCK: Inventory = 0, forcing reward to INACTIVE status');
      updateData.active = false;
    }

    console.log('Update data (with auto-deactivation applied):', updateData);

    const { data, error } = await supabase
      .from('rewards')
      .update(updateData)
      .eq('id', id)
      .select();

    console.log('Update response:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error updating reward: ' + error.message,
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // If update successful and image_url provided, try to update it
    if (image_url) {
      console.log('Updating image_url:', image_url);
      const { data: updatedData, error: updateError } = await supabase
        .from('rewards')
        .update({ image_url })
        .eq('id', id)
        .select();
      
      console.log('Image update response:', { updatedData, updateError });

      if (!updateError && updatedData && updatedData.length > 0) {
        data[0] = updatedData[0];
      } else if (updateError) {
        console.error('Error updating image_url:', updateError);
        data[0].image_url = image_url;
      }
    }

    // Log if reward was auto-deactivated
    if (updateData.active === false && inventory !== undefined && parseInt(inventory) === 0) {
      console.log(`✅ Reward "${data[0].name}" automatically marked as inactive due to zero inventory`);
    }

    res.json({
      success: true,
      message: 'Reward updated successfully',
      reward: data[0]
    });
  } catch (error) {
    console.error('Admin update reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// ADMIN: Delete Reward
// ============================================
exports.adminDeleteReward = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Reward ID is required'
      });
    }

    const { data, error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: 'Error deleting reward',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    res.json({
      success: true,
      message: 'Reward deleted successfully',
      reward: data[0]
    });
  } catch (error) {
    console.error('Admin delete reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// Peer Transfer - Share EcoPoints
// ============================================
exports.transferEcoPoints = async (req, res) => {
  try {
    const { senderEmail, receiverEmail, pointsAmount, senderSystemId } = req.body;

    // ============================================
    // 1. VALIDATE INPUT
    // ============================================
    if (!senderEmail || !receiverEmail || !pointsAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: senderEmail, receiverEmail, pointsAmount'
      });
    }

    // Validate transfer amount (10-100)
    const amount = parseInt(pointsAmount);
    if (isNaN(amount) || amount < 10 || amount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Transfer amount must be between 10 and 100 points'
      });
    }

    // Prevent self-transfer
    if (senderEmail.toLowerCase() === receiverEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot transfer points to yourself'
      });
    }

    // ============================================
    // 2. VALIDATE SENDER IN user_accounts
    // ============================================
    const { data: senderAccount, error: senderAccountError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id')
      .eq('email', senderEmail.toLowerCase())
      .single();

    if (senderAccountError || !senderAccount) {
      return res.status(404).json({
        success: false,
        message: 'Sender account not found'
      });
    }

    const senderSystemIdDb = senderAccount.system_id;
    const senderCampusId = senderAccount.campus_id;

    // ============================================
    // 3. VALIDATE RECEIVER IN user_accounts
    // ============================================
    const { data: receiverAccount, error: receiverAccountError } = await supabase
      .from('user_accounts')
      .select('system_id, email, campus_id')
      .eq('email', receiverEmail.toLowerCase())
      .single();

    if (receiverAccountError || !receiverAccount) {
      return res.status(404).json({
        success: false,
        message: 'Receiver account not found'
      });
    }

    const receiverSystemId = receiverAccount.system_id;

    // ============================================
    // 4. CHECK SENDER'S BALANCE IN account_points
    // ============================================
    const { data: senderPoints, error: senderPointsError } = await supabase
      .from('account_points')
      .select('points, total_points')
      .eq('system_id', senderSystemIdDb)
      .single();

    if (senderPointsError || !senderPoints) {
      return res.status(404).json({
        success: false,
        message: 'Sender points account not found'
      });
    }

    // Validate sufficient balance
    if (senderPoints.points < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You have ${senderPoints.points} points but trying to transfer ${amount} points.`,
        availablePoints: senderPoints.points,
        requestedAmount: amount
      });
    }

    // ============================================
    // 5. GET RECEIVER'S CURRENT POINTS
    // ============================================
    let receiverPoints = null;
    
    // Try to get existing receiver points
    const { data: existingReceiverPoints, error: receiverPointsError } = await supabase
      .from('account_points')
      .select('points, total_points')
      .eq('system_id', receiverSystemId)
      .single();

    if (receiverPointsError) {
      // Receiver doesn't have a points account yet, create one
      console.log('Creating new points account for receiver...');
      const { data: newReceiverPoints, error: createError } = await supabase
        .from('account_points')
        .insert([
          {
            system_id: receiverSystemId,
            email: receiverEmail.toLowerCase(),
            campus_id: receiverAccount.campus_id,
            points: 0,
            total_points: 0,
            total_waste: 0,
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (createError) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create points account for receiver: ' + createError.message
        });
      }

      receiverPoints = {
        points: 0,
        total_points: 0
      };
    } else {
      receiverPoints = existingReceiverPoints;
    }

    // ============================================
    // 6. EXECUTE TRANSACTION
    // ============================================
    try {
      // DEDUCT FROM SENDER
      const newSenderPoints = senderPoints.points - amount;
      const { error: deductError } = await supabase
        .from('account_points')
        .update({
          points: newSenderPoints,
          updated_at: new Date().toISOString()
        })
        .eq('system_id', senderSystemIdDb);

      if (deductError) {
        throw new Error(`Failed to deduct points from sender: ${deductError.message}`);
      }

      // ADD TO RECEIVER
      const newReceiverPoints = receiverPoints.points + amount;
      const newReceiverTotalPoints = receiverPoints.total_points + amount;
      const { error: addError } = await supabase
        .from('account_points')
        .update({
          points: newReceiverPoints,
          total_points: newReceiverTotalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('system_id', receiverSystemId);

      if (addError) {
        throw new Error(`Failed to add points to receiver: ${addError.message}`);
      }

      // LOG TRANSACTION IN peer_transfer_logs
      const { data: logData, error: logError } = await supabase
        .from('peer_transfer_logs')
        .insert([
          {
            system_id: senderSystemIdDb,
            campus_id: senderCampusId,
            from_email: senderEmail.toLowerCase(),
            from_name: senderAccount.email,
            to_email: receiverEmail.toLowerCase(),
            to_name: receiverAccount.email,
            points_transferred: amount,
            log_date: new Date().toISOString().split('T')[0],
            log_time: new Date().toTimeString().split(' ')[0]
          }
        ])
        .select();

      if (logError) {
        throw new Error(`Failed to log transfer: ${logError.message}`);
      }

      // ============================================
      // SUCCESS RESPONSE
      // ============================================
      res.json({
        success: true,
        message: `Successfully transferred ${amount} points to ${receiverEmail}`,
        transfer: {
          senderEmail: senderEmail,
          receiverEmail: receiverEmail,
          pointsTransferred: amount,
          senderNewBalance: newSenderPoints,
          receiverNewBalance: newReceiverPoints,
          timestamp: new Date().toISOString()
        }
      });

    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      return res.status(400).json({
        success: false,
        message: 'Transaction failed: ' + transactionError.message
      });
    }

  } catch (error) {
    console.error('Transfer EcoPoints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// COMPREHENSIVE REWARD REDEMPTION
// Handles: Points deduction, Inventory management,
// Transaction recording, Email confirmation
// ============================================
exports.processRedemption = async (req, res) => {
  try {
    console.log('\n========== REDEMPTION REQUEST START ==========');
    console.log('[REDEMPTION] Full request body:', JSON.stringify(req.body, null, 2));
    
    const { rewardId, email, userId, couponCode, couponCodes, rewardName, pointsSpent, quantity } = req.body;

    console.log('[REDEMPTION] Extracted fields:', {
      rewardId: rewardId || 'MISSING',
      email: email || 'MISSING',
      userId: userId || 'MISSING',
      couponCode: couponCode || 'MISSING',
      couponCodes: couponCodes || 'MISSING',
      rewardName: rewardName || 'MISSING',
      pointsSpent: pointsSpent !== undefined ? pointsSpent : 'MISSING',
      quantity: quantity || 'MISSING'
    });

    // ============================================
    // 1. VALIDATE INPUT - SIMPLE AND CLEAR
    // ============================================
    
    // Support both single couponCode and multiple couponCodes
    const coupons = couponCodes && Array.isArray(couponCodes) ? couponCodes : (couponCode ? [couponCode] : []);
    
    console.log('[REDEMPTION] Coupons array length:', coupons.length);
    console.log('[REDEMPTION] Coupons:', coupons);

    // Build list of missing fields
    const missingFields = [];
    
    if (!rewardId || rewardId === '') {
      missingFields.push('rewardId (empty or missing)');
    }
    if (!email || email === '') {
      missingFields.push('email (empty or missing)');
    }
    if (!Array.isArray(couponCodes) || couponCodes.length === 0) {
      if (!couponCode || couponCode === '') {
        missingFields.push('couponCodes or couponCode (empty or missing)');
      }
    }
    if (!rewardName || rewardName === '') {
      missingFields.push('rewardName (empty or missing)');
    }
    if (pointsSpent === undefined || pointsSpent === null || pointsSpent === '') {
      missingFields.push('pointsSpent (empty or missing)');
    }
    
    console.log('[REDEMPTION] Validation result - Missing fields:', missingFields);

    if (missingFields.length > 0) {
      console.error('[REDEMPTION] ❌ VALIDATION FAILED');
      console.error('[REDEMPTION] Missing fields:', missingFields);
      console.error('[REDEMPTION] Full request body:', req.body);
      
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields,
        receivedFields: Object.keys(req.body),
        receivedValues: {
          rewardId: rewardId || 'undefined',
          email: email || 'undefined',
          userId: userId || 'undefined',
          couponCode: couponCode || 'undefined',
          couponCodesArray: Array.isArray(couponCodes) ? `Array(${couponCodes.length})` : typeof couponCodes,
          rewardName: rewardName || 'undefined',
          pointsSpent: pointsSpent !== undefined ? pointsSpent : 'undefined',
          quantity: quantity || 'undefined'
        }
      });
    }

    console.log('[REDEMPTION] ✅ VALIDATION PASSED');
    console.log('[REDEMPTION] Proceeding with redemption...');

    const normalizedEmail = email.toLowerCase().trim();
    const requestedQuantity = Math.max(1, parseInt(quantity || '1', 10) || 1);

    // ============================================
    // 2. FETCH REWARD - Validate active + inventory
    // ============================================
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (rewardError || !reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Validate reward is active
    if (!reward.active) {
      return res.status(400).json({
        success: false,
        message: 'This reward is no longer available'
      });
    }

    // Validate inventory
    if (reward.inventory <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This reward is out of stock'
      });
    }

    if (reward.inventory < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough reward inventory available',
        availableInventory: reward.inventory
      });
    }

    const pointsAmount = Number(reward.points_cost || 0) * requestedQuantity;
    console.log(`[REDEMPTION] Starting process for ${normalizedEmail}, Reward: ${rewardName}, Points: ${pointsAmount}`);

    // ============================================
    // 3. FETCH USER ACCOUNT POINTS
    // ============================================
    const { data: accountPointsData, error: accountPointsError } = await supabase
      .from('account_points')
      .select('*')
      .ilike('email', normalizedEmail)
      .single();

    if (accountPointsError || !accountPointsData) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Validate sufficient points
    if (accountPointsData.points < pointsAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You have ${accountPointsData.points} points but need ${pointsAmount} points`,
        availablePoints: accountPointsData.points,
        requiredPoints: pointsAmount
      });
    }

    // ============================================
    // 4. FETCH USER ID FOR REDEMPTION RECORD
    // ============================================
    const { data: userAccounts, error: userAccountsError } = await supabase
      .from('user_accounts')
      .select('system_id, campus_id, role, email')
      .eq('email', normalizedEmail)
      .single();

    if (userAccountsError || !userAccounts) {
      console.warn('[REDEMPTION] User not in user_accounts, using email as reference');
    }

    const redemptionIdentity = await resolveRedemptionIdentity({
      userId,
      normalizedEmail,
      accountPoints: accountPointsData
    });

    // ============================================
    // 5. TRANSACTION PROCESSING
    // All-or-nothing: Points, Inventory, Records
    // ============================================
    try {
      // 5a. Deduct points from account_points
      const newPoints = accountPointsData.points - pointsAmount;

      const { error: pointsError } = await supabase
        .from('account_points')
        .update({
          points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('system_id', accountPointsData.system_id)
        .eq('email', normalizedEmail);

      if (pointsError) {
        throw new Error(`Failed to deduct points: ${pointsError.message}`);
      }

      console.log(`✅ [REDEMPTION] Points deducted: ${pointsAmount}. Balance: ${newPoints}`);

      // 5b. Decrement inventory and auto-deactivate if 0
      const newInventory = reward.inventory - requestedQuantity;
      const updateRewardData = { inventory: newInventory };

      // Auto-deactivate if inventory reaches 0
      if (newInventory === 0) {
        updateRewardData.active = false;
        console.log(`⚠️ [REDEMPTION] Inventory depleted, marking reward as inactive`);
      }

      const { error: inventoryError } = await supabase
        .from('rewards')
        .update(updateRewardData)
        .eq('id', rewardId);

      if (inventoryError) {
        throw new Error(`Failed to update inventory: ${inventoryError.message}`);
      }

      console.log(`✅ [REDEMPTION] Inventory updated: ${newInventory}`);

      // 5c. Create redemption record
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('redemptions')
        .insert([
          {
            user_id: redemptionIdentity.redemptionUserId,
            gmail: redemptionIdentity.gmail || normalizedEmail,
            reward_id: rewardId,
            points_spent: pointsAmount,
            status: 'completed',
            requested_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (redemptionError) {
        throw new Error(`Failed to create redemption record: ${redemptionError.message}`);
      }

      console.log(`✅ [REDEMPTION] Redemption record created`);

      // 5d. Log transaction in peer_transfer_logs
      const fallbackTimestamp = timestampUtils.getCurrentTimestamp();
      const { data: logData, error: logError } = await supabase
        .from('peer_transfer_logs')
        .insert([
          {
            system_id: accountPointsData.system_id,
            campus_id: accountPointsData.campus_id || null,
            from_email: normalizedEmail,
            from_name: normalizedEmail,
            to_email: 'rewards-system',
            to_name: 'Rewards System',
            points_transferred: pointsAmount,
            log_date: fallbackTimestamp.date,
            log_time: fallbackTimestamp.time
          }
        ])
        .select();

      if (logError) {
        console.error('⚠️ Failed to log transaction:', logError);
      } else {
        console.log(`✅ [REDEMPTION] Transaction logged`);

        // 5e. Add transfer details for transaction history
        if (logData && logData.length > 0) {
          const peertransfer_id = logData[0].peertransfer_id;

          const { error: detailError } = await supabase
            .from('peer_transfer_details')
            .insert([
              {
                peertransfer_id,
                transaction_type: 'redemption',
                description: `Redeemed reward: ${rewardName}`,
                subdescription: `Coupon codes: ${coupons.join(', ')}`,
                quantity: `${pointsAmount} points`,
                reason: 'Reward redemption',
                status: 'Completed'
              }
            ]);

          if (!detailError) {
            console.log(`✅ [REDEMPTION] Transfer detail recorded`);
          }
        }
      }

      // ============================================
      // 6. SEND CONFIRMATION EMAIL
      // ============================================
      try {
        sendRedemptionConfirmationEmail(normalizedEmail, rewardName, pointsAmount, coupons, newPoints);
      } catch (emailError) {
        console.error('⚠️ Email sending error (non-critical):', emailError);
        // Don't fail the transaction if email fails
      }

      // ============================================
      // 7. SUCCESS RESPONSE
      // ============================================
      res.json({
        success: true,
        message: 'Reward redeemed successfully!',
        redemption: {
          rewardName: rewardName,
          couponCodes: coupons,
          pointsSpent: pointsAmount,
          remainingPoints: newPoints,
          rewardInventory: newInventory,
          quantity: requestedQuantity,
          timestamp: new Date().toISOString()
        }
      });

    } catch (transactionError) {
      console.error('❌ [REDEMPTION] Transaction error:', transactionError);
      return res.status(400).json({
        success: false,
        message: 'Redemption failed: ' + transactionError.message
      });
    }

  } catch (error) {
    console.error('❌ [REDEMPTION] Process error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// ============================================
// SEND REDEMPTION CONFIRMATION EMAIL
// ============================================
function sendRedemptionConfirmationEmail(email, rewardName, pointsSpent, couponCodes, remainingPoints) {
  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });

    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Handle both single coupon and multiple coupons
    const couponsArray = Array.isArray(couponCodes) ? couponCodes : [couponCodes];
    const couponDisplay = couponsArray.length === 1 
      ? `<p style="color: #5DAE60; font-size: 28px; margin: 0 0 20px 0; font-family: monospace; font-weight: bold;">${couponsArray[0]}</p>`
      : `<div style="margin: 0 0 20px 0;">${couponsArray.map((code, idx) => 
          `<p style="color: #5DAE60; font-size: 18px; margin: 8px 0; font-family: monospace; font-weight: bold;">Coupon ${idx + 1}: ${code}</p>`
        ).join('')}</div>`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0F3B2E; font-family: 'Playfair Display', serif; margin-bottom: 20px;">🎉 Reward Redeemed Successfully!</h1>
          
          <p style="color: #0F3B2E; font-size: 16px; margin-bottom: 20px;">Dear User,</p>
          <p style="color: #0F3B2E; font-size: 16px; margin-bottom: 20px;">Your reward redemption has been processed successfully. Here are your details:</p>
          
          <div style="background-color: #E8ECEB; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #0F3B2E; margin: 0 0 10px 0; font-weight: bold;">Reward:</p>
            <p style="color: #0F3B2E; font-size: 24px; margin: 0 0 20px 0; font-weight: bold;">${rewardName}</p>
            
            <p style="color: #0F3B2E; margin: 0 0 5px 0; font-weight: bold;">Coupon Code${couponsArray.length > 1 ? 's' : ''}:</p>
            ${couponDisplay}
            
            <p style="color: #0F3B2E; margin: 0 0 5px 0; font-weight: bold;">Points Spent:</p>
            <p style="color: #0F3B2E; font-size: 18px; margin: 0 0 20px 0;">${pointsSpent} EcoPoints</p>
            
            <p style="color: #0F3B2E; margin: 0 0 5px 0; font-weight: bold;">Remaining Points:</p>
            <p style="color: #0F3B2E; font-size: 18px; margin: 0;">${remainingPoints} EcoPoints</p>
          </div>
          
          <div style="background-color: #f0f8f0; border-left: 4px solid #5DAE60; padding: 15px; margin-bottom: 20px;">
            <p style="color: #0F3B2E; margin: 0; font-weight: bold;">✓ Coupon${couponsArray.length > 1 ? 's' : ''} Valid Until: ${expiryDate.toDateString()}</p>
          </div>
          
          <p style="color: #0F3B2E; font-size: 14px; margin-bottom: 30px;">Please keep ${couponsArray.length > 1 ? 'these coupon codes' : 'this coupon code'} safe. You can use ${couponsArray.length > 1 ? 'them' : 'it'} at our partner locations or present ${couponsArray.length > 1 ? 'them' : 'it'} when claiming your reward.</p>
          
          <p style="color: #0F3B2E; font-size: 14px; margin-bottom: 30px;">Thank you for using BinTECH! Keep contributing to a greener planet.</p>
          
          <p style="color: #0F3B2E; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
            Transaction Date: ${now.toLocaleString()}<br>
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@bintech.com',
      to: email,
      subject: `BinTECH Reward Redeemed: ${couponsArray.length > 1 ? `${couponsArray.length} Coupons` : couponsArray[0]}`,
      html: htmlContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email send error:', error);
      } else {
        console.log(`✅ Confirmation email sent to ${email}`);
      }
    });

  } catch (error) {
    console.error('❌ Error setting up email:', error);
  }
}
