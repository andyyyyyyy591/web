-- ============================================================
-- Liga de Fútbol — Supabase Schema
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE division_name AS ENUM (
  'primera',
  'reserva',
  'cuarta',
  'quinta',
  'septima'
);

CREATE TYPE match_status AS ENUM (
  'scheduled',          -- Programado
  'first_half',         -- Primer tiempo
  'halftime',           -- Descanso
  'second_half',        -- Segundo tiempo
  'extra_time_first',   -- Tiempo extra 1° mitad
  'extra_time_break',   -- Descanso tiempo extra
  'extra_time_second',  -- Tiempo extra 2° mitad
  'penalties',          -- Penales
  'finished',           -- Finalizado
  'postponed',          -- Postergado
  'cancelled'           -- Cancelado
);

CREATE TYPE event_type AS ENUM (
  'goal',               -- Gol
  'own_goal',           -- Gol en contra
  'penalty_goal',       -- Gol de penal
  'penalty_missed',     -- Penal fallado
  'yellow_card',        -- Tarjeta amarilla
  'second_yellow',      -- Segunda amarilla (equivale a roja)
  'red_card',           -- Tarjeta roja directa
  'substitution',       -- Cambio
  'var_review'          -- Revisión VAR
);

CREATE TYPE player_position AS ENUM (
  'goalkeeper',
  'right_back',
  'center_back',
  'left_back',
  'defensive_mid',
  'central_mid',
  'attacking_mid',
  'right_wing',
  'left_wing',
  'second_striker',
  'striker'
);

-- ============================================================
-- TABLA: clubs
-- ============================================================
CREATE TABLE clubs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(100) NOT NULL,
  short_name       VARCHAR(10),
  slug             VARCHAR(100) UNIQUE NOT NULL,
  logo_url         TEXT,
  primary_color    VARCHAR(7)  DEFAULT '#000000',
  secondary_color  VARCHAR(7)  DEFAULT '#FFFFFF',
  founded_year     INTEGER,
  is_active        BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: seasons (temporadas)
-- ============================================================
CREATE TABLE seasons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50)  NOT NULL,   -- "Apertura 2025", "Clausura 2025"
  year        INTEGER      NOT NULL,
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN      DEFAULT false,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLA: divisions
-- ============================================================
CREATE TABLE divisions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           division_name NOT NULL UNIQUE,
  label          VARCHAR(50)   NOT NULL,   -- "Primera División"
  slug           VARCHAR(50)   NOT NULL UNIQUE,
  has_live_mode  BOOLEAN       DEFAULT false,
  display_order  INTEGER       NOT NULL,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- Divisiones fijas del sistema
INSERT INTO divisions (name, label, slug, has_live_mode, display_order) VALUES
  ('primera', 'Primera División', 'primera', true,  1),
  ('reserva',  'Reserva',          'reserva',  true,  2),
  ('cuarta',   'Cuarta División',   'cuarta',   false, 3),
  ('quinta',   'Quinta División',   'quinta',   false, 4),
  ('septima',  'Séptima División',  'septima',  false, 5);

-- ============================================================
-- TABLA: players (pertenecen al club, no a la división)
-- ============================================================
CREATE TABLE players (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id        UUID          NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  first_name     VARCHAR(100)  NOT NULL,
  last_name      VARCHAR(100)  NOT NULL,
  date_of_birth  DATE,
  position       player_position,
  photo_url      TEXT,
  nationality    VARCHAR(100)  DEFAULT 'Argentina',
  is_active      BOOLEAN       DEFAULT true,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- TABLA: tournaments (torneo = temporada + división)
-- ============================================================
CREATE TABLE tournaments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id    UUID NOT NULL REFERENCES seasons(id)   ON DELETE CASCADE,
  division_id  UUID NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT,
  name         VARCHAR(100) NOT NULL,   -- "Apertura 2025 — Primera"
  is_active    BOOLEAN      DEFAULT true,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (season_id, division_id)
);

