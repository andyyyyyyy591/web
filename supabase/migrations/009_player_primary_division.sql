-- =====================================================
-- Migration 009: Primary division per player
-- =====================================================
-- Replaces the plays_in_primera boolean with a proper
-- FK reference to the divisions table, so each player
-- has an explicit primary category (Primera, Reserva,
-- Cuarta, Quinta, Séptima, etc.)

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS primary_division_id UUID REFERENCES divisions(id);

-- Migrate existing data: players marked as plays_in_primera
-- get assigned to the "primera" division automatically.
UPDATE players p
SET primary_division_id = d.id
FROM divisions d
WHERE d.slug = 'primera'
  AND p.plays_in_primera = true
  AND p.primary_division_id IS NULL;
