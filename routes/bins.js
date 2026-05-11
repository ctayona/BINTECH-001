/**
 * Bins Management API Routes
 * Handles CRUD operations for waste bins
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

/**
 * GET /api/bins
 * Load all bins from database
 */
router.get('/bins', async (req, res) => {
  try {
    console.log('[GET /api/bins] Loading all bins...');
    
    const { data: bins, error } = await supabase
      .from('bins')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[GET /api/bins] Database error:', error);
      return res.status(500).json({ error: 'Failed to load bins', details: error.message });
    }
    
    console.log(`[GET /api/bins] ✓ Loaded ${bins.length} bins`);
    res.json(bins);
  } catch (error) {
    console.error('[GET /api/bins] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * POST /api/bins
 * Create a new bin
 */
router.post('/bins', async (req, res) => {
  try {
    const {
      code,
      location,
      latitude,
      longitude,
      status = 'active',
      capacity = 100,
      filled_percentage = 0,
      last_maintenance_at,
      zone_id
    } = req.body;
    
    console.log('[POST /api/bins] Creating new bin:', code);
    
    // Validation
    if (!code || !location) {
      return res.status(400).json({ error: 'Code and location are required' });
    }
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Invalid latitude (must be between -90 and 90)' });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid longitude (must be between -180 and 180)' });
    }
    
    // Validate status
    const validStatuses = ['active', 'maintenance', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status (must be active, maintenance, or inactive)' });
    }
    
    // Check for duplicate code
    const { data: existing } = await supabase
      .from('bins')
      .select('id')
      .eq('code', code)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'Bin code already exists' });
    }
    
    // Get current admin user (if available)
    const created_by = req.session?.user?.id || null;
    
    // Create bin
    const { data: newBin, error } = await supabase
      .from('bins')
      .insert([{
        code,
        location,
        latitude,
        longitude,
        status,
        capacity,
        filled_percentage,
        last_maintenance_at,
        zone_id,
        created_by
      }])
      .select()
      .single();
    
    if (error) {
      console.error('[POST /api/bins] Database error:', error);
      return res.status(500).json({ error: 'Failed to create bin', details: error.message });
    }
    
    console.log(`[POST /api/bins] ✓ Created bin: ${code} (ID: ${newBin.id})`);
    res.status(201).json(newBin);
  } catch (error) {
    console.error('[POST /api/bins] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * PUT /api/bins/:id
 * Update bin status or other fields
 */
router.put('/bins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, filled_percentage, last_maintenance_at, last_collected_at } = req.body;
    
    console.log(`[PUT /api/bins/${id}] Updating bin...`);
    
    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'maintenance', 'inactive'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status (must be active, maintenance, or inactive)' });
      }
    }
    
    // Build update object
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (filled_percentage !== undefined) updates.filled_percentage = filled_percentage;
    if (last_maintenance_at !== undefined) updates.last_maintenance_at = last_maintenance_at;
    if (last_collected_at !== undefined) updates.last_collected_at = last_collected_at;
    
    // Update bin
    const { data: updatedBin, error } = await supabase
      .from('bins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Bin not found' });
      }
      console.error(`[PUT /api/bins/${id}] Database error:`, error);
      return res.status(500).json({ error: 'Failed to update bin', details: error.message });
    }
    
    console.log(`[PUT /api/bins/${id}] ✓ Updated bin: ${updatedBin.code}`);
    res.json(updatedBin);
  } catch (error) {
    console.error(`[PUT /api/bins/${id}] Error:`, error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * DELETE /api/bins/:id
 * Delete a bin
 */
router.delete('/bins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[DELETE /api/bins/${id}] Deleting bin...`);
    
    // Check if bin exists
    const { data: bin, error: fetchError } = await supabase
      .from('bins')
      .select('code')
      .eq('id', id)
      .single();
    
    if (fetchError || !bin) {
      return res.status(404).json({ error: 'Bin not found' });
    }
    
    // Delete bin
    const { error } = await supabase
      .from('bins')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`[DELETE /api/bins/${id}] Database error:`, error);
      return res.status(500).json({ error: 'Failed to delete bin', details: error.message });
    }
    
    console.log(`[DELETE /api/bins/${id}] ✓ Deleted bin: ${bin.code}`);
    res.json({ success: true, message: 'Bin deleted successfully' });
  } catch (error) {
    console.error(`[DELETE /api/bins/${id}] Error:`, error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
