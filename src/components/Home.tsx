import React, { useState, useEffect } from 'react';
import { getCurrentSession, resolvePendingSession } from '../services/gameBuddiesSession';
import type { GameBuddiesSession } from '../services/gameBuddiesSession';
import { useTheme } from '../contexts/ThemeContext';

interface HomeProps {
  onCreateRoom: (playerName: string, session: GameBuddiesSession | null) => void;
  onJoinRoom: (roomCode: string, playerName: string, session: GameBuddiesSession | null) => void;
  gameBuddiesSession: GameBuddiesSession | null;
}

const Home: React.FC<HomeProps> = ({ onCreateRoom, onJoinRoom, gameBuddiesSession }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const { theme } = useTheme();
  const inputRadius = theme === 'neural-sync' ? '12px' : '4% 6% 5% 4% / 1% 1% 2% 4%';

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');

    if (joinCode) {
      setRoomCode(joinCode.toUpperCase());
      setMode('join');
      return;
    }

    const session = getCurrentSession();
    if (session) {
      setPlayerName(session.playerName || '');
      setRoomCode(session.roomCode || '');
      console.log('[GameBuddies] Session found, auto-join will be handled by App component');
    } else {
      resolvePendingSession().then(resolved => {
        if (resolved) {
          console.log('[GameBuddies] Pending session resolved in Home component');
        }
      });
    }
  }, [gameBuddiesSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (gameBuddiesSession) {
      onJoinRoom(gameBuddiesSession.roomCode, playerName, gameBuddiesSession);
    } else {
      const resolvedSession = await resolvePendingSession();

      if (resolvedSession) {
        onJoinRoom(resolvedSession.roomCode, playerName, resolvedSession);
      } else if (mode === 'create') {
        onCreateRoom(playerName, gameBuddiesSession);
      } else {
        if (!roomCode.trim()) {
          alert('Please enter a room code');
          return;
        }
        onJoinRoom(roomCode.toUpperCase(), playerName, gameBuddiesSession);
      }
    }
  };

  if (gameBuddiesSession && gameBuddiesSession.playerName) {
    return (
      <div className="home-hero">
        <div className="container home-shell waiting-shell">
          <span className="hero-orb orb-one" aria-hidden="true" />
          <span className="hero-orb orb-two" aria-hidden="true" />

          <div className="home-header">
            <span className="eyebrow">GameBuddies link</span>
            <h1>ThinkAlike</h1>
            <p className="home-tagline">
              Connecting <strong>{gameBuddiesSession.playerName}</strong> to the live room. Get ready to think in sync!
            </p>
          </div>

          <ul className="home-status-grid">
            {!gameBuddiesSession.hideRoomCode && (
              <li>
                <span className="metric-label">Room</span>
                <span className="metric-value">{gameBuddiesSession.roomCode}</span>
              </li>
            )}
            <li>
              <span className="metric-label">Player</span>
              <span className="metric-value">{gameBuddiesSession.playerName}</span>
            </li>
            <li>
              <span className="metric-label">Role</span>
              <span className="metric-value">{gameBuddiesSession.isHost ? 'Host' : 'Player'}</span>
            </li>
            {gameBuddiesSession.isStreamerMode && (
              <li>
                <span className="metric-label">Mode</span>
                <span className="metric-value">ðŸŽ¥ Streamer</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="home-hero">
      <div className="container home-shell">
        <span className="hero-orb orb-one" aria-hidden="true" />
        <span className="hero-orb orb-two" aria-hidden="true" />

        <div className="home-header">
          <span className="eyebrow">Live word sync</span>
          <img
            src="/logo.png"
            alt="Minds thinking alike"
            className="hero-logo"
          />
          <h1>ThinkAlike</h1>
          <p className="home-tagline">
            Team up with your brain twin, think in perfect sync, and trust your instincts before the timer fades.
          </p>
        </div>

        {gameBuddiesSession && (
          <div className="streamer-banner">
            <strong>Streamer Mode</strong>
            <p>Enter your name to appear instantly in the broadcaster&apos;s lobby.</p>
            {!gameBuddiesSession.hideRoomCode && (
              <span className="room-pill">{gameBuddiesSession.roomCode}</span>
            )}
          </div>
        )}

        {!gameBuddiesSession && (
          <div className="mode-toggle-group" role="group" aria-label="Room mode selector">
            <button
              type="button"
              className={`mode-toggle ${mode === 'create' ? 'active' : ''}`}
              onClick={() => setMode('create')}
            >
              Create
            </button>
            <button
              type="button"
              className={`mode-toggle ${mode === 'join' ? 'active' : ''}`}
              onClick={() => setMode('join')}
            >
              Join
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="home-form">
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player nickname"
              maxLength={20}
              required
              style={{ borderRadius: inputRadius }}
            />
          </div>

          {mode === 'join' && (
            <div className="form-group">
              <label>Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={10}
                required
                style={{ borderRadius: inputRadius }}
              />
            </div>
          )}

          <button type="submit" style={{ width: '100%' }}>
            {gameBuddiesSession ? 'Join Room' : mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
