# Vacas y Toros (React Native + Supabase) — Guía completa MVP (Broadcast + Presence) + Usuarios + Historial

> Objetivo: construir un MVP **rápido**, **funcional** y **multijugador (2 jugadores)** con React Native y Supabase, usando **Realtime (Broadcast + Presence)** para UX instantánea y Postgres como **fuente de verdad**.

---

## 0) Stack
- **App:** React Native (idealmente Expo para acelerar)
- **Backend:** Supabase
  - Postgres (datos)
  - Auth (usuarios)
  - Realtime (Presence + Broadcast)
  - RPC (funciones en DB para lógica crítica)

---

## 1) Qué es el juego (reglas)
**Vacas y Toros** se juega entre 2 personas:

- Cada jugador elige un **número secreto de 4 cifras**.
- Cada cifra es de **1 a 9** (sin 0).
- Por turnos, cada jugador hace un **intento** con un número de 4 cifras.
- Al intento se le calcula:
  - **Toro (bull):** cifra correcta en **posición correcta**
  - **Vaca (cow):** cifra correcta en **posición incorrecta**
- Gana quien logra **4 toros**.

### Decisión MVP recomendada
- **Sin repetición de cifras** (ej. `1234` válido, `1123` inválido).
  - Validación sencilla
  - Feedback más consistente y menos casos borde

---

## 2) Arquitectura del MVP (simple y robusta)

### 2.1 Persistencia (Postgres = source of truth)
- Tablas principales:
  - `profiles` (usuarios / perfil)
  - `games` (partida actual)
  - `game_players` (jugadores de la partida)
  - `game_secrets` (secreto por jugador)
  - `guesses` (intentos)
- Historial / analítica mínima:
  - `game_results` (resumen final y estadísticas)
  - `user_game_stats` (vista o tabla derivada)

### 2.2 Tiempo real (Realtime: Broadcast + Presence)
- **Presence:** quién está conectado en la partida (online/offline)
- **Broadcast:** eventos de UI y sincronización “instantánea”
- La DB se reconsulta tras eventos importantes (porque Broadcast no persiste y puede perderse)

### 2.3 Integridad y anti-trampas (RPC)
- Toda acción crítica se hace vía RPC:
  - `start_game(game_id)`
  - `make_guess(game_id, guess)`
- El cliente:
  - NO calcula cows/bulls (solo muestra)
  - NO cambia turnos
  - NO inserta guesses directamente

---

## 3) Modelo de datos (Esquema DB)

> Nota: Supabase Auth ya gestiona `auth.users`. Nosotros creamos `profiles` para mostrar nombre, avatar, etc.

### 3.1 Tabla `profiles` (usuarios)
Perfil público y metadata de usuario.

