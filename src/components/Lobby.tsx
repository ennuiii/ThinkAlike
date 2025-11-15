import React, { useState } from 'react';
import { Video, Lock, AlertTriangle, Rocket } from 'lucide-react';
import type { Lobby as LobbyType, Player, Settings } from '../types';
import type { Socket } from 'socket.io-client';
import type { GameBuddiesSession } from '../services/gameBuddiesSession';
import GameBuddiesReturnButton from './GameBuddiesReturnButton';
import { useTheme } from '../contexts/ThemeContext';

interface LobbyProps {
  lobby: LobbyType;
  socket: Socket;
  gameBuddiesSession?: GameBuddiesSession | null;
}

const Lobby: React.FC<LobbyProps> = ({ lobby, socket, gameBuddiesSession }) => {
  const [settings, setSettings] = useState<Settings>(lobby.settings);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const myPlayer = lobby.players.find(p => p.socketId === lobby.mySocketId);
  const isHost = myPlayer?.isHost || false;
  const isReady = myPlayer?.isReady || false;
  const hideRoomCode = gameBuddiesSession?.hideRoomCode || false;

  // Theme-specific border radius for neural-sync theme
  const cardRadius = theme === 'neural-sync' ? '12px' : '4% 6% 5% 4% / 1% 1% 2% 4%';

  // Check if exactly 2 players and both are ready
  const hasExactlyTwoPlayers = lobby.players.length === 2;
  const allPlayersReady = lobby.players.every(p => p.isReady);
  const canStartGame = hasExactlyTwoPlayers && allPlayersReady && isHost;

  const handleCopyJoinLink = () => {
    const baseUrl = window.location.origin;
    const basePath = import.meta.env.BASE_URL || '/';
    let joinUrl: string;

    if (hideRoomCode && gameBuddiesSession?.sessionToken) {
      // For streamer mode, create a player invite link
      const invitePlayerId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

      const params = new URLSearchParams({
        session: gameBuddiesSession.sessionToken,
        players: lobby.settings.maxPlayers.toString(),
        playerId: invitePlayerId,
      });
      joinUrl = `https://gamebuddies.io/thinkalike?${params.toString()}`;
    } else {
      // For regular mode, use the join link with room code
      joinUrl = `${baseUrl}${basePath}?join=${lobby.code}`;
    }

    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      if (hideRoomCode) {
        alert('Failed to copy invite link.');
      } else {
        alert('Failed to copy link. Room code: ' + lobby.code);
      }
    });
  };

  const handleStartGame = () => {
    if (canStartGame) {
      socket.emit('game:start');
    }
  };

  const handleToggleReady = () => {
    socket.emit('player:ready', { ready: !isReady });
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    socket.emit('settings:update', { settings: updatedSettings });
  };

  const handleKickPlayer = (playerId: string) => {
    if (confirm('Are you sure you want to kick this player?')) {
      socket.emit('player:kick', { playerId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs tracking-[0.45em] uppercase text-[color:var(--text-muted)]">
          Lobby sync
        </p>
        <h1
          className="text-5xl font-black text-transparent bg-clip-text uppercase tracking-[0.2em] mb-1"
          style={{ backgroundImage: 'linear-gradient(120deg, var(--secondary), var(--primary-light))' }}
        >
          ThinkAlike
        </h1>
        <p className="text-lg text-[color:var(--text-secondary)]">
          Think the same word. Stay in sync.
        </p>
      </div>

      {/* Room Code / Streamer Mode Card */}
      <div
        className="bg-emerald-950/40 border border-emerald-600/50 p-6 shadow-xl shadow-emerald-900/20"
        style={{ borderRadius: cardRadius }}
      >
        <h3 className="text-xl font-semibold text-emerald-300 mb-4">
          {hideRoomCode ? (
            <span className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Streamer Mode
            </span>
          ) : (
            'Room Code'
          )}
        </h3>

        {!hideRoomCode ? (
          <>
            <div className="text-5xl font-sans font-bold text-center mb-4 tracking-widest" style={{
              color: 'var(--primary)',
              textShadow: `0 0 20px var(--primary), 0 0 40px var(--primary), 2px 2px 4px rgba(0, 0, 0, 0.5)`,
              letterSpacing: '0.15em',
              textTransform: 'uppercase'
            }}>
              {lobby.code}
            </div>
            <p className="text-slate-300 text-center mb-4">
              Share this code with your opponent!
            </p>
          </>
        ) : (
          <>
            <p className="text-emerald-300 text-lg text-center mb-4">
              Room is ready for streaming
            </p>
            <p className="text-slate-300 text-center mb-4">
              Invite players using the safe invite link below:
            </p>
          </>
        )}

        <button
          onClick={handleCopyJoinLink}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 uppercase tracking-[0.15em] ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
          }`}
        >
          {copied ? '✓ ' + (hideRoomCode ? 'Invite Copied!' : 'Link Copied!') : (hideRoomCode ? 'Copy Invite Link' : 'Copy Join Link')}
        </button>

        {hideRoomCode && (
          <p className="text-slate-500 text-sm text-center mt-3">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Link doesn't reveal room code - safe for streaming!
            </span>
          </p>
        )}
      </div>

      {/* Players Card */}
      <div
        className="bg-emerald-950/40 border border-emerald-600/50 p-6 shadow-xl shadow-emerald-900/20"
        style={{ borderRadius: cardRadius }}
      >
        <h2 className="text-xl font-semibold text-emerald-300 mb-4 flex items-center justify-between">
          <span>
            Players ({lobby.players.length}/2)
            {lobby.spectators && lobby.spectators.length > 0 && (
              <span className="text-slate-400 ml-3 text-sm">
                + {lobby.spectators.length} spectator{lobby.spectators.length !== 1 ? 's' : ''}
              </span>
            )}
          </span>
          {!hasExactlyTwoPlayers && (
            <span className="text-sm font-normal text-amber-400">
              Need exactly 2 players
            </span>
          )}
        </h2>

        <div className="space-y-3">
          {lobby.players.map((player: Player) => (
            <div
              key={player.socketId}
              className="flex items-center justify-between p-4 bg-emerald-900/30 rounded-lg border border-emerald-600/30 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  player.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div className="min-w-0">
                  <div className="text-slate-100 font-medium">
                    {player.name}
                    {!player.connected && ' (disconnected)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {player.isHost && (
                  <span className="text-xs bg-yellow-600/80 text-yellow-100 px-2 py-1 rounded">
                    HOST
                  </span>
                )}

                {player.isReady ? (
                  <span className="text-sm font-semibold text-green-400">
                    ✓ Ready
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">
                    Not Ready
                  </span>
                )}

                {isHost && !player.isHost && (
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

        {/* Spectators Section */}
        {lobby.spectators && lobby.spectators.length > 0 && (
          <div className="mt-6 pt-6 border-t border-emerald-600/30">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              👀 Spectators ({lobby.spectators.length})
            </h3>
            <div className="space-y-2">
              {lobby.spectators.map((spectator: Player) => (
                <div
                  key={spectator.socketId}
                  className="flex items-center gap-2 p-3 bg-slate-800/40 rounded border border-slate-600/30"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    spectator.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="min-w-0">
                    <div className="text-slate-200 text-sm">
                      {spectator.name}
                      {!spectator.connected && ' (disconnected)'}
                    </div>
                  </div>
                  <span className="text-xs bg-blue-600/60 text-blue-100 px-2 py-1 rounded ml-auto flex-shrink-0">
                    SPECTATING
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spectator Notice */}
      {lobby.isSpectator && (
        <div className="bg-blue-900/40 border border-blue-600/50 p-4 rounded-lg text-center">
          <p className="text-blue-200 text-sm">
            👀 You are spectating this game. You can watch but not participate.
          </p>
        </div>
      )}

      {/* Ready Button - Only if not spectator */}
      {!lobby.isSpectator && (
        <button
          onClick={handleToggleReady}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 uppercase tracking-[0.15em] ${
            isReady
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
          }`}
        >
          {isReady ? '✓ Ready' : 'Ready Up!'}
        </button>
      )}

      {/* Start Game Button (Host Only) */}
      {isHost && !lobby.isSpectator && (
        <button
          onClick={handleStartGame}
          disabled={!canStartGame}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 uppercase tracking-[0.15em] ${
            canStartGame
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white hover:scale-105 shadow-lg shadow-emerald-500/50'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          {!hasExactlyTwoPlayers
            ? (
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Need 2 Players
              </span>
            )
            : !allPlayersReady
            ? (
              <span className="flex items-center gap-2">
                ⏳
                <span>Waiting for Ready...</span>
              </span>
            )
            : (
              <span className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Start Game!
              </span>
            )}
        </button>
      )}

      {/* GameBuddies Return Button (Inline) */}
      {lobby.isGameBuddiesRoom && (
        <GameBuddiesReturnButton
          roomCode={lobby.code}
          socket={socket}
          isHost={isHost}
          variant="button"
        />
      )}

      {/* Settings Section (Collapsible) */}
      {isHost && (
        <div
          className="bg-emerald-950/30 border border-emerald-600/40 overflow-hidden"
          style={{ borderRadius: cardRadius }}
        >
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full p-6 flex items-center justify-between hover:bg-emerald-900/40 transition-colors"
          >
            <h3 className="text-lg font-semibold text-emerald-300">Game Settings</h3>
            <span className="text-slate-400">
              {showSettings ? '▲' : '▼'}
            </span>
          </button>

          {showSettings && (
            <div className="p-6 border-t border-slate-700 space-y-6">
              {/* Timer Duration */}
              <div>
                <label className="block text-slate-300 font-medium mb-3">
                  Timer Duration: <span className="text-emerald-400 font-bold">{settings.timerDuration}s</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="10"
                  value={settings.timerDuration}
                  onChange={(e) => handleSettingChange('timerDuration', parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-emerald-600 mt-2">
                  <span>30s</span>
                  <span>180s</span>
                </div>
              </div>

              {/* Shared Lives */}
              <div>
                <label className="block text-slate-300 font-medium mb-3">
                  Shared Lives: <span className="text-emerald-400 font-bold">{settings.maxLives}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={settings.maxLives}
                  onChange={(e) => handleSettingChange('maxLives', parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Voice Mode */}
              <div className="flex items-center justify-between p-4 bg-emerald-900/20 rounded-lg border border-emerald-600/30">
                <div className="flex-1">
                  <label className="block text-slate-300 font-medium mb-1">
                    Voice Mode
                  </label>
                  <p className="text-xs text-slate-400">
                    Players say words in voice chat instead of typing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.voiceMode || false}
                  onChange={(e) => handleSettingChange('voiceMode', e.target.checked)}
                  className="w-6 h-6 cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Lobby;
