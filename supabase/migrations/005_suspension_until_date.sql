-- Add suspended_until_date to support multi-match suspensions
ALTER TABLE player_suspensions
  ADD COLUMN IF NOT EXISTS suspended_until_date INTEGER;
