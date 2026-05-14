-- Create schedule_admins junction table for multiple admin assignments
-- This allows schedules to be assigned to multiple admins

CREATE TABLE IF NOT EXISTS schedule_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_schedule_admins_schedule FOREIGN KEY (schedule_id) 
    REFERENCES schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedule_admins_admin FOREIGN KEY (admin_id) 
    REFERENCES admin_accounts(id) ON DELETE CASCADE,
  
  -- Ensure no duplicate assignments
  CONSTRAINT unique_schedule_admin UNIQUE(schedule_id, admin_id),
  
  -- Add indexes for performance
  INDEX idx_schedule_id (schedule_id),
  INDEX idx_admin_id (admin_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schedule_admins_schedule ON schedule_admins(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_admins_admin ON schedule_admins(admin_id);

-- Add comment
COMMENT ON TABLE schedule_admins IS 'Junction table for multiple admin assignments to schedules';
