-- Add division_id to coaching_staff
ALTER TABLE coaching_staff ADD COLUMN division_id UUID REFERENCES divisions(id) ON DELETE SET NULL;
