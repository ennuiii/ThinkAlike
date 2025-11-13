import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from './services/socketService';
import { getCurrentSession, resolvePendingSession, storeSession } from './services/gameBuddiesSession';
import type { GameBuddiesSession } from './services/gameBuddiesSession';
import type { Lobby, ChatMessage } from './types';
import Home from './components/Home';
import LobbyComponent from './components/Lobby';
import GameComponent from './components/GameComponent';
import ChatWindow from './components/ChatWindow';
import PlayerList from './components/PlayerList';
import { WebRTCProvider } from './contexts/WebRTCContext';
import { WebcamConfigProvider } from './config/WebcamConfig';
import WebcamDisplay from './components/WebcamDisplay';
import { createGameAdapter } from './adapters/gameAdapter';
import './App.css';
import './styles/responsive.css';
import './styles/mobile.css';

function App() {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [gameBuddiesSession, setGameBuddiesSession] = useState<GameBuddiesSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isWebcamHidden, setIsWebcamHidden] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const isReconnecting = useRef(false);

  const handleCreateRoom = useCallback((playerName: string, session: GameBuddiesSession | null) => {
    const socket = socketService.getSocket();
    if (socket) {
      setGameBuddiesSession(session);

      if (session?.sessionToken) {
        console.log(`[GameBuddies Client] Creating room with session token: ${session.sessionToken.substring(0, 8)}...`);
      }

      socket.emit('room:create', {
        playerName,
        playerId: session?.playerId,
        roomCode: session?.roomCode,
        isGameBuddiesRoom: !!session,
        sessionToken: session?.sessionToken,
      });
    }
  }, []);

  const handleJoinRoom = useCallback((
    roomCode: string,
    playerName: string,
    session: GameBuddiesSession | null
  ) => {
    const socket = socketService.getSocket();
    if (socket) {
      setGameBuddiesSession(session);

      console.log(`[GameBuddies Client] Joining room: ${roomCode}, Player: ${playerName}`);
      if (session?.sessionToken) {
        console.log(`[GameBuddies Client] Joining with session token: ${session.sessionToken.substring(0, 8)}...`);
      }

      socket.emit('room:join', {
        roomCode,
        playerName,
        playerId: session?.playerId,
      });
    }
  }, []);

  // Attempt to reconnect using session token
  const attemptReconnection = useCallback((token: string) => {
    const socket = socketService.getSocket();
    if (!socket || isReconnecting.current) return;

    console.log('[App] Attempting reconnection with session token');
    isReconnecting.current = true;

    socket.emit('session:reconnect', { sessionToken: token }, (response: any) => {
      isReconnecting.current = false;

      if (response.success) {
        console.log('[App] Reconnection successful');
        setLobby(response.lobby);
        setSessionToken(response.sessionToken);
        setError('');

        // Store session token for future reconnections
        sessionStorage.setItem('gameSessionToken', response.sessionToken);

        // Sync game state
        setTimeout(() => {
          socket.emit('game:sync-state', { roomCode: response.lobby.code }, (syncResponse: any) => {
            if (syncResponse.success) {
              console.log('[App] State synced successfully');
              setLobby(syncResponse.room);
              setMessages(syncResponse.room.messages || []);
            }
          });
        }, 100);
      } else {
        console.error('[App] Reconnection failed:', response.error);
        // Clear invalid session token
        sessionStorage.removeItem('gameSessionToken');
        setSessionToken(null);
      }
    });
  }, []);

  useEffect(() => {
    // Connect to socket
    const socket = socketService.connect();

    socket.on('connect', async () => {
      console.log('[App] Socket connected, setting isConnected = true');
      setIsConnected(true);

      // First check for stored session token for reconnection
      const storedSessionToken = sessionStorage.getItem('gameSessionToken');
      if (storedSessionToken && !isReconnecting.current) {
        console.log('[App] Found stored session token, attempting reconnection');
        attemptReconnection(storedSessionToken);
        return;
      }

      // Check for GameBuddies session and handle async resolution
      let session = getCurrentSession();

      // If no session but we have a pending one, try to resolve it
      if (!session) {
        console.log('[App] No immediate session, checking for pending resolution...');
        session = await resolvePendingSession();
      } else if (session.sessionToken && !session.roomCode) {
        // Session exists but room code is undefined - need to resolve it
        console.log('[App] Session exists but room code is undefined, resolving session token...');
        session = await resolvePendingSession();
      }

      if (session) {
        setGameBuddiesSession(session);
        console.log('[App] GameBuddies session detected after socket connection');

        // Auto-join/create based on session
        if (session.isHost) {
          // Host creates room
          console.log('[App] Auto-creating room as host');
          setTimeout(() => {
            handleCreateRoom(session.playerName || 'Host', session);
          }, 100);
        } else {
          // Player joins room (only if they have a name)
          if (session.playerName) {
            console.log('[App] Auto-joining room as player with name:', session.playerName);
            setTimeout(() => {
              handleJoinRoom(session.roomCode, session.playerName!, session);
            }, 100);
          } else {
            console.log('[App] Player has no name, will show Home component for manual entry');
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('[App] Socket disconnected');
      setIsConnected(false);
    });

    // Listen for lobby events
    socket.on('room:created', (data: { room: Lobby; sessionToken?: string }) => {
      console.log('[App] Room created:', data.room.code);
      setLobby(data.room);
      setMessages(data.room.messages || []);
      setError('');

      // Store session token for reconnection
      if (data.sessionToken) {
        console.log('[App] Storing session token for reconnection');
        setSessionToken(data.sessionToken);
        sessionStorage.setItem('gameSessionToken', data.sessionToken);
      }
    });

    socket.on('room:joined', (data: { room: Lobby; sessionToken?: string }) => {
      console.log('[App] Joined room:', data.room.code);
      setLobby(data.room);
      setMessages(data.room.messages || []);
      setError('');

      // Store session token for reconnection
      if (data.sessionToken) {
        console.log('[App] Storing session token for reconnection');
        setSessionToken(data.sessionToken);
        sessionStorage.setItem('gameSessionToken', data.sessionToken);
      }
    });

    socket.on('lobby:player-joined', (data: { players: any[] }) => {
      console.log('[App] Player joined');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('lobby:player-left', (data: { players: any[] }) => {
      console.log('[App] Player left');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('lobby:player-disconnected', (data: { playerId: string; playerName: string; players: any[] }) => {
      console.log(`[App] Player ${data.playerName} disconnected`);
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('lobby:player-reconnected', (data: { playerId: string; playerName: string; players: any[] }) => {
      console.log(`[App] Player ${data.playerName} reconnected`);
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('lobby:host-transferred', (data: { oldHostId: string; newHostId: string; oldHostName: string; newHostName: string; players: any[] }) => {
      console.log(`[App] Host transferred from ${data.oldHostName} to ${data.newHostName}`);
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return {
          ...prevLobby,
          hostId: data.newHostId,
          players: data.players
        };
      });
    });

    socket.on('lobby:player-list-update', (data: { players: any[] }) => {
      console.log('[App] Player list updated with scores');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('lobby:settings-updated', (data: { settings: any }) => {
      console.log('[App] Settings updated');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, settings: data.settings };
      });
    });

    socket.on('game:started', (data: { lobby: Lobby }) => {
      console.log('[App] Game started');
      setLobby(data.lobby);
    });

    socket.on('game:ended', (data: { lobby: Lobby }) => {
      console.log('[App] Game ended');
      setLobby(data.lobby);
    });

    // Chat events
    socket.on('chat:message', (message: ChatMessage) => {
      console.log('[App] Chat message received:', message);
      setMessages(prev => [...prev, message].slice(-100)); // Keep last 100
    });

    // Error handling
    socket.on('error', (data: { message: string }) => {
      console.error('[App] Error from server:', data.message);
      setError(data.message);
    });

    socket.on('player:kicked', (data: { message: string }) => {
      console.log('[App] Kicked from room:', data.message);
      alert(data.message);
      setLobby(null);
      setError('');
    });

    return () => {
      socketService.disconnect();
    };
  }, [handleCreateRoom, handleJoinRoom, attemptReconnection]);

  const renderContent = () => {
    console.log('[App] renderContent called', { lobby, isConnected });

    if (!isConnected) {
      console.log('[App] Waiting for socket connection');
      return (
        <div className="container">
          <h1>Connecting...</h1>
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>
            Connecting to server...
          </p>
        </div>
      );
    }

    if (!lobby) {
      console.log('[App] Rendering Home component');
      return (
        <Home
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          gameBuddiesSession={gameBuddiesSession}
        />
      );
    }

    console.log('[App] Rendering based on state:', lobby.state);

    // Simple state-based rendering
    switch (lobby.state) {
      case 'LOBBY_WAITING':
        return <LobbyComponent lobby={lobby} socket={socketService.getSocket()!} gameBuddiesSession={gameBuddiesSession} />;

      case 'PLAYING':
        return <GameComponent lobby={lobby} socket={socketService.getSocket()!} />;

      case 'GAME_ENDED':
        // You can create a GameOver component here
        return (
          <div className="container">
            <h1>Game Over!</h1>
            <div className="round-info">
              <h2>Final Scores</h2>
              <ul className="player-list">
                {[...lobby.players].sort((a, b) => b.score - a.score).map((player, index) => (
                  <li key={player.socketId} className="player-item">
                    <span>
                      #{index + 1} {player.name}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{player.score} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      default:
        return <div>Unknown game state: {lobby.state}</div>;
    }
  };

  const socket = socketService.getSocket();
  const webcamConfig = socket && lobby ? createGameAdapter(socket, lobby.code, lobby) : null;

  return (
    <div className="app-root">
      {webcamConfig ? (
        <WebcamConfigProvider config={webcamConfig}>
          <WebRTCProvider>
            <div className="app-layout">
              {!isWebcamHidden && (
                <div className="webcam-top-bar">
                  <WebcamDisplay />
                </div>
              )}
              {/* Webcam toggle button */}
              <button
                onClick={() => setIsWebcamHidden(!isWebcamHidden)}
                className="webcam-toggle-btn"
                title={isWebcamHidden ? "Show Webcam" : "Hide Webcam"}
              >
                {isWebcamHidden ? "📹 Show" : "📹 Hide"}
              </button>
              <div className="main-container">
                <div className="game-content">
                  {error && (
                    <div className="error-message" style={{ margin: '20px auto', maxWidth: '600px' }}>
                      {error}
                    </div>
                  )}
                  {renderContent()}
                </div>
                <div className="right-sidebar">
                  {lobby && (
                    <>
                      <PlayerList
                        players={lobby.players}
                        hostId={lobby.hostId}
                        mySocketId={lobby.mySocketId}
                        roomCode={lobby.code}
                        socket={socket!}
                      />
                      <ChatWindow
                        messages={messages}
                        socket={socket!}
                        roomCode={lobby.code}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </WebRTCProvider>
        </WebcamConfigProvider>
      ) : (
        <div className="app-layout">
          {error && (
            <div className="error-message" style={{ margin: '20px auto', maxWidth: '600px' }}>
              {error}
            </div>
          )}
          {renderContent()}
        </div>
      )}
    </div>
  );
}

export default App;
