// Supabase Configuration
// This file initializes and exports the Supabase client
// for database operations throughout the application

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
// Prefer service role key on the server for admin CRUD.
// Falls back to anon key for read-only / basic operations.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Warning: Supabase credentials not found in environment variables.');
  console.warn('Please set SUPABASE_URL and SUPABASE_ANON_KEY (and optionally SUPABASE_SERVICE_ROLE_KEY) in your .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

// ============================================
// Example Usage in your controllers:
// ============================================
// const supabase = require('../config/supabase');
//
// // Fetch data
// const { data, error } = await supabase
//   .from('users')
//   .select('*')
//   .eq('id', user_id);
//
// // Insert data
// const { data, error } = await supabase
//   .from('users')
//   .insert([{ name: 'John', email: 'john@example.com' }]);
//
// // Update data
// const { data, error } = await supabase
//   .from('users')
//   .update({ points: 100 })
//   .eq('id', user_id);
//
// // Delete data
// const { data, error } = await supabase
//   .from('users')
//   .delete()
//   .eq('id', user_id);