-- ============================================================
-- TABLA: match_dates (fechas del torneo)
-- ============================================================
CREATE TABLE match_dates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id    UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  number           INTEGER     NOT NULL,
  label            VARCHAR(50),             -- "Fecha 1", "Semifinal"
  scheduled_start  DATE,
  scheduled_end    DATE,
  is_current       BOOLEAN     DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, number)
);

-- ============================================================
-- TABLA: matches (partidos)
-- ============================================================
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id)  ON DELETE CASCADE,
  match_date_id   UUID          REFERENCES match_dates(id)  ON DELETE SET NULL,
  home_club_id    UUID NOT NULL REFERENCES clubs(id),
  away_club_id    UUID NOT NULL REFERENCES clubs(id),

  -- Programación
  scheduled_at    TIMESTAMPTZ,
  stadium         VARCHAR(150),

  -- Estado y marcador
  status          match_status  DEFAULT 'scheduled',
  home_score      INTEGER       DEFAULT 0,
  away_score      INTEGER       DEFAULT 0,

  -- Timestamps para calcular el reloj en vivo
  started_at              TIMESTAMPTZ,   -- inicio 1° tiempo
  halftime_at             TIMESTAMPTZ,   -- inicio descanso
  second_half_at          TIMESTAMPTZ,   -- inicio 2° tiempo
  extra_time_first_at     TIMESTAMPTZ,
  extra_time_break_at     TIMESTAMPTZ,
  extra_time_second_at    TIMESTAMPTZ,
  finished_at             TIMESTAMPTZ,

  -- Tiempo adicional (en minutos)
  first_half_added_time   INTEGER DEFAULT 0,
  second_half_added_time  INTEGER DEFAULT 0,

  -- Árbitros
  referee              VARCHAR(150),
  referee_assistant_1  VARCHAR(150),
  referee_assistant_2  VARCHAR(150),
  referee_fourth       VARCHAR(150),

  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  CHECK (home_club_id != away_club_id)
);

-- ============================================================
-- TABLA: match_lineups (alineaciones)
-- ============================================================
CREATE TABLE match_lineups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID    NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  club_id         UUID    NOT NULL REFERENCES clubs(id),
  player_id       UUID    NOT NULL REFERENCES players(id),
  is_starter      BOOLEAN NOT NULL DEFAULT false,
  shirt_number    INTEGER,
  position_label  VARCHAR(10),   -- "GK", "CB", "RB", "CAM"…
  -- Posición en el campo para renderizar la formación (0–100 relativo)
  field_x         NUMERIC(5,2),  -- eje horizontal
  field_y         NUMERIC(5,2),  -- eje vertical (0 = portería propia)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, player_id)
);

-- ============================================================
-- TABLA: match_events (goles, tarjetas, cambios)
-- ============================================================
CREATE TABLE match_events (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id             UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  minute               INTEGER     NOT NULL,
  added_time           INTEGER     DEFAULT 0,   -- para 45+3, este campo = 3
  period               VARCHAR(30) DEFAULT 'first_half',
    -- first_half | second_half | extra_time_first | extra_time_second | penalties
  type                 event_type  NOT NULL,
  club_id              UUID        NOT NULL REFERENCES clubs(id),
  -- Jugador principal (quien hace la acción: goleador, amonestado, sale)
  player_id            UUID        REFERENCES players(id),
  -- Jugador secundario (asistente, o quien entra en un cambio)
  secondary_player_id  UUID        REFERENCES players(id),
  description          TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: standings (posiciones)
-- Se mantiene via función, no triggers
-- ============================================================
CREATE TABLE standings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id    UUID    NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  club_id          UUID    NOT NULL REFERENCES clubs(id),
  played           INTEGER DEFAULT 0,
  won              INTEGER DEFAULT 0,
  drawn            INTEGER DEFAULT 0,
  lost             INTEGER DEFAULT 0,
  goals_for        INTEGER DEFAULT 0,
  goals_against    INTEGER DEFAULT 0,
  points           INTEGER DEFAULT 0,
  -- Columna generada
  goal_difference  INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, club_id)
);

