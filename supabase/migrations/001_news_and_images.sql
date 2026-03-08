-- ============================================================
-- Migration 001: News table + image columns + roles RLS
-- Pegar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Columna image_url en matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Columna image_url en seasons
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Tabla news
CREATE TABLE IF NOT EXISTS news (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE NOT NULL,
  content      TEXT NOT NULL,
  excerpt      TEXT,
  image_url    TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN     DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_slug         ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_published ON news(is_published);

CREATE TRIGGER trg_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. RLS para news
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Lectura pública: noticias publicadas O usuario autenticado con rol admin
CREATE POLICY "read_news"
  ON news FOR SELECT
  USING (
    is_published = true
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'team_admin')
  );

-- Escritura solo para admin
CREATE POLICY "admin_write_news"
  ON news FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 5. RLS adicional para team_admin en clubs
CREATE POLICY "team_admin_update_own_club"
  ON clubs FOR UPDATE
  USING (
    id = (auth.jwt() -> 'app_metadata' ->> 'club_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'team_admin'
  );

-- 6. RLS adicional para team_admin en players
CREATE POLICY "team_admin_insert_own_players"
  ON players FOR INSERT
  WITH CHECK (
    club_id = (auth.jwt() -> 'app_metadata' ->> 'club_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'team_admin'
  );

CREATE POLICY "team_admin_update_own_players"
  ON players FOR UPDATE
  USING (
    club_id = (auth.jwt() -> 'app_metadata' ->> 'club_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'team_admin'
  );
