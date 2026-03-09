-- Add club_id to news so news can be linked to a specific club
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_news_club_id ON news(club_id);
