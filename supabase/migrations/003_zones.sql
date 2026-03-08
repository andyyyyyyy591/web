-- =====================================================
-- Migration 003: Tournament clubs + Zones
-- =====================================================

-- 1. Tournament clubs: registers which clubs participate in each tournament and their zone
CREATE TABLE IF NOT EXISTS tournament_clubs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  club_id       UUID NOT NULL REFERENCES clubs(id)       ON DELETE CASCADE,
  zone          TEXT CHECK (zone IN ('A', 'B')),          -- NULL = no zones (cuarta/quinta/septima)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, club_id)
);

ALTER TABLE tournament_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tournament_clubs"    ON tournament_clubs FOR SELECT USING (true);
CREATE POLICY "Admin manage tournament_clubs"   ON tournament_clubs FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 2. Add zone column to standings
ALTER TABLE standings ADD COLUMN IF NOT EXISTS zone TEXT CHECK (zone IN ('A', 'B'));

-- 3. Replace recalculate function to use tournament_clubs as source of truth
--    (clubs with 0 matches still appear; zone comes from tournament_clubs)
CREATE OR REPLACE FUNCTION recalculate_tournament_standings(p_tournament_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM standings WHERE tournament_id = p_tournament_id;

  INSERT INTO standings (
    tournament_id, club_id, zone,
    played, won, drawn, lost,
    goals_for, goals_against, points
  )
  SELECT
    p_tournament_id,
    tc.club_id,
    tc.zone,
    -- Played: finished matches involving this club
    COUNT(m.id) FILTER (WHERE m.status = 'finished') AS played,
    -- Won
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND (
      (m.home_club_id = tc.club_id AND m.home_score > m.away_score) OR
      (m.away_club_id = tc.club_id AND m.away_score > m.home_score)
    )) AS won,
    -- Drawn
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.home_score = m.away_score) AS drawn,
    -- Lost
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND (
      (m.home_club_id = tc.club_id AND m.home_score < m.away_score) OR
      (m.away_club_id = tc.club_id AND m.away_score < m.home_score)
    )) AS lost,
    -- Goals for
    COALESCE(SUM(
      CASE WHEN m.status = 'finished' THEN
        CASE WHEN m.home_club_id = tc.club_id THEN m.home_score ELSE m.away_score END
      END
    ), 0) AS goals_for,
    -- Goals against
    COALESCE(SUM(
      CASE WHEN m.status = 'finished' THEN
        CASE WHEN m.home_club_id = tc.club_id THEN m.away_score ELSE m.home_score END
      END
    ), 0) AS goals_against,
    -- Points (3 win, 1 draw)
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND (
      (m.home_club_id = tc.club_id AND m.home_score > m.away_score) OR
      (m.away_club_id = tc.club_id AND m.away_score > m.home_score)
    )) * 3 +
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.home_score = m.away_score) AS points

  FROM tournament_clubs tc
  LEFT JOIN matches m
    ON  m.tournament_id = p_tournament_id
    AND (m.home_club_id = tc.club_id OR m.away_club_id = tc.club_id)
  WHERE tc.tournament_id = p_tournament_id
  GROUP BY tc.club_id, tc.zone;
END;
$$;
