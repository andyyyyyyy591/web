-- =====================================================
-- Migration 012: Match zone (Zona A / Zona B / Interzonal)
-- =====================================================

-- Add match_zone to identify whether a match is played within Zona A,
-- within Zona B, or is an interzonal cross-zone match.
-- Only relevant for tournaments with format = 'zonas'.
-- Standings recalculation is unaffected: each club's zone already comes
-- from tournament_clubs.zone, so interzonal matches automatically count
-- toward each team's respective zone.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_zone TEXT
    CHECK (match_zone IN ('zona_a', 'zona_b', 'interzonal'));
