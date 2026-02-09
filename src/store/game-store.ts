import { create } from "zustand";
import type { Game, GamePlayer, Guess, GameInvite, OnlinePlayer } from "@/types";
import { destroyGameChannel } from "@/lib/game-channel-registry";

interface GameState {
  // Current game
  game: Game | null;
  players: GamePlayer[];
  guesses: Guess[];
  mySecret: string | null;

  // Lobby
  onlinePlayers: OnlinePlayer[];
  pendingInvite: GameInvite | null;
  sentInviteGameId: string | null;

  // UI
  loading: boolean;
  error: string | null;

  // Actions
  setGame: (game: Game | null) => void;
  setPlayers: (players: GamePlayer[]) => void;
  setGuesses: (guesses: Guess[]) => void;
  setMySecret: (secret: string | null) => void;
  setOnlinePlayers: (players: OnlinePlayer[]) => void;
  setPendingInvite: (invite: GameInvite | null) => void;
  setSentInviteGameId: (gameId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetGame: () => void;
  reset: () => void;
}

const initialState = {
  game: null,
  players: [],
  guesses: [],
  mySecret: null,
  onlinePlayers: [],
  pendingInvite: null,
  sentInviteGameId: null,
  loading: false,
  error: null,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setGame: (game) => set({ game }),
  setPlayers: (players) => set({ players }),
  setGuesses: (guesses) => set({ guesses }),
  setMySecret: (secret) => set({ mySecret: secret }),
  setOnlinePlayers: (players) => set({ onlinePlayers: players }),
  setPendingInvite: (invite) => set({ pendingInvite: invite }),
  setSentInviteGameId: (gameId) => set({ sentInviteGameId: gameId }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetGame: () => {
    // Destroy the singleton channel for this game before clearing state.
    const gameId = get().game?.id;
    if (gameId) {
      destroyGameChannel(gameId);
    }
    set({
      game: null,
      players: [],
      guesses: [],
      mySecret: null,
      sentInviteGameId: null,
      loading: false,
      error: null,
    });
  },
  reset: () => set(initialState),
}));
