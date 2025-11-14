import React from 'react';
import type { Lobby } from '../types';
import type { Socket } from 'socket.io-client';
import GameBuddiesReturnButton from './GameBuddiesReturnButton';
import { TextModeInput } from './game/TextModeInput';
import VoiceModeInput from './game/VoiceModeInput';
import { RevealScreen } from './game/RevealScreen';
import { VictoryScreen } from './game/VictoryScreen';
import { GameOverScreen } from './game/GameOverScreen';
import { LivesDisplay } from './ui/LivesDisplay';
import { WordHistory } from './ui/WordHistory';
import RoundStartOverlay from './overlays/RoundStartOverlay';

interface GameComponentProps {
  lobby: Lobby;
  socket: Socket;
}

const GameComponent: React.FC<GameComponentProps> = ({ lobby, socket }) => {
  const mySocketId = lobby.mySocketId || socket.id;
  const currentPlayer = lobby.players.find(p => p.socketId === mySocketId);
  const isHost = currentPlayer?.isHost || false;

  // ============================================================================
  // GAME ACTIONS
  // ============================================================================

  const handleSubmitWord = (word: string) => {
    console.log('[GameComponent] Submitting word:', word);
    socket.emit('game:submit-word', {
      word: word
    });
  };

  const handleNextRound = () => {
    console.log('[GameComponent] Moving to next round');
    socket.emit('game:next-round');
  };

  const handleRestart = () => {
    if (!isHost) {
      alert('Only the host can restart the game');
      return;
    }

    console.log('[GameComponent] Restarting game');
    socket.emit('game:restart');
  };

  const handleStartRound = () => {
    console.log('[GameComponent] Countdown complete, waiting for server to transition to WORD_INPUT');
    // The server will handle the state transition after the countdown
  };

  // ============================================================================
  // RENDER GAME PHASE
  // ============================================================================

  const renderGamePhase = () => {
    switch (lobby.state) {
      case 'ROUND_PREP':
        return (
          <RoundStartOverlay
            roundNumber={lobby.gameData?.currentRound || 1}
            onComplete={handleStartRound}
          />
        );

      case 'WORD_INPUT':
        return lobby.settings?.voiceMode
          ? <VoiceModeInput lobby={lobby} socket={socket} />
          : <TextModeInput lobby={lobby} onSubmit={handleSubmitWord} />;

      case 'REVEAL':
        return <RevealScreen lobby={lobby} onNextRound={handleNextRound} />;

      case 'VICTORY':
        return <VictoryScreen lobby={lobby} onRestart={handleRestart} />;

      case 'GAME_OVER':
        return <GameOverScreen lobby={lobby} onRestart={handleRestart} />;

      default:
        return (
          <div className="container">
            <p>Unknown game state: {lobby.state}</p>
          </div>
        );
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="game-container flex flex-col lg:flex-row min-h-screen">
      {/* Top status bar - Full width */}
      {lobby.state !== 'VICTORY' && lobby.state !== 'GAME_OVER' && lobby.gameData && (
        <div className="game-status-bar w-full lg:w-full order-1">
          <LivesDisplay
            livesRemaining={lobby.gameData.livesRemaining}
            maxLives={lobby.gameData.maxLives}
          />

          <div className="round-indicator text-sm sm:text-base">
            Round {lobby.gameData.currentRound || 0}
          </div>

          {/* GameBuddies Return Button (Compact icon variant) */}
          {lobby.isGameBuddiesRoom && (
            <GameBuddiesReturnButton
              roomCode={lobby.code}
              socket={socket}
              isHost={isHost}
              variant="icon"
            />
          )}
        </div>
      )}

      {/* Main game content - Flex 1, responsive */}
      <div className="game-main-content flex-1 w-full order-2 lg:order-2 relative">
        {/* Word History - Top Left of game area (Desktop only, mobile uses drawer) */}
        {lobby.state !== 'VICTORY' &&
          lobby.state !== 'GAME_OVER' &&
          lobby.gameData &&
          lobby.gameData.rounds.length > 0 && (
            <div className="absolute top-4 left-4 max-w-sm z-10 hidden lg:block">
              <WordHistory rounds={lobby.gameData.rounds} />
            </div>
          )}

        {renderGamePhase()}
      </div>
    </div>
  );
};

export default GameComponent;
