export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  code: string;
  status: "waiting" | "ready" | "playing" | "finished" | "abandoned";
  created_by: string;
  invited_user_id: string | null;
  current_turn: string | null;
  winner: string | null;
  created_at: string;
  updated_at: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  seat: number;
  ready: boolean;
  joined_at: string;
}

export interface GameSecret {
  game_id: string;
  user_id: string;
  secret: string;
  created_at: string;
}

export interface Guess {
  id: string;
  game_id: string;
  guesser_id: string;
  guess: string;
  bulls: number;
  cows: number;
  created_at: string;
}

export interface GameResult {
  game_id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  status: "finished" | "abandoned";
  turns_count: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface MakeGuessResponse {
  guess_id: string;
  guess: string;
  bulls: number;
  cows: number;
  current_turn: string | null;
  status: string;
  winner: string | null;
}

export interface StartGameResponse {
  game_id: string;
  status: string;
  current_turn: string;
}

export interface AbandonGameResponse {
  game_id: string;
  status: string;
  winner: string | null;
}

export interface OnlinePlayer {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  at: string;
}

export interface GameInvite {
  from_user_id: string;
  from_display_name: string;
  game_id: string;
  game_code: string;
}
