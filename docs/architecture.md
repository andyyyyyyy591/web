# Arquitectura — Liga de Fútbol

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (canales Postgres Changes) |
| Storage | Supabase Storage (logos, fotos) |
| Deploy | Vercel |

---

## Estructura de carpetas

```
liga-futbol/
├── app/
│   ├── layout.tsx                        # Root layout (fonts, meta global)
│   ├── page.tsx                          # Homepage
│   ├── (public)/                         # Route group — sin auth
│   │   ├── [division]/
│   │   │   ├── page.tsx                  # División: resumen (tabla + próxima fecha + últimos resultados)
│   │   │   ├── tabla/page.tsx            # Tabla de posiciones completa
│   │   │   ├── fixture/page.tsx          # Fixture completo por fecha
│   │   │   ├── goleadores/page.tsx       # Goleadores del torneo
│   │   │   └── partidos/[id]/page.tsx    # Detalle de partido (live si es P/R)
│   │   ├── clubes/
│   │   │   ├── page.tsx                  # Todos los clubes
│   │   │   └── [slug]/page.tsx           # Perfil de club + plantel
│   │   └── jugadores/
│   │       └── [id]/page.tsx             # Perfil de jugador
│   └── (admin)/                          # Route group — requiere auth
│       ├── layout.tsx                    # Admin layout (sidebar, header, auth guard)
│       └── admin/
│           ├── page.tsx                  # Dashboard con métricas
│           ├── partidos/
│           │   ├── page.tsx              # Lista de partidos (con filtros)
│           │   ├── nuevo/page.tsx        # Crear partido
│           │   └── [id]/
│           │       ├── page.tsx          # Editar partido
│           │       └── live/page.tsx     # PANEL DE CONTROL EN VIVO
│           ├── clubes/
│           │   ├── page.tsx
│           │   ├── nuevo/page.tsx
│           │   └── [id]/page.tsx
│           ├── jugadores/
│           │   ├── page.tsx
│           │   ├── nuevo/page.tsx
│           │   └── [id]/page.tsx
│           ├── temporadas/
│           │   ├── page.tsx
│           │   └── [id]/page.tsx         # Gestionar torneos/fechas de la temporada
│           └── posiciones/
│               └── page.tsx              # Recalcular standings manualmente
│
├── components/
│   ├── ui/                               # Primitivas reutilizables
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   ├── match/                            # Componentes de partido
│   │   ├── LiveScore.tsx                 # Encabezado con marcador en vivo
│   │   ├── LiveClock.tsx                 # Reloj calculado client-side
│   │   ├── MatchTimeline.tsx             # Timeline de eventos
│   │   ├── Formation.tsx                 # Visualización de formación
│   │   ├── MatchLineup.tsx               # Titulares + suplentes
│   │   ├── MatchEventIcon.tsx            # Ícono por tipo de evento
│   │   ├── MatchOfficials.tsx            # Árbitros
│   │   └── MatchCard.tsx                 # Tarjeta compacta de partido
│   ├── division/
│   │   ├── StandingsTable.tsx            # Tabla de posiciones
│   │   ├── FixtureList.tsx               # Lista de partidos por fecha
│   │   ├── TopScorers.tsx                # Goleadores
│   │   └── NextMatchday.tsx              # Próxima fecha destacada
│   ├── club/
│   │   ├── ClubCard.tsx
│   │   └── ClubSquad.tsx                 # Plantel dividido por posición
│   └── admin/
│       ├── LiveMatchControl.tsx          # Panel completo de control en vivo
│       ├── EventForm.tsx                 # Formulario para registrar evento
│       ├── LineupBuilder.tsx             # Constructor de alineación
│       ├── MatchStatusControl.tsx        # Botones iniciar/medio/final
│       └── StandingsRecalculator.tsx
│
├── hooks/
│   ├── useRealtimeMatch.ts               # Suscripción Realtime al partido
│   ├── useRealtimeEvents.ts              # Suscripción Realtime a eventos
│   └── useMatchClock.ts                  # Reloj en vivo calculado client-side
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # createBrowserClient
│   │   ├── server.ts                     # createServerClient (cookies)
│   │   └── middleware.ts                 # Refresh de sesión
│   ├── queries/
│   │   ├── matches.ts                    # getMatch, getLiveMatches, etc.
│   │   ├── standings.ts                  # getStandings, recalculate
│   │   ├── players.ts                    # getPlayer, getTopScorers
│   │   ├── clubs.ts
│   │   └── divisions.ts
│   └── utils/
│       ├── match-clock.ts                # Calcular minuto actual del partido
│       └── format.ts                     # Formateo de fechas, nombres
│
├── types/
│   └── index.ts                          # Todos los tipos TypeScript
│
├── supabase/
│   ├── schema.sql                        # Schema completo
│   └── seed.sql                          # Datos de ejemplo
│
└── middleware.ts                         # Proteger rutas /admin/*
```

