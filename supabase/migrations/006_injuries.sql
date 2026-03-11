-- Tabla de lesiones de jugadores
-- Gestionada por el admin del equipo (club_id)

CREATE TABLE player_injuries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  club_id             UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  description         TEXT NOT NULL,
  estimated_recovery  TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_injuries_club ON player_injuries (club_id);
CREATE INDEX idx_player_injuries_player ON player_injuries (player_id);

ALTER TABLE player_injuries ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "public read injuries"
  ON player_injuries FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura: solo usuarios autenticados (autorización real en server actions)
CREATE POLICY "authenticated write injuries"
  ON player_injuries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