-- ============================================================
-- VISTA: top_scorers (goleadores por torneo)
-- ============================================================
CREATE OR REPLACE VIEW top_scorers AS
SELECT
  p.id            AS player_id,
  p.first_name,
  p.last_name,
  p.photo_url,
  c.id            AS club_id,
  c.name          AS club_name,
  c.logo_url      AS club_logo,
  t.id            AS tournament_id,
  t.name          AS tournament_name,
  d.id            AS division_id,
  d.name          AS division_name,
  d.slug          AS division_slug,
  COUNT(me.id)    AS goals
FROM match_events me
JOIN players    p  ON me.player_id    = p.id
JOIN clubs      c  ON p.club_id       = c.id
JOIN matches    m  ON me.match_id     = m.id
JOIN tournaments t ON m.tournament_id = t.id
JOIN divisions  d  ON t.division_id   = d.id
WHERE
  me.type IN ('goal', 'penalty_goal')
  AND me.player_id IS NOT NULL
  AND m.status = 'finished'
GROUP BY
  p.id, p.first_name, p.last_name, p.photo_url,
  c.id, c.name, c.logo_url,
  t.id, t.name,
  d.id, d.name, d.slug
ORDER BY goals DESC;

-- ============================================================
-- VISTA: live_matches (partidos en vivo para homepage)
-- ============================================================
CREATE OR REPLACE VIEW live_matches AS
SELECT
  m.*,
  hc.name       AS home_club_name,
  hc.logo_url   AS home_club_logo,
  hc.slug       AS home_club_slug,
  ac.name       AS away_club_name,
  ac.logo_url   AS away_club_logo,
  ac.slug       AS away_club_slug,
  d.name        AS division_name,
  d.slug        AS division_slug,
  d.label       AS division_label
FROM matches m
JOIN clubs      hc ON m.home_club_id  = hc.id
JOIN clubs      ac ON m.away_club_id  = ac.id
JOIN tournaments t ON m.tournament_id = t.id
JOIN divisions   d ON t.division_id   = d.id
WHERE m.status IN ('first_half', 'halftime', 'second_half', 'extra_time_first', 'extra_time_break', 'extra_time_second', 'penalties');

