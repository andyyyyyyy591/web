/** Coordenadas en porcentaje (0-100) para cada posición en la cancha.
 *  El eje Y=0 es el arco propio (defensa), Y=100 es el arco rival (ataque).
 *  El equipo "flip" (visitante) se invierte verticalmente en Formation.tsx.
 */
export const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  // Arquero
  ARQ: { x: 50, y: 7 },
  POR: { x: 50, y: 7 },
  // Defensores
  DFC: { x: 50, y: 23 },
  LI:  { x: 18, y: 23 },
  LD:  { x: 82, y: 23 },
  // Mediocampistas
  MCD: { x: 50, y: 42 },
  MC:  { x: 50, y: 50 },
  MCO: { x: 50, y: 62 },
  MI:  { x: 18, y: 50 },
  MD:  { x: 82, y: 50 },
  'EXT D': { x: 82, y: 55 },
  'EXT I': { x: 18, y: 55 },
  // Delanteros
  SD:  { x: 50, y: 72 },
  DEL: { x: 50, y: 82 },
  DC:  { x: 50, y: 82 },
};

/** Devuelve coordenadas para una posición, con offset horizontal si hay
 *  varios jugadores en la misma franja (evita solapamiento). */
export function getCoordsForPosition(
  positionLabel: string | null,
  indexInPosition: number,
  totalInPosition: number,
): { x: number; y: number } {
  const base = positionLabel ? POSITION_COORDS[positionLabel] : null;
  if (!base) return { x: 50, y: 50 };

  if (totalInPosition <= 1) return base;

  // Distribuir horizontalmente centrados en base.x
  const spread = Math.min(30, totalInPosition * 12);
  const step = spread / (totalInPosition - 1);
  const x = (base.x - spread / 2) + indexInPosition * step;
  return { x: Math.max(10, Math.min(90, x)), y: base.y };
}