**Campos**
- `id uuid pk` (igual a `auth.uid()`)
- `display_name text`
- `avatar_url text null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

**Buenas prácticas**
- Crear `profiles` automáticamente con un trigger al registrarse
- Mostrar `display_name` en lobby/juego
- Guardar `avatar_url` si usas Storage

---

### 3.2 Tabla `games` (partida)
Estado global de la sala.

**Campos**
- `id uuid pk default gen_random_uuid()`
- `code text unique not null` (código corto para unirse)
- `status text not null` (`waiting`, `ready`, `playing`, `finished`, `abandoned`)
- `created_by uuid not null` (auth.uid)
- `current_turn uuid null` (auth.uid del jugador en turno)
- `winner uuid null` (auth.uid)
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

**Notas**
- `abandoned` si alguien se va (opcional para MVP, pero útil)

---

### 3.3 Tabla `game_players` (jugadores)
Relación juego ↔ usuario, máximo 2 jugadores.

**Campos**
- `id uuid pk default gen_random_uuid()`
- `game_id uuid not null references games(id) on delete cascade`
- `user_id uuid not null` (auth.uid)
- `seat int not null` (1 o 2)
- `ready boolean not null default false`
- `joined_at timestamptz default now()`

**Constraints**
- unique `(game_id, user_id)`
- unique `(game_id, seat)`

---

### 3.4 Tabla `game_secrets` (secreto por jugador)
Número secreto (4 dígitos). Debe ser privado.

**Campos**
- `game_id uuid not null references games(id) on delete cascade`
- `user_id uuid not null`
- `secret text not null`  *(MVP: en claro, protegido por RLS; cálculo solo por RPC)*
- `created_at timestamptz default now()`

**PK**
- pk `(game_id, user_id)`

**Nota de seguridad**
- En producción: encriptar/hashear con estrategia robusta.
- En MVP: secreto en claro **pero**:
  - RLS: solo owner puede leer
  - RPC (security definer) puede leer para calcular

---

### 3.5 Tabla `guesses` (intentos)
Historial de intentos (visible para ambos).

**Campos**
- `id uuid pk default gen_random_uuid()`
- `game_id uuid not null references games(id) on delete cascade`
- `guesser_id uuid not null`
- `guess text not null` (4 chars, `1-9`)
- `bulls int not null`
- `cows int not null`
- `created_at timestamptz default now()`

**Índices recomendados**
- index `(game_id, created_at)`
- index `(game_id, guesser_id, created_at)`

---

## 4) Historial de juegos (Game History)

### 4.1 Tabla `game_results` (resumen final)
Se escribe **cuando termina** una partida (o se abandona). Útil para historial y métricas.

**Campos**
- `game_id uuid pk references games(id) on delete cascade`
- `player1_id uuid not null`
- `player2_id uuid not null`
- `winner_id uuid null`
- `status text not null` (`finished`, `abandoned`)
- `turns_count int not null default 0` *(total de intentos)*
- `duration_seconds int null` *(opcional)*
- `created_at timestamptz default now()` *(momento en que se cerró)*

**Cómo llenar**
- En RPC `make_guess`: si bulls=4 → inserta/actualiza `game_results`
- Si se abandona: RPC `abandon_game` (opcional MVP) inserta `status=abandoned`

---

### 4.2 Vista o tabla `user_game_stats` (opcional)
Para MVP, puedes crear una **VIEW** que compute stats a partir de `game_results`.
Ejemplos:
- juegos jugados
- ganados
- perdidos
- tasa de victoria
- promedio de turnos

**Ejemplo de campos en una VIEW**
- `user_id`
- `games_played`
- `games_won`
- `games_lost`
- `win_rate`
- `avg_turns`

> Recomendación MVP: empieza con `game_results` y una consulta SQL simple. La VIEW la agregas luego.

---

## 5) Seguridad y RLS (Supabase best practices)

### 5.1 Principios
- Activa **RLS** en todas las tablas públicas
- “Solo participantes” pueden ver partidas y guesses
- `game_secrets` solo visible para el owner
- Actualizaciones críticas solo por RPC

### 5.2 Reglas recomendadas (concepto)
- `profiles`
  - `SELECT`: público (o solo autenticados)
  - `UPDATE`: solo owner (`id = auth.uid()`)
- `games`
  - `SELECT`: solo si el usuario es miembro en `game_players`
  - `INSERT`: usuario autenticado
  - `UPDATE`: bloquear desde cliente (solo RPC)
- `game_players`
  - `SELECT`: solo miembros del juego
  - `INSERT`: autenticado; solo si hay asiento libre
  - `UPDATE`: solo owner (para `ready`), o por RPC
- `game_secrets`
  - `SELECT/INSERT/UPDATE`: solo owner (`user_id = auth.uid()`)
- `guesses`
  - `SELECT`: solo miembros del juego
  - `INSERT`: **solo RPC** (recomendado)

---

## 6) RPC (funciones) — lógica del juego en backend

> Estas funciones son el “corazón” del MVP. Mantienen integridad, turnos y anti-trampas.

### 6.1 Validaciones comunes
- `guess` debe cumplir `^[1-9]{4}$`
- si no repetidas: set de dígitos debe tener tamaño 4
- el usuario debe ser miembro del juego
- el juego debe estar en `playing`
- debe ser el turno del usuario

### 6.2 `start_game(game_id)`
**Responsabilidad**
- Verificar 2 jugadores
- Verificar ambos `ready=true`
- Verificar ambos tienen `game_secrets`
- Set:
  - `games.status = 'playing'`
  - `games.current_turn = player seat=1` (o aleatorio para MVP)

**Qué retorna**
- Estado actualizado de `games`

### 6.3 `make_guess(game_id, guess)`
**Responsabilidad**
1. Validar membership y turno
2. Obtener secreto del rival (desde `game_secrets`) sin exponerlo al cliente
3. Calcular `bulls/cows`
4. Insertar fila en `guesses`
5. Actualizar turno o finalizar:
   - Si `bulls=4`:
     - `games.status='finished'`
     - `games.winner=auth.uid()`
     - Insert/Upsert en `game_results`
   - Else:
     - `games.current_turn = other_player_id`

**Qué retorna**
- `{ guess_id, bulls, cows, current_turn, status, winner }`

### 6.4 (Opcional MVP) `abandon_game(game_id)`
- Marca `games.status='abandoned'`
- Inserta `game_results.status='abandoned'`

---

## 7) Realtime con Broadcast + Presence (obligatorio en este documento)

### 7.1 Canal por juego
- Nombre: `game:${gameId}`

### 7.2 Presence
Objetivo: saber si el rival está online y mostrarlo en lobby/juego.

- Presence key: `auth.uid()`
- Payload recomendado:
  - `user_id`
  - `seat`
  - `display_name`
  - `at` (timestamp)

### 7.3 Broadcast
Objetivo: eventos instantáneos de UI/sincronización.

Eventos recomendados:
- `player_joined`
- `player_ready`
- `game_started`
- `guess_made`
- `turn_changed`
- `game_finished`
- `typing` (opcional)

**Regla clave**
> Cada vez que recibes un evento importante: **refresca** estado desde DB (source of truth).  
> Broadcast puede perder mensajes si hay reconexiones.

---

## 8) Contratos de eventos Broadcast

### `player_joined`
```json
{ "user_id": "uuid" }
````

