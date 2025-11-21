// ThinkAlike - Client Types
// 1v1 word synchronization game where players share 5 lives

export type GameState =
  | 'LOBBY_WAITING'   // Waiting in lobby for players
  | 'ROUND_PREP'      // 3-second countdown before word input
  | 'WORD_INPUT'      // Players entering their words
  | 'REVEAL'          // Words revealed, showing match/no-match
  | 'VICTORY'         // Players achieved a match (win!)
  | 'GAME_OVER';      // All lives lost (lose)

export interface Player {
  socketId: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  disconnectedAt?: number;
  // ThinkAlike-specific fields
  isReady: boolean;
  isSpectator: boolean;  // true if player is spectating (3rd+ player)
  currentWord: string | null;  // Hidden from opponent until both submit
  hasSubmitted: boolean;
  score?: number;  // Player score
  premiumTier?: 'free' | 'monthly' | 'lifetime';  // Premium tier
}

export interface Settings {
  minPlayers: number;  // Always 2 for ThinkAlike
  maxPlayers: number;  // Always 2 for ThinkAlike
  timerDuration: number;  // Seconds per round (default: 60)
  maxLives: number;       // Shared lives pool (default: 5)
  voiceMode: boolean;     // Players say words out loud instead of typing (default: false)
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

// ============================================================================
// GAME DATA - ThinkAlike specific game state
// ============================================================================

export interface Round {
  number: number;
  player1Word: string;
  player2Word: string;
  wasMatch: boolean;
  timeTaken: number;  // Seconds
  timestamp: number;  // Unix timestamp
}

export interface GameData {
  currentRound: number;
  maxRounds: number;  // Not enforced, just for tracking
  livesRemaining: number;
  maxLives: number;
  timeRemaining: number;  // Seconds
  rounds: Round[];  // History of all previous rounds
  settings: {
    timerDuration: number;
    maxLives: number;
  };
}

export interface Lobby {
  code: string;
  hostId: string;
  settings: Settings;
  players: Player[];  // Active players only (first 2)
  spectators?: Player[];  // Spectators (3rd+ players)
  state: GameState;
  gameData: GameData | null; // Your custom game state
  isGameBuddiesRoom: boolean;
  isSpectator: boolean;  // true if you are spectating
  mySocketId: string;
  messages?: ChatMessage[];
}
