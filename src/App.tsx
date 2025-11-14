import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from './services/socketService';
import { getCurrentSession, resolvePendingSession } from './services/gameBuddiesSession';
import type { GameBuddiesSession } from './services/gameBuddiesSession';
import type { Lobby, ChatMessage } from './types';
import Home from './components/Home';
import LobbyComponent from './components/Lobby';
import GameComponent from './components/GameComponent';
import ChatWindow from './components/ChatWindow';
import PlayerList from './components/PlayerList';
import { BottomTabBar } from './components/BottomTabBar';
import { MobileDrawer } from './components/MobileDrawer';
import { useMobileNavigation } from './hooks/useMobileNavigation';
import { WebRTCProvider } from './contexts/WebRTCContext';
import { WebcamConfigProvider } from './config/WebcamConfig';
import WebcamDisplay from './components/WebcamDisplay';
import { VideoDrawerContent } from './components/VideoDrawerContent';
import { WordHistory } from './components/ui/WordHistory';
import { createGameAdapter } from './adapters/gameAdapter';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import SettingsButton from './components/SettingsButton';
import { SettingsModal } from './components/SettingsModal';
import { backgroundMusic } from './utils/backgroundMusic';
import { soundEffects } from './utils/soundEffects';
// Background components removed for performance - using simple CSS gradients instead
import './App.css';
import './styles/responsive.css';
import './styles/mobile.css';
import './styles/game.css';
import './styles/BottomTabBar.css';
import './styles/MobileDrawer.css';

