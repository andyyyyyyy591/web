-- Migration 002: dark redesign additions
-- Players: jersey number + plays_in_primera flag
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS jersey_number SMALLINT,
  ADD COLUMN IF NOT EXISTS plays_in_primera BOOLEAN NOT NULL DEFAULT false;

-- Clubs: extra info text
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS extra_info TEXT;

-- Trophies table
CREATE TABLE IF NOT EXISTS trophies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  year         INT,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trophies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trophies" ON trophies FOR SELECT USING (true);
CREATE POLICY "Admin manage trophies" ON trophies FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  club_id      UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('in', 'out')),
  season_id    UUID REFERENCES seasons(id) ON DELETE SET NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read transfers" ON transfers FOR SELECT USING (true);
CREATE POLICY "Admin manage transfers" ON transfers FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'team_admin')
);
