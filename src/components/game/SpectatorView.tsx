import React, { useState, useEffect } from 'react';
import type { Lobby, GameState } from '../../types';
import type { Socket } from 'socket.io-client';

interface SpectatorViewProps {
  lobby: Lobby;
  socket: Socket;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({ lobby, socket }) => {
  const [player1LiveWord, setPlayer1LiveWord] = useState('');
  const [player2LiveWord, setPlayer2LiveWord] = useState('');

  const player1 = lobby.players[0];
  const player2 = lobby.players[1];

  // Listen for live typing updates from server
  useEffect(() => {
    const handleTypingUpdate = (data: { playerIndex: number; playerName: string; word: string }) => {
      if (data.playerIndex === 0) {
        setPlayer1LiveWord(data.word);
      } else {
        setPlayer2LiveWord(data.word);
      }
    };

    socket.on('spectator:typing-update', handleTypingUpdate);

    return () => {
      socket.off('spectator:typing-update', handleTypingUpdate);
    };
  }, [socket]);

  // Reset live words when phase changes
  useEffect(() => {
    if (lobby.state !== 'WORD_INPUT') {
      setPlayer1LiveWord('');
      setPlayer2LiveWord('');
    }
  }, [lobby.state]);

  const gameState = lobby.state as GameState;
  const timeRemaining = lobby.gameData?.timeRemaining || 0;
  const livesRemaining = lobby.gameData?.livesRemaining || 0;
  const currentRound = lobby.gameData?.currentRound || 0;
  const isWordInputPhase = gameState === 'WORD_INPUT';

  return (
    <div className="spectator-view-container px-4 sm:px-6 md:px-8 py-6">
      {/* Spectator Badge */}
      <div className="flex justify-center mb-6">
        <div className="bg-blue-900/40 border border-blue-600/50 px-4 py-2 rounded-lg">
          <p className="text-blue-200 text-sm font-medium">
            👀 Spectator Mode
          </p>
        </div>
      </div>

      {/* Game Info Bar */}
      <div className="flex justify-center gap-6 mb-8 text-slate-300 text-sm">
        <div className="flex items-center gap-2">
          <span>Round:</span>
          <span className="font-semibold text-emerald-300">{currentRound}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Lives:</span>
          <span className="font-semibold text-emerald-300">❤️ {livesRemaining}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Time:</span>
          <span className={`font-semibold ${timeRemaining <= 10 ? 'text-red-400' : 'text-emerald-300'}`}>
            {timeRemaining}s
          </span>
        </div>
      </div>

      {/* Main Game Phase Rendering */}
      {isWordInputPhase ? (
        <>
          {/* Live Words Display */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Player 1 Panel */}
            <div className="flex-1">
              <div className="bg-slate-800/40 border border-slate-600/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">
                  {player1?.name || 'Player 1'}
                </h3>

                {/* Live Word Display */}
                <div className="bg-slate-900/60 border-2 border-slate-600/30 rounded-lg p-6 min-h-24 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-100 break-words">
                      {player1LiveWord || ' '}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center">
                  {player1?.hasSubmitted ? (
                    <div className="inline-block bg-green-600/20 border border-green-600/50 px-3 py-1 rounded">
                      <span className="text-green-300 text-sm font-medium">✓ Submitted</span>
                    </div>
                  ) : (
                    <div className="inline-block bg-amber-600/20 border border-amber-600/50 px-3 py-1 rounded">
                      <span className="text-amber-300 text-sm font-medium">⏳ Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex items-center justify-center md:w-16">
              <div className="text-3xl font-bold text-slate-400 hidden md:block">VS</div>
              <div className="text-2xl font-bold text-slate-400 md:hidden">⚔️</div>
            </div>

            {/* Player 2 Panel */}
            <div className="flex-1">
              <div className="bg-slate-800/40 border border-slate-600/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">
                  {player2?.name || 'Player 2'}
                </h3>

                {/* Live Word Display */}
                <div className="bg-slate-900/60 border-2 border-slate-600/30 rounded-lg p-6 min-h-24 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-100 break-words">
                      {player2LiveWord || ' '}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center">
                  {player2?.hasSubmitted ? (
                    <div className="inline-block bg-green-600/20 border border-green-600/50 px-3 py-1 rounded">
                      <span className="text-green-300 text-sm font-medium">✓ Submitted</span>
                    </div>
                  ) : (
                    <div className="inline-block bg-amber-600/20 border border-amber-600/50 px-3 py-1 rounded">
                      <span className="text-amber-300 text-sm font-medium">⏳ Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="text-center text-slate-400 text-sm">
            <p>Watch both players type in real-time!</p>
          </div>
        </>
      ) : (
        <>
          {/* Game State Message */}
          <div className="text-center">
            {gameState === 'ROUND_PREP' && (
              <div className="text-2xl font-bold text-slate-300 mb-4">
                ⏳ Preparing next round...
              </div>
            )}
            {gameState === 'REVEAL' && (
              <div className="text-2xl font-bold text-slate-300 mb-4">
                📋 Revealing answers...
              </div>
            )}
            {gameState === 'VICTORY' && (
              <div className="text-3xl font-bold text-emerald-400 mb-4">
                🎉 Player matched!
              </div>
            )}
            {gameState === 'GAME_OVER' && (
              <div className="text-3xl font-bold text-red-400 mb-4">
                💔 Game Over!
              </div>
            )}
            {gameState === 'LOBBY_WAITING' && (
              <div className="text-2xl font-bold text-slate-300 mb-4">
                Waiting for game to start...
              </div>
            )}

            {/* Show last round's words if available */}
            {lobby.gameData?.rounds && lobby.gameData.rounds.length > 0 && (
              <div className="mt-8 bg-slate-800/40 border border-slate-600/50 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="text-slate-300 font-semibold mb-4">Last Round</h4>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-slate-100">
                      {lobby.gameData.rounds[lobby.gameData.rounds.length - 1].player1Word}
                    </div>
                  </div>
                  <div className="text-slate-400">vs</div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-slate-100">
                      {lobby.gameData.rounds[lobby.gameData.rounds.length - 1].player2Word}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  {lobby.gameData.rounds[lobby.gameData.rounds.length - 1].wasMatch ? (
                    <span className="text-green-400 font-semibold">✓ MATCH!</span>
                  ) : (
                    <span className="text-red-400 font-semibold">✗ No Match</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