function AppContent() {
  const { theme } = useTheme();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [gameBuddiesSession, setGameBuddiesSession] = useState<GameBuddiesSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [_isWebcamHidden, _setIsWebcamHidden] = useState(false);
  const [_sessionToken, setSessionToken] = useState<string | null>(null);
  const isReconnecting = useRef(false);

  // Mobile navigation state
  const mobileNav = useMobileNavigation();

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

    socket.on('room:player-joined', (data: { players: any[] }) => {
      console.log('[App] Player joined');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('room:player-left', (data: { players: any[] }) => {
      console.log('[App] Player left');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('room:player-disconnected', (data: { playerId: string; playerName: string; players: any[] }) => {
      console.log(`[App] Player ${data.playerName} disconnected`);
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('room:player-reconnected', (data: { playerId: string; playerName: string; players: any[] }) => {
      console.log(`[App] Player ${data.playerName} reconnected`);
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('room:host-transferred', (data: { oldHostId: string; newHostId: string; oldHostName: string; newHostName: string; players: any[] }) => {
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

    socket.on('room:player-list-update', (data: { players: any[] }) => {
      console.log('[App] Player list updated with scores');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, players: data.players };
      });
    });

    socket.on('room:settings-updated', (data: { settings: any }) => {
      console.log('[App] Settings updated');
      setLobby((prevLobby) => {
        if (!prevLobby) return prevLobby;
        return { ...prevLobby, settings: data.settings };
      });
    });

    socket.on('game:started', (data: { lobby?: Lobby; message?: string }) => {
      console.log('[App] Game started');
      if (data.lobby) {
        setLobby(data.lobby);
      }
    });

    socket.on('game:ended', (data: { lobby?: Lobby; reason?: string; rounds?: any[] }) => {
      console.log('[App] Game ended:', data.reason);
      if (data.lobby) {
        setLobby(data.lobby);
      }
    });

    // ThinkAlike-specific events
    socket.on('roomStateUpdated', (updatedLobby: Lobby) => {
      console.log('[App] Room state updated');
      setLobby(updatedLobby);
      if (updatedLobby.messages) {
        setMessages(updatedLobby.messages);
      }
    });

    socket.on('game:victory', (data: { matchedWord: string; round: number; timeTaken: number }) => {
      console.log('[App] Victory achieved! Word:', data.matchedWord);
      // State update handled by roomStateUpdated
    });

    socket.on('game:no-match', (data: { player1Word: string; player2Word: string; livesRemaining: number }) => {
      console.log('[App] No match. Lives:', data.livesRemaining);
      // State update handled by roomStateUpdated
    });

    socket.on('game:restarted', () => {
      console.log('[App] Game restarted');
      // State update handled by roomStateUpdated
    });

    socket.on('timer:update', (data: { timeRemaining: number }) => {
      // Update timer in real-time
      setLobby((prevLobby) => {
        if (!prevLobby || !prevLobby.gameData) return prevLobby;
        return {
          ...prevLobby,
          gameData: {
            ...prevLobby.gameData,
            timeRemaining: data.timeRemaining
          }
        };
      });
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

    // ThinkAlike state-based rendering
    switch (lobby.state) {
      case 'LOBBY_WAITING':
        return <LobbyComponent lobby={lobby} socket={socketService.getSocket()!} gameBuddiesSession={gameBuddiesSession} />;

      case 'ROUND_PREP':
      case 'WORD_INPUT':
      case 'REVEAL':
        // All active gameplay states use GameComponent
        return <GameComponent lobby={lobby} socket={socketService.getSocket()!} />;

      case 'VICTORY':
      case 'GAME_OVER':
        // Victory and Game Over handled in GameComponent
        return <GameComponent lobby={lobby} socket={socketService.getSocket()!} />;

      default:
        return <div>Unknown game state: {lobby.state}</div>;
    }
  };

  // Control background music based on lobby state
  useEffect(() => {
    if (!lobby) {
      // Stop music when not in a lobby (home page)
      backgroundMusic.stop();
      return;
    }

    const shouldPlayMusic =
      lobby.state === 'LOBBY_WAITING' ||
      lobby.state === 'ROUND_PREP' ||
      lobby.state === 'WORD_INPUT' ||
      lobby.state === 'REVEAL';

    if (shouldPlayMusic) {
      backgroundMusic.play();
    } else if (lobby.state === 'VICTORY' || lobby.state === 'GAME_OVER') {
      // Stop music at end of game
      backgroundMusic.stop();
    }
  }, [lobby?.state, lobby]);

  // Initialize audio preferences on app start
  useEffect(() => {
    // Load background music preference (default: OFF)
    const savedBgMusic = localStorage.getItem('thinkalike-background-music-enabled');
    const bgMusicEnabled = savedBgMusic ? JSON.parse(savedBgMusic) : false;
    backgroundMusic.setEnabled(bgMusicEnabled);

    // Load sound effects preference (default: ON)
    const savedSfx = localStorage.getItem('thinkalike-sound-effects-enabled');
    const sfxEnabled = savedSfx ? JSON.parse(savedSfx) : true;
    soundEffects.setEnabled(sfxEnabled);

    // Load volume preference (default: 50%)
    const savedVolume = localStorage.getItem('thinkalike-volume');
    if (savedVolume) {
      const vol = parseInt(savedVolume, 10);
      soundEffects.setVolume(vol / 100);
      backgroundMusic.setVolume(vol / 100);
    }
  }, []); // Run once on app mount

  const socket = socketService.getSocket();
  const webcamConfig = socket && lobby ? createGameAdapter(socket, lobby.code, lobby) : null;

  return (
    <div className="app-root">
      {/* Simplified static background for better performance */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          background: theme === 'neural-sync'
            ? 'linear-gradient(180deg, #2A1F1F 0%, #3D2F2F 100%)'
            : 'linear-gradient(135deg, #FAF3E0 0%, #FFF8E7 50%, #FFF4E6 100%)',
        }}
      />
      <ThemeToggle />
      <SettingsButton />
        {webcamConfig ? (
          <WebcamConfigProvider config={webcamConfig}>
            <WebRTCProvider>
            <div className="app-layout">
              {/* Webcam Bar - Desktop Only */}
              <div
                className="hidden lg:block p-3"
                style={{
                  background: 'var(--panel-bg)',
                  borderBottom: '1px solid var(--panel-border)',
                }}
              >
                <WebcamDisplay />
              </div>

              {/* Main Layout - Responsive Flex */}
              <div className="flex flex-col lg:flex-row flex-1 min-h-0">

                {/* Main Content - Takes Remaining Space */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
                  {error && (
                    <div className="error-message bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg" style={{ margin: '20px auto', maxWidth: '600px' }}>
                      {error}
                    </div>
                  )}
                  {renderContent()}
                </div>

                {/* Right Sidebar - UTMOST RIGHT on Desktop, Hidden on Mobile */}
                {lobby && (
                  <div
                    className="hidden lg:flex w-full lg:w-96 h-80 lg:h-auto flex-col"
                    style={{
                      borderTop: '1px solid var(--panel-border)',
                      borderLeft: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                    }}
                  >
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
                  </div>
                )}

              </div>
            </div>

            {/* Mobile Navigation Bar - Bottom Tab Bar */}
            {lobby && (
              <BottomTabBar
                activeTab={mobileNav.activeTab}
                onTabChange={(tab) => {
                  mobileNav.setActiveTab(tab);
                  if (tab === 'chat') mobileNav.openDrawer('chat');
                  if (tab === 'players') mobileNav.openDrawer('players');
                  if (tab === 'video') mobileNav.openDrawer('video');
                  if (tab === 'settings') mobileNav.openDrawer('settings');
                  if (tab === 'history') mobileNav.openDrawer('history');
                }}
              />
            )}

            {/* Mobile Drawer - Dynamic Content */}
            {lobby && mobileNav.isDrawerOpen && (
              <MobileDrawer
                isOpen={mobileNav.isDrawerOpen}
                onClose={mobileNav.closeDrawer}
                position="bottom"
                title={
                  mobileNav.drawerContent === 'chat' ? 'Chat' :
                  mobileNav.drawerContent === 'players' ? 'Players' :
                  mobileNav.drawerContent === 'video' ? 'Video' :
                  mobileNav.drawerContent === 'settings' ? 'Settings' :
                  mobileNav.drawerContent === 'history' ? 'History' : ''
                }
              >
                {mobileNav.drawerContent === 'chat' && (
                  <ChatWindow
                    messages={messages}
                    socket={socket!}
                    roomCode={lobby.code}
                  />
                )}
                {mobileNav.drawerContent === 'players' && (
                  <PlayerList
                    players={lobby.players}
                    hostId={lobby.hostId}
                    mySocketId={lobby.mySocketId}
                    roomCode={lobby.code}
                    socket={socket!}
                  />
                )}
                {mobileNav.drawerContent === 'video' && (
                  <VideoDrawerContent players={lobby.players} />
                )}
                {mobileNav.drawerContent === 'settings' && (
                  <div className="p-4">
                    <SettingsModal onClose={mobileNav.closeDrawer} />
                  </div>
                )}
                {mobileNav.drawerContent === 'history' && (
                  <WordHistory rounds={lobby.gameData.rounds} />
                )}
              </MobileDrawer>
            )}
          </WebRTCProvider>
        </WebcamConfigProvider>
      ) : (
        <div className="min-h-screen flex flex-col">
          {error && (
            <div className="error-message bg-orange-500/20 border border-orange-500 text-orange-200 p-4 rounded-lg m-6 max-w-2xl mx-auto">
              {error}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
