-- =====================================================
-- Migration 015: Fix news_clubs RLS policy for INSERT
-- =====================================================
-- The previous policy for admin_write used only USING,
-- which may not propagate correctly to INSERT in all Supabase versions.
-- Recreate with explicit WITH CHECK clause.

DROP POLICY IF EXISTS "admin_write_news_clubs" ON news_clubs;

CREATE POLICY "admin_write_news_clubs"
  ON news_clubs FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
