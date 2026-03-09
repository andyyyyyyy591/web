-- ─── Cuerpo técnico por club ─────────────────────────────────────────────────
CREATE TABLE coaching_staff (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id          UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  first_name       TEXT        NOT NULL,
  last_name        TEXT        NOT NULL,
  role             TEXT        NOT NULL DEFAULT 'DT',
  photo_url        TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Cuerpo técnico por partido ──────────────────────────────────────────────
CREATE TABLE match_coaching_staff (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id  UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  club_id   UUID        NOT NULL REFERENCES clubs(id),
  staff_id  UUID        NOT NULL REFERENCES coaching_staff(id) ON DELETE CASCADE,
  UNIQUE (match_id, staff_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE coaching_staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_coaching_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_coaching_staff"
  ON coaching_staff FOR SELECT USING (true);

CREATE POLICY "public_read_match_coaching_staff"
  ON match_coaching_staff FOR SELECT USING (true);

-- ─── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_coaching_staff_club_id         ON coaching_staff (club_id);
CREATE INDEX idx_match_coaching_staff_match_id  ON match_coaching_staff (match_id);
