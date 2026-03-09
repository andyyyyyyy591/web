-- Many-to-many: news <-> clubs (auto-detected from content)
CREATE TABLE IF NOT EXISTS news_clubs (
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, club_id)
);

ALTER TABLE news_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_news_clubs"
  ON news_clubs FOR SELECT USING (true);

CREATE POLICY "admin_write_news_clubs"
  ON news_clubs FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_news_clubs_club_id ON news_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_news_clubs_news_id ON news_clubs(news_id);

-- Remove club_id column added in migration 013 (replaced by news_clubs)
ALTER TABLE news DROP COLUMN IF EXISTS club_id;
