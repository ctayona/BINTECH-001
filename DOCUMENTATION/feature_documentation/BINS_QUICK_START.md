# Bins API - Quick Start (2 Minutes)

## Step 1: Create Database Table (30 seconds)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. Copy and paste this SQL:

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION set_bins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create bins table
CREATE TABLE IF NOT EXISTS public.bins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  location text NULL,
  status text NOT NULL DEFAULT 'active'::text,
  capacity integer NOT NULL DEFAULT 100,
  filled_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  last_collected_at timestamp with time zone NULL,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cleared_at timestamp with time zone NULL,
  zone_id uuid NULL,
  last_maintenance_at timestamp with time zone NULL,
  latitude numeric(10, 8) NULL,
  longitude numeric(11, 8) NULL,
  
  CONSTRAINT bins_pkey PRIMARY KEY (id),
  CONSTRAINT bins_code_key UNIQUE (code),
  CONSTRAINT bins_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES admin_accounts (id) ON DELETE SET NULL,
  CONSTRAINT bins_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'maintenance'::text, 'inactive'::text])
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bins_code ON public.bins (code);
CREATE INDEX IF NOT EXISTS idx_bins_status ON public.bins (status);
CREATE INDEX IF NOT EXISTS idx_bins_location ON public.bins (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bins_zone_id ON public.bins (zone_id);

-- Create trigger
CREATE TRIGGER trg_bins_updated_at 
  BEFORE UPDATE ON bins 
  FOR EACH ROW 
  EXECUTE FUNCTION set_bins_updated_at();
```

5. Click **"Run"** button
6. You should see: "Success. No rows returned"

## Step 2: Restart Server (10 seconds)

```bash
# Stop server (Ctrl+C)
# Start server
npm start
```

## Step 3: Test (30 seconds)

1. Open http://localhost:3000/admin/routes
2. Open browser console (F12)
3. You should see:
   ```
   [loadBinsFromDatabase] ✓ Loaded 0 bins from database
   ```
4. Click on the map to add a bin
5. Fill in the form and save
6. Bin should appear on map and in table!

## Done! 🎉

Your bins management system is now fully functional!

---

## Quick Test Commands

### Test API Directly

```bash
# Load bins (should return empty array)
curl http://localhost:3000/api/bins

# Create a test bin
curl -X POST http://localhost:3000/api/bins \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST-001",
    "location": "Test Location",
    "latitude": 14.5995,
    "longitude": 120.9842,
    "status": "active",
    "capacity": 100,
    "filled_percentage": 0
  }'

# Load bins again (should return 1 bin)
curl http://localhost:3000/api/bins
```

---

## Troubleshooting

### "Failed to load bins" in console
- Check if table was created: Go to Supabase → Table Editor → Look for "bins" table
- Check server logs for errors
- Verify `.env` has correct Supabase credentials

### "Bin code already exists"
- Each bin needs a unique code
- Try a different code like "BIN-0002"

### Server won't start
- Check for syntax errors: `npm run lint`
- Check server logs: Look at console output

---

## What's Next?

✅ **Backend:** Working  
✅ **Frontend:** Working  
✅ **Database:** Created  

Now you can:
- Add bins via map
- Update bin status
- Delete bins
- View bins on map
- Export bins data

Everything is production-ready!
