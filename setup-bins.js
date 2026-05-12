#!/usr/bin/env node

/**
 * Setup Bins SQL - Insert sample bin data into Supabase
 * Run: node setup-bins.js
 */

const { supabase } = require('./config/supabase');

async function setupBins() {
  console.log('🗑️  Setting up sample bins...\n');

  // Sample bin data based on schema
  const sampleBins = [
    {
      code: 'BIN-0001',
      location: 'Main Lobby - Zone A',
      status: 'active',
      capacity: 100,
      filled_percentage: 42.5,
      last_collected_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      code: 'BIN-0002',
      location: 'Main Lobby - Zone B',
      status: 'active',
      capacity: 100,
      filled_percentage: 68.3,
      last_collected_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
    {
      code: 'BIN-0003',
      location: 'Corridor A - Floor 1',
      status: 'active',
      capacity: 100,
      filled_percentage: 85.2,
      last_collected_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    },
    {
      code: 'BIN-0004',
      location: 'Corridor A - Floor 2',
      status: 'maintenance',
      capacity: 100,
      filled_percentage: 0,
      last_collected_at: null,
    },
    {
      code: 'BIN-0005',
      location: 'Break Room - Zone A',
      status: 'active',
      capacity: 100,
      filled_percentage: 31.7,
      last_collected_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
      code: 'BIN-0006',
      location: 'Break Room - Zone B',
      status: 'active',
      capacity: 100,
      filled_percentage: 91.8,
      last_collected_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    },
    {
      code: 'BIN-0007',
      location: 'Storage Area - Zone 1',
      status: 'active',
      capacity: 120,
      filled_percentage: 55.4,
      last_collected_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
    {
      code: 'BIN-0008',
      location: 'Storage Area - Zone 2',
      status: 'inactive',
      capacity: 100,
      filled_percentage: 0,
      last_collected_at: null,
    },
    {
      code: 'BIN-0009',
      location: 'Office Wing - A',
      status: 'active',
      capacity: 100,
      filled_percentage: 44.1,
      last_collected_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    },
    {
      code: 'BIN-0010',
      location: 'Office Wing - B',
      status: 'active',
      capacity: 100,
      filled_percentage: 73.6,
      last_collected_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    },
  ];

  try {
    console.log(`📝 Inserting ${sampleBins.length} sample bins...\n`);

    // Insert bins
    const { data, error } = await supabase
      .from('bins')
      .insert(sampleBins)
      .select();

    if (error) {
      console.error('❌ Error inserting bins:', error);
      process.exit(1);
    }

    console.log('✅ Successfully added bins:');
    data.forEach(bin => {
      const statusEmoji = {
        active: '🟢',
        maintenance: '🔧',
        inactive: '⚫',
      }[bin.status] || '❓';
      console.log(`  ${statusEmoji} ${bin.code} – ${bin.location} (${bin.filled_percentage}% full)`);
    });

    console.log(`\n✨ Setup complete! ${data.length} bins ready to monitor.\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the setup
setupBins();
