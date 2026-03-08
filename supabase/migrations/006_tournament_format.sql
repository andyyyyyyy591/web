-- Add format column to tournaments
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS format TEXT
  CHECK (format IN ('todos_contra_todos', 'zonas', 'eliminatorias'))
  DEFAULT 'todos_contra_todos';

-- Auto-assign zonas to existing primera/reserva tournaments
UPDATE tournaments
SET format = 'zonas'
FROM divisions d
WHERE tournaments.division_id = d.id
  AND d.slug IN ('primera', 'reserva');
