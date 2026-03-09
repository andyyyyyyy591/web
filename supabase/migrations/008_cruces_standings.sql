-- =====================================================
-- Migration 008: Exclude cruce matches from standings
-- =====================================================
-- Matches with round_label set (Cuartos, Semifinal, Final, etc.)
-- are knockout-phase matches and must NOT count toward zone standings.
-- Interzonal group matches (no round_label) still count: each club
-- earns points in their own zone as defined in tournament_clubs.

CREATE OR REPLACE FUNCTION recalculate_tournament_standings(p_tournament_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM standings WHERE tournament_id = p_tournament_id;

  INSERT INTO standings (
    tournament_id, club_id, zone,
    played, won, drawn, lost,
    goals_for, goals_against, points
  )
  SELECT
    p_tournament_id,
    tc.club_id,
    tc.zone,
    -- Only count group-stage matches (round_label IS NULL = not a cruce)
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.round_label IS NULL) AS played,
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.round_label IS NULL AND (
      (m.home_club_id = tc.club_id AND m.home_score > m.away_score) OR
      (m.away_club_id = tc.club_id AND m.away_score > m.home_score)
    )) AS won,
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.round_label IS NULL AND m.home_score = m.away_score) AS drawn,
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.round_label IS NULL AND (
      (m.home_club_id = tc.club_id AND m.home_score < m.away_score) OR
      (m.away_club_id = tc.club_id AND m.away_score < m.home_score)
    )) AS lost,
    COALESCE(SUM(
      CASE WHEN m.status = 'finished' AND m.round_label IS NULL THEN
        CASE WHEN m.home_club_id = tc.club_id THEN m.home_score ELSE m.away_score END
      END
    ), 0) AS goals_for,
    COALESCE(SUM(
      CASE WHEN m.status = 'finished' AND m.round_label IS NULL THEN
        CASE WHEN m.home_club_id = tc.club_id THEN m.away_score ELSE m.home_score END
      END
    ), 0) AS goals_against,
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.round_label IS NULL AND (
      (m.home_club_id = tc.club_id AND m.home_score > m.away_score) OR
      (m.away_club_id = tc.club_id AND m.away_score > m.home_score)
    )) * 3 +
    COUNT(m.id) FILTER (WHERE m.status = 'finished' AND m.round_label IS NULL AND m.home_score = m.away_score) AS points

  FROM tournament_clubs tc
  LEFT JOIN matches m
    ON  m.tournament_id = p_tournament_id
    AND (m.home_club_id = tc.club_id OR m.away_club_id = tc.club_id)
  WHERE tc.tournament_id = p_tournament_id
  GROUP BY tc.club_id, tc.zone;
END;
$$;