-- ============================================================
-- FUNCIÓN: recalculate_tournament_standings
-- Borra y recalcula standings desde cero a partir de partidos finalizados.
-- Llamada manualmente desde el admin (no trigger).
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_tournament_standings(p_tournament_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Borrar standings actuales
  DELETE FROM standings WHERE tournament_id = p_tournament_id;

  -- Reinsertar calculados desde todos los partidos finalizados
  INSERT INTO standings (tournament_id, club_id, played, won, drawn, lost, goals_for, goals_against, points)
  SELECT
    p_tournament_id,
    club_id,
    COUNT(*)                                                                     AS played,
    SUM(CASE WHEN scored > conceded THEN 1 ELSE 0 END)                          AS won,
    SUM(CASE WHEN scored = conceded THEN 1 ELSE 0 END)                          AS drawn,
    SUM(CASE WHEN scored < conceded THEN 1 ELSE 0 END)                          AS lost,
    SUM(scored)                                                                  AS goals_for,
    SUM(conceded)                                                                AS goals_against,
    SUM(CASE WHEN scored > conceded THEN 3 WHEN scored = conceded THEN 1 ELSE 0 END) AS points
  FROM (
    -- Como local
    SELECT home_club_id AS club_id, home_score AS scored, away_score AS conceded
    FROM matches
    WHERE tournament_id = p_tournament_id AND status = 'finished'

    UNION ALL

    -- Como visitante
    SELECT away_club_id AS club_id, away_score AS scored, home_score AS conceded
    FROM matches
    WHERE tournament_id = p_tournament_id AND status = 'finished'
  ) AS games
  GROUP BY club_id;
END;
$$;

-- ============================================================
-- FUNCIÓN: finish_match
-- Finaliza el partido, actualiza scores y recalcula standings.
-- ============================================================
CREATE OR REPLACE FUNCTION finish_match(p_match_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_tournament_id UUID;
BEGIN
  -- Marcar como finalizado
  UPDATE matches
  SET
    status      = 'finished',
    finished_at = NOW(),
    updated_at  = NOW()
  WHERE id = p_match_id
  RETURNING tournament_id INTO v_tournament_id;

  -- Recalcular la tabla completa del torneo
  PERFORM recalculate_tournament_standings(v_tournament_id);
END;
$$;

-- ============================================================
-- FUNCIÓN: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clubs_updated_at    BEFORE UPDATE ON clubs    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_players_updated_at  BEFORE UPDATE ON players  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_matches_updated_at  BEFORE UPDATE ON matches  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_players_club_id             ON players(club_id);
CREATE INDEX idx_tournaments_season_id       ON tournaments(season_id);
CREATE INDEX idx_tournaments_division_id     ON tournaments(division_id);
CREATE INDEX idx_match_dates_tournament_id   ON match_dates(tournament_id);
CREATE INDEX idx_matches_tournament_id       ON matches(tournament_id);
CREATE INDEX idx_matches_match_date_id       ON matches(match_date_id);
CREATE INDEX idx_matches_status              ON matches(status);
CREATE INDEX idx_matches_scheduled_at        ON matches(scheduled_at);
CREATE INDEX idx_matches_home_club           ON matches(home_club_id);
CREATE INDEX idx_matches_away_club           ON matches(away_club_id);
CREATE INDEX idx_match_events_match_id       ON match_events(match_id);
CREATE INDEX idx_match_events_type           ON match_events(type);
CREATE INDEX idx_match_events_player         ON match_events(player_id);
CREATE INDEX idx_match_lineups_match_id      ON match_lineups(match_id);
CREATE INDEX idx_match_lineups_club          ON match_lineups(club_id);
CREATE INDEX idx_standings_tournament_id     ON standings(tournament_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE clubs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_dates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings      ENABLE ROW LEVEL SECURITY;

-- Lectura pública (cualquiera puede leer)
CREATE POLICY "public_read_clubs"         ON clubs         FOR SELECT USING (true);
CREATE POLICY "public_read_seasons"       ON seasons       FOR SELECT USING (true);
CREATE POLICY "public_read_divisions"     ON divisions     FOR SELECT USING (true);
CREATE POLICY "public_read_players"       ON players       FOR SELECT USING (true);
CREATE POLICY "public_read_tournaments"   ON tournaments   FOR SELECT USING (true);
CREATE POLICY "public_read_match_dates"   ON match_dates   FOR SELECT USING (true);
CREATE POLICY "public_read_matches"       ON matches       FOR SELECT USING (true);
CREATE POLICY "public_read_lineups"       ON match_lineups FOR SELECT USING (true);
CREATE POLICY "public_read_events"        ON match_events  FOR SELECT USING (true);
CREATE POLICY "public_read_standings"     ON standings     FOR SELECT USING (true);

-- Escritura solo para admins autenticados
-- El rol 'admin' se setea en app_metadata del usuario en Supabase Auth
CREATE POLICY "admin_all_clubs"         ON clubs         FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_seasons"       ON seasons       FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_players"       ON players       FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_tournaments"   ON tournaments   FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_match_dates"   ON match_dates   FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_matches"       ON matches       FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_lineups"       ON match_lineups FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_events"        ON match_events  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_all_standings"     ON standings     FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- REALTIME
-- Solo habilitado para las tablas que necesitan live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;