### `player_ready`

```json
{ "user_id": "uuid", "ready": true }
```

### `game_started`

```json
{ "game_id": "uuid", "current_turn": "uuid" }
```

### `guess_made`

```json
{ "game_id": "uuid", "guess_id": "uuid", "guesser_id": "uuid" }
```

### `turn_changed`

```json
{ "game_id": "uuid", "current_turn": "uuid" }
```

### `game_finished`

```json
{ "game_id": "uuid", "winner_id": "uuid" }
```

### `typing` (opcional)

```json
{ "user_id": "uuid", "is_typing": true }
```

---

## 9) Flujo funcional (end-to-end)

### 9.1 Crear partida

1. `INSERT games (status='waiting', code, created_by)`
2. `INSERT game_players (seat=1)`
3. Suscribirse a canal Realtime `game:${gameId}`
4. `presence.track(...)`
5. `broadcast player_joined`

### 9.2 Unirse por código

1. `SELECT games WHERE code = :code`
2. `INSERT game_players (seat=2)` (si disponible)
3. Join Realtime + presence.track
4. `broadcast player_joined`
5. Cuando haya 2 jugadores: `UPDATE games.status='ready'` (ideal vía RPC simple)

### 9.3 Definir secreto + listo

1. Validar secreto en cliente
2. `UPSERT game_secrets (game_id, user_id, secret)`
3. `UPDATE game_players.ready=true`
4. `broadcast player_ready`
5. Si ambos listos: `RPC start_game(game_id)` y `broadcast game_started`

### 9.4 Realizar intento

1. Cliente valida guess
2. `RPC make_guess(game_id, guess)`
3. `broadcast guess_made`
4. Según retorno:

   * si cambió turno: `broadcast turn_changed`
   * si finalizó: `broadcast game_finished`

---

## 10) React Native — Estructura recomendada (MVP)

### 10.1 Carpetas sugeridas

* `src/lib/supabase.ts` (cliente supabase)
* `src/services/GameService.ts` (CRUD + RPC)
* `src/realtime/useGameChannel.ts` (Realtime: presence + broadcast)
* `src/store/gameStore.ts` (zustand o reducer)
* `src/screens/Home.tsx`
* `src/screens/Lobby.tsx`
* `src/screens/Game.tsx`
* `src/screens/History.tsx` (historial)

### 10.2 GameService (responsabilidades)

* `createGame()`
* `joinGame(code)`
* `fetchGame(gameId)`
* `fetchPlayers(gameId)`
* `fetchGuesses(gameId)`
* `setSecret(gameId, secret)`
* `startGame(gameId)` (RPC)
* `makeGuess(gameId, guess)` (RPC)
* `fetchHistory(userId)` (desde `game_results`)

### 10.3 Estado mínimo

* `session.user`
* `profile`
* `game`
* `players`
* `guesses`
* `presenceState` (online/offline)
* `ui: typing, errors, loading`

---

## 11) Ejemplo de Realtime (Presence + Broadcast) — pseudocódigo

