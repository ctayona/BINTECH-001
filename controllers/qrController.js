// QR Code Controller
// Handles QR code scanning and point crediting for waste disposal

const supabase = require('../config/supabase');
const timestampUtils = require('../lib/timestampUtils');

// ============================================
// Process QR Code Scan
// ============================================
exports.processQRScan = async (req, res) => {
  try {
    const { userId, qrCode, wasteType, quantity, binId } = req.body;

    // Validate input
    if (!userId || !qrCode) {
      return res.status(400).json({
        success: false,
        message: 'User ID and QR code are required'
      });
    }

    // TODO: Verify QR code validity with your QR code database
    // For now, we'll generate points based on waste type

    const pointsEarned = calculatePoints(wasteType, quantity);

    // Get current user points
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user points
    const newPoints = (user.points || 0) + pointsEarned;
    await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    // Record disposal in history
    const { data: history, error: historyError } = await supabase
      .from('disposal_history')
      .insert([
        {
          user_id: userId,
          qr_code: qrCode,
          waste_type: wasteType || 'unknown',
          quantity: quantity || 1,
          points_earned: pointsEarned,
          bin_id: binId || null,
          bin_location: null,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (historyError) {
      console.warn('Warning: Could not record disposal history');
    }

    res.json({
      success: true,
      message: 'Points credited successfully!',
      pointsEarned: pointsEarned,
      totalPoints: newPoints,
      wasteType: wasteType || 'unknown',
      quantity: quantity || 1
    });
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing QR scan'
    });
  }
};

// ============================================
// Get QR Scan History
// ============================================
exports.getScanHistory = async (req, res) => {
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
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error fetching scan history'
      });
    }

    res.json({
      success: true,
      history: data || []
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Verify QR Code Validity
// ============================================
exports.verifyQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required'
      });
    }

    // TODO: Implement actual QR code verification logic
    // Check against a database of valid QR codes

    // For now, basic validation
    const isValid = qrCode.length > 0;

    res.json({
      success: true,
      isValid: isValid,
      qrCode: qrCode,
      message: isValid ? 'QR code is valid' : 'QR code is invalid'
    });
  } catch (error) {
    console.error('Verify QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// Helper Function: Calculate Points
// ============================================
function calculatePoints(wasteType, quantity = 1) {
  // Point calculation based on waste type
  const pointsPerItem = {
    'plastic': 10,
    'paper': 8,
    'metal': 15,
    'glass': 12,
    'organic': 5,
    'e-waste': 20,
    'default': 5
  };

  const basePoints = pointsPerItem[wasteType?.toLowerCase()] || pointsPerItem['default'];
  return basePoints * (quantity || 1);
}
