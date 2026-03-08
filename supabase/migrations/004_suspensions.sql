-- Manual suspension overrides and additions
CREATE TABLE IF NOT EXISTS player_suspensions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL DEFAULT 'Suspensión manual',
  card_match_date INTEGER,
  suspended_for_date INTEGER NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_suspensions_player     ON player_suspensions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_suspensions_tournament ON player_suspensions(tournament_id);

-- RLS
ALTER TABLE player_suspensions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) full access
CREATE POLICY "Admins can do everything on player_suspensions"
  ON player_suspensions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon read (for public pages)
CREATE POLICY "Public can read player_suspensions"
  ON player_suspensions FOR SELECT
  TO anon
  USING (true);