---

## Decisiones técnicas clave

### Realtime (solo Primera y Reserva)
- Supabase Realtime vía `postgres_changes` en tablas `matches` y `match_events`
- El hook `useRealtimeMatch` se activa **solo** cuando `division.has_live_mode = true`
- Las otras divisiones hacen fetch estático/ISR sin suscripciones

### Reloj en vivo
- No se guarda un reloj en DB. Se guardan timestamps (`started_at`, `second_half_at`, etc.)
- El minuto actual se calcula en el cliente: `Math.floor((Date.now() - started_at) / 60000)`
- El hook `useMatchClock` actualiza cada 30 segundos

### Jugadores → Club (no división)
- Un jugador pertenece a un club via `club_id`
- Para saber en qué división juega, se consulta `match_lineups` en los partidos activos
- El plantel completo del club muestra **todos** sus jugadores activos

### Standings
- No hay triggers automáticos (riesgo de inconsistencias)
- El admin puede recalcular standings con `recalculate_tournament_standings(tournament_id)`
- Esta función borra y recalcula desde cero a partir de partidos finalizados

### Auth
- Supabase Auth con email/password para admins
- `middleware.ts` redirige `/admin/*` a `/login` si no hay sesión
- RLS en todas las tablas: lectura pública, escritura solo con rol `admin`

---

## Páginas públicas

### Homepage `/`
- Partidos en vivo (si hay) — destacados
- Próximos partidos (todas las divisiones)
- Últimos resultados
- Links a divisiones

### División `/:division` (ej: `/primera`)
- Resumen: próxima fecha, últimos 3 resultados, top 5 tabla, top 5 goleadores
- Tab/links a: Tabla | Fixture | Goleadores

### Tabla `/:division/tabla`
- Tabla de posiciones completa con PJ, G, E, P, GF, GC, DG, PTS
- Indicadores visuales: zona de ascenso, descenso

### Fixture `/:division/fixture`
- Todas las fechas del torneo activo
- Filtro por fecha/número
- Cada partido muestra estado (programado, en vivo, finalizado)

### Goleadores `/:division/goleadores`
- Ranking con foto, club, goles
- Solo torneo activo

### Partido `/:division/partidos/[id]`
- **Primera y Reserva**: componentes en vivo (LiveScore, LiveClock, MatchTimeline, Formation, MatchLineup, MatchOfficials)
- **Resto de divisiones**: resultado final, árbitro, estadio (sin live)

### Clubes `/clubes`
- Grid de todos los clubes activos

### Club `/clubes/[slug]`
- Info del club
- Plantel completo (todos los jugadores activos del club)
- Historial de partidos

### Jugador `/jugadores/[id]`
- Ficha del jugador
- Estadísticas (partidos, goles, tarjetas) en todos los torneos

---

## Panel Admin

### Dashboard `/admin`
- Partidos de hoy
- Partidos en vivo
- Accesos rápidos a acciones frecuentes

### Control en Vivo `/admin/partidos/[id]/live`
- **Solo accesible para partidos de Primera y Reserva**
- Botones de estado: Iniciar 1°T | Halftime | Iniciar 2°T | Tiempo extra | Finalizar
- Formulario de evento: tipo, minuto, jugador, club
- Preview del timeline en tiempo real
- Control de tiempo adicional

### Gestión de Partidos `/admin/partidos`
- Listado con filtros por división, estado, fecha
- Crear partido: seleccionar división → torneo → fecha → clubes → horario → árbitros

### Gestión de Clubes y Jugadores
- CRUD completo
- Upload de logo/foto a Supabase Storage

### Temporadas `/admin/temporadas`
- Crear temporada → genera automáticamente torneos para todas las divisiones
- Gestión de fechas dentro de cada torneo