> API exacta depende de versión de `@supabase/supabase-js`. Mantén el patrón: **subscribe → track → on(broadcast/presence)**.

```ts
import { supabase } from "../lib/supabase";

export function subscribeToGameChannel(gameId: string, user: { id: string; display_name?: string }) {
  const channel = supabase.channel(`game:${gameId}`, {
    config: { presence: { key: user.id } },
  });

  // Presence
  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    // Actualiza store: connected users
  });

  channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
    // UX: "player online"
  });

  channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
    // UX: "player offline"
  });

  // Broadcast events
  channel.on("broadcast", { event: "player_joined" }, async () => {
    await fetchPlayers(gameId);
    await fetchGame(gameId);
  });

  channel.on("broadcast", { event: "player_ready" }, async () => {
    await fetchPlayers(gameId);
  });

  channel.on("broadcast", { event: "game_started" }, async () => {
    await fetchGame(gameId);
    await fetchGuesses(gameId);
  });

  channel.on("broadcast", { event: "guess_made" }, async () => {
    await fetchGuesses(gameId);
    await fetchGame(gameId); // turno / winner
  });

  channel.on("broadcast", { event: "turn_changed" }, async () => {
    await fetchGame(gameId);
  });

  channel.on("broadcast", { event: "game_finished" }, async () => {
    await fetchGame(gameId);
    await fetchGuesses(gameId);
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        user_id: user.id,
        display_name: user.display_name ?? null,
        at: new Date().toISOString(),
      });

      await channel.send({
        type: "broadcast",
        event: "player_joined",
        payload: { user_id: user.id },
      });
    }
  });

  return channel;
}
```

---

## 12) Pantalla Historial (Game History)

### 12.1 Consulta recomendada

Mostrar los últimos N juegos del usuario:

* juegos donde el usuario fue `player1_id` o `player2_id`
* ordenar por `created_at desc`
* mostrar:

  * rival (nombre)
  * resultado (win/lose/abandoned)
  * turnos
  * fecha

### 12.2 Datos necesarios para UI

* `game_results`
* join con `profiles` para nombres/avatars

---

## 13) Validaciones (cliente y servidor)

### 13.1 Validación de secreto/guess (cliente)

* Debe ser string de 4 chars
* Regex: `^[1-9]{4}$`
* Sin repetidas: usar set

### 13.2 Validación (servidor / RPC)

* Repetir validaciones críticas en RPC
* Rechazar si:

  * no es tu turno
  * juego no está en `playing`
  * no eres miembro
  * guess inválido

---

## 14) Buenas prácticas Supabase

* RLS siempre ON en tablas públicas
* RPC para acciones críticas (turnos/cálculos)
* Realtime (broadcast/presence) para UX, DB para verdad
* Manejar reconexión: re-subscribe y re-fetch
* Índices por `game_id` y `created_at` para performance
* Códigos cortos de juegos: evitar colisiones con unique + reintento

---

## 15) Buenas prácticas React Native

* Deshabilitar input si no es tu turno
* UI clara del estado:

  * “Esperando rival”
  * “Rival online/offline”
  * “Tu turno / turno rival”
* Manejar errores RPC y mostrar mensajes útiles
* Persistir `gameId` y `code` localmente para re-entrar rápido
* Separar lógica de red (services) de UI (screens)

---

## 16) Checklist MVP

### Backend (Supabase)

* [ ] Auth habilitado
* [ ] `profiles` + trigger (opcional) para auto-crear perfil
* [ ] Tablas: `games`, `game_players`, `game_secrets`, `guesses`
* [ ] Historial: `game_results`
* [ ] RLS + policies “solo miembros”
* [ ] RPC: `start_game`, `make_guess` (y opcional `abandon_game`)
* [ ] Índices básicos

### App (React Native)

* [ ] Auth
* [ ] Crear/unirse por código
* [ ] Lobby con Presence
* [ ] Set secreto + ready
* [ ] Game: turnos + guesses + resultado
* [ ] Broadcast de eventos + re-fetch de DB
* [ ] Pantalla Historial (game_results)

---

## 17) Roadmap post-MVP

* Encriptar secreto o estrategia de seguridad avanzada
* Rematch / matchmaking
* Ranking (ELO)
* Chat por broadcast
* Notificaciones push
* Anti-abandono (timeout y auto-win)

---

FIN.

```
::contentReference[oaicite:0]{index=0}
```
