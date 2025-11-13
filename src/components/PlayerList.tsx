import React from 'react';
import type { Socket } from 'socket.io-client';
import type { Player } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface PlayerListProps {
  players: Player[];
  hostId: string;
  mySocketId: string;
  roomCode: string;
  socket: Socket;
  currentTurnPlayerId?: string | null;
  showSkipButton?: boolean;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  mySocketId,
  roomCode,
  socket,
  currentTurnPlayerId,
  showSkipButton = false,
}) => {
  const { theme } = useTheme();
  const isHost = hostId === mySocketId;
  const playerRadius = theme === 'thought-bubble' ? '4% 6% 5% 4% / 1% 1% 2% 4%' : '8px';

  const handleKickPlayer = (playerId: string) => {
    if (!isHost) return;

    if (window.confirm('Are you sure you want to kick this player?')) {
      socket.emit('player:kick', { roomCode, playerId });
    }
  };

  const handleSkipTurn = () => {
    if (!isHost || !currentTurnPlayerId) return;

    if (window.confirm('Are you sure you want to skip this player\'s turn?')) {
      socket.emit('round:skip-turn', { roomCode });
    }
  };

  return (
    <div className="flex-shrink-0 bg-emerald-950/40 p-4 border-b lg:border-b-0 lg:border-r border-emerald-600/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-emerald-300">
          Players ({players.length})
        </h3>
        {isHost && showSkipButton && currentTurnPlayerId && (
          <button
            onClick={handleSkipTurn}
            className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      {/* Players List */}
      <div className="space-y-2 max-h-80 lg:max-h-none overflow-y-auto">
        {players.map((player) => (
          <div
            key={player.socketId}
            className={`flex items-center justify-between p-3 transition-colors ${
              player.socketId === mySocketId
                ? 'bg-emerald-600/40 border border-emerald-500'
                : currentTurnPlayerId === player.socketId
                ? 'bg-teal-600/40 border border-teal-500'
                : 'bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-600/30'
            }`}
            style={{ borderRadius: playerRadius }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Status Dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                player.connected ? 'bg-green-500' : 'bg-red-500'
              }`} />

              {/* Player Info */}
              <div className="min-w-0">
                <div className="text-slate-100 font-medium truncate">
                  {player.name}
                </div>
                <div className="text-sm text-slate-400">
                  Score: {player.score || 0}
                </div>
              </div>
            </div>

            {/* Badges and Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {player.isHost && (
                <span className="text-xs bg-yellow-600/80 text-yellow-100 px-2 py-1 rounded">
                  HOST
                </span>
              )}

              {player.socketId === mySocketId && (
                <span className="text-xs bg-purple-600/80 text-purple-100 px-2 py-1 rounded">
                  YOU
                </span>
              )}

              {currentTurnPlayerId === player.socketId && (
                <span className="text-xs bg-blue-600/80 text-blue-100 px-2 py-1 rounded">
                  ACTIVE
                </span>
              )}

              {isHost && player.socketId !== mySocketId && (
                <button
                  onClick={() => handleKickPlayer(player.socketId)}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Kick
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
