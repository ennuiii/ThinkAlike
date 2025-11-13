import React, { useState, useEffect } from 'react';
import type { Lobby } from '../types';
import type { Socket } from 'socket.io-client';
import GameBuddiesReturnButton from './GameBuddiesReturnButton';

/**
 * Game Component Template
 *
 * This is a template for your game component. Replace this with your actual game implementation.
 *
 * Example game types:
 * - 2D Canvas games (drawing, collision detection)
 * - 3D games using Three.js/@react-three/fiber
 * - Turn-based games (card games, board games)
 * - Real-time multiplayer games
 * - Quiz/trivia games
 */

interface GameComponentProps {
  lobby: Lobby;
  socket: Socket;
}

const GameComponent: React.FC<GameComponentProps> = ({ lobby, socket }) => {
  const [gameData, setGameData] = useState<any>(lobby.gameData || null);

  // Use socket.id as fallback if lobby.mySocketId is not set
  const mySocketId = lobby.mySocketId || socket.id;
  const currentPlayer = lobby.players.find(p => p.socketId === mySocketId);
  const isHost = currentPlayer?.isHost || false;

  // ============================================================================
  // SOCKET EVENT LISTENERS
  // ============================================================================

  useEffect(() => {
    // Listen for game state updates from server
    socket.on('game:update', (data: { gameData: any }) => {
      console.log('[GameComponent] Received game update:', data.gameData);
      setGameData(data.gameData);
    });

    // Listen for game ended event
    socket.on('game:ended', (data: { winnerId?: string; winnerName?: string }) => {
      console.log('[GameComponent] Game ended:', data);
    });

    // Add your custom game event listeners here
    // Example:
    // socket.on('game:player-action', (data) => {
    //   console.log('Player action:', data);
    // });

    return () => {
      socket.off('game:update');
      socket.off('game:ended');
      // Remove your custom listeners here
    };
  }, [socket]);

  // ============================================================================
  // GAME LOGIC
  // ============================================================================

  const handleGameAction = () => {
    // Example: Send a game action to the server
    socket.emit('game:action', {
      roomCode: lobby.code,
      action: 'example-action',
      data: {
        // Your action data here
      },
    });
  };

  const handleEndGame = () => {
    if (confirm('Are you sure you want to end the game?')) {
      socket.emit('game:end', { roomCode: lobby.code });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!gameData) {
    return (
      <div className="container">
        <h1>Your Game Title</h1>
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* YOUR GAME CONTENT GOES HERE */}
      <div style={{ padding: '20px' }}>
        <h1>Your Game</h1>
        <p>Room Code: {lobby.code}</p>
        <p>Players: {lobby.players.length}</p>
        <p>You are: {currentPlayer?.name}</p>

        {/* Example game controls */}
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleGameAction} className="button">
            Example Action
          </button>

          {isHost && (
            <button onClick={handleEndGame} className="button danger" style={{ marginLeft: '10px' }}>
              End Game
            </button>
          )}
        </div>

        {/* Add your game UI here */}
        <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }}>
          <h2>Game Area</h2>
          <p>Replace this with your game canvas, board, or UI</p>

          {/* Example: Canvas for 2D games */}
          {/* <canvas id="gameCanvas" width={800} height={600}></canvas> */}

          {/* Example: 3D scene with React Three Fiber */}
          {/* <Canvas>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            // Your 3D objects here
          </Canvas> */}
        </div>
      </div>

      {/* GameBuddies Return Button (appears only for GameBuddies rooms) */}
      {lobby.isGameBuddiesRoom && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
          <GameBuddiesReturnButton roomCode={lobby.code} socket={socket} />
        </div>
      )}
    </div>
  );
};

export default GameComponent;
