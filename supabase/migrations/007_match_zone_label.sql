-- Add zone and round_label to matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS zone        TEXT CHECK (zone IN ('A', 'B')),
  ADD COLUMN IF NOT EXISTS round_label TEXT;  -- e.g. "Semifinal 1", "Final"
