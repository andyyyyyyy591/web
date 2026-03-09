-- Add penalty winner tracking to matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS penalty_winner_club_id UUID REFERENCES clubs(id) NULL;
