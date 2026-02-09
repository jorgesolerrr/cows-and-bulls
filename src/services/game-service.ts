import { supabase } from "@/lib/supabase";
import type {
  Game,
  GamePlayer,
  Guess,
  GameResult,
  MakeGuessResponse,
  StartGameResponse,
  AbandonGameResponse,
  Profile,
} from "@/types";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const gameService = {
  // ── Game CRUD ──────────────────────────────────────

  async createGame(createdBy: string, invitedUserId?: string): Promise<Game> {
    const code = generateCode();
    const { data, error } = await supabase
      .from("games")
      .insert({
        code,
        status: "waiting",
        created_by: createdBy,
        invited_user_id: invitedUserId ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Auto-join as seat 1
    await supabase.from("game_players").insert({
      game_id: data.id,
      user_id: createdBy,
      seat: 1,
    });

    return data as Game;
  },

  async joinGame(gameId: string, userId: string): Promise<GamePlayer> {
    const { data, error } = await supabase
      .from("game_players")
      .insert({
        game_id: gameId,
        user_id: userId,
        seat: 2,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update game status to ready
    await supabase
      .from("games")
      .update({ status: "ready" })
      .eq("id", gameId);

    return data as GamePlayer;
  },

  async joinGameByCode(code: string, userId: string): Promise<{ game: Game; player: GamePlayer }> {
    const { data: game, error } = await supabase
      .from("games")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (error || !game) throw new Error("Game not found or already started");

    const player = await this.joinGame(game.id, userId);
    const updatedGame = { ...game, status: "ready" as const };
    return { game: updatedGame, player };
  },

  async fetchGame(gameId: string): Promise<Game> {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error) throw new Error(error.message);
    return data as Game;
  },

  async fetchPlayers(gameId: string): Promise<GamePlayer[]> {
    const { data, error } = await supabase
      .from("game_players")
      .select("*")
      .eq("game_id", gameId)
      .order("seat", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as GamePlayer[];
  },

  async fetchGuesses(gameId: string): Promise<Guess[]> {
    const { data, error } = await supabase
      .from("guesses")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Guess[];
  },

  // ── Secrets ────────────────────────────────────────

  async setSecret(gameId: string, userId: string, secret: string): Promise<void> {
    const { error } = await supabase
      .from("game_secrets")
      .upsert(
        { game_id: gameId, user_id: userId, secret },
        { onConflict: "game_id,user_id" }
      );

    if (error) throw new Error(error.message);
  },

  async setReady(gameId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("game_players")
      .update({ ready: true })
      .eq("game_id", gameId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  },

  // ── RPC ────────────────────────────────────────────

  async startGame(gameId: string): Promise<StartGameResponse> {
    const { data, error } = await supabase.rpc("start_game", {
      p_game_id: gameId,
    });

    if (error) throw new Error(error.message);
    return data as StartGameResponse;
  },

  async makeGuess(gameId: string, guess: string): Promise<MakeGuessResponse> {
    const { data, error } = await supabase.rpc("make_guess", {
      p_game_id: gameId,
      p_guess: guess,
    });

    if (error) throw new Error(error.message);
    return data as MakeGuessResponse;
  },

  async abandonGame(gameId: string): Promise<AbandonGameResponse> {
    const { data, error } = await supabase.rpc("abandon_game", {
      p_game_id: gameId,
    });

    if (error) throw new Error(error.message);
    return data as AbandonGameResponse;
  },

  // ── History ────────────────────────────────────────

  async fetchHistory(userId: string): Promise<(GameResult & { opponent: Profile | null })[]> {
    const { data, error } = await supabase
      .from("game_results")
      .select("*")
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const results = (data ?? []) as GameResult[];

    // Fetch opponent profiles
    const opponentIds = results.map((r) =>
      r.player1_id === userId ? r.player2_id : r.player1_id
    );
    const uniqueIds = [...new Set(opponentIds)];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", uniqueIds);

    const profileMap = new Map(
      ((profiles ?? []) as Profile[]).map((p) => [p.id, p])
    );

    return results.map((r) => {
      const opponentId = r.player1_id === userId ? r.player2_id : r.player1_id;
      return { ...r, opponent: profileMap.get(opponentId) ?? null };
    });
  },

  // ── Pending invites ────────────────────────────────

  async fetchPendingInvites(userId: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("invited_user_id", userId)
      .eq("status", "waiting");

    if (error) throw new Error(error.message);
    return (data ?? []) as Game[];
  },

  // ── Profile lookup ─────────────────────────────────

  async fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return null;
    return data as Profile;
  },
};
