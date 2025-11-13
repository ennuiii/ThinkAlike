// GameBuddies Template - Client Types
// Add your game-specific types here

export type GameState =
  | 'LOBBY_WAITING'  // Waiting in lobby for players
  | 'PLAYING'        // Game in progress
  | 'GAME_ENDED';    // Game finished

export interface Player {
  socketId: string;
  name: string;
  score: number;
  connected: boolean;
  isHost: boolean;
}

export interface Settings {
  minPlayers: number;
  maxPlayers: number;
  // Add your game-specific settings here
  // Example:
  // roundDuration: number;
  // difficulty: 'easy' | 'medium' | 'hard';
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
// GAME DATA - Add your game-specific types here
// ============================================================================

export interface GameData {
  // Add your game-specific properties here
  // Example:
  // currentRound: number;
  // timeRemaining: number;
  // gameState: 'waiting' | 'playing' | 'ended';
}

export interface Lobby {
  code: string;
  hostId: string;
  settings: Settings;
  players: Player[];
  state: GameState;
  gameData: GameData | null; // Your custom game state
  isGameBuddiesRoom: boolean;
  mySocketId: string;
  messages?: ChatMessage[];
}
