import React, { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { gameBuddiesReturn } from '../services/gameBuddiesReturn';
import { getCurrentSession } from '../services/gameBuddiesSession';

interface GameBuddiesReturnButtonProps {
  roomCode: string;
  socket: Socket;
  isHost?: boolean;
  players?: Array<{ id?: string; name?: string }>;
  variant?: 'button' | 'icon'; // 'button' for lobby, 'icon' for compact gameplay display
}

const GameBuddiesReturnButton: React.FC<GameBuddiesReturnButtonProps> = ({
  roomCode,
  socket,
  isHost = false,
  players = [],
  variant = 'button'
}) => {
  const [isReturning, setIsReturning] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const handleReturnRedirect = (data: { returnUrl: string }) => {
      console.log('[GameBuddies] Received return-redirect:', data);
      setIsReturning(true);

      // Countdown before redirect
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);

        if (count <= 0) {
          clearInterval(interval);
          window.location.href = data.returnUrl;
        }
      }, 1000);
    };

    socket.on('gamebuddies:return-redirect', handleReturnRedirect);

    return () => {
      socket.off('gamebuddies:return-redirect', handleReturnRedirect);
    };
  }, [socket]);

  const handleReturn = async (mode: 'individual' | 'group' = 'group') => {
    console.log(`[GameBuddies] Return button clicked (mode: ${mode})`);
    setIsReturning(true);
    setShowOptions(false);

    try {
      // Use the new gameBuddiesReturn service
      const result = await gameBuddiesReturn.returnToLobby(
        mode,
        roomCode,
        undefined, // current player will be determined from session
        players
      );

      if (result.success) {
        // Start countdown
        let count = 3;
        const interval = setInterval(() => {
          count--;
          setCountdown(count);

          if (count <= 0) {
            clearInterval(interval);
            gameBuddiesReturn.redirectToLobby(result.returnUrl);
          }
        }, 1000);

        // Also emit to socket for backward compatibility
        socket.emit('gamebuddies:return', {
          roomCode,
          returnAll: mode === 'group',
          reason: 'user_initiated'
        });
      } else {
        console.error('[GameBuddies] Return failed:', result.message);
        setIsReturning(false);
      }
    } catch (error) {
      console.error('[GameBuddies] Error during return:', error);
      setIsReturning(false);
    }
  };

  // Check if launched from GameBuddies
  const session = getCurrentSession();
  const isGameBuddiesLaunched = session?.source === 'gamebuddies';

  // Don't show button if not launched from GameBuddies
  if (!isGameBuddiesLaunched) {
    return null;
  }

  if (isReturning) {
    return (
      <div
        className="gamebuddies-return"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
          Returning to GameBuddies...
        </p>
        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          {countdown}
        </p>
      </div>
    );
  }

  // Show options for host
  if (showOptions && isHost) {
    return (
      <div className="gamebuddies-return" style={{ textAlign: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          maxWidth: '300px',
          margin: '0 auto'
        }}>
          <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>Return Options:</p>
          <button
            onClick={() => handleReturn('group')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%'
            }}
          >
            Return All Players
          </button>
          <button
            onClick={() => handleReturn('individual')}
            style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%'
            }}
          >
            Return Only Me
          </button>
          <button
            onClick={() => setShowOptions(false)}
            style={{
              background: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Icon variant for compact gameplay display (beside lives)
  if (variant === 'icon') {
    return (
      <button
        onClick={() => isHost ? setShowOptions(true) : handleReturn('individual')}
        title="Return to GameBuddies"
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(92, 244, 255, 0.2), rgba(177, 140, 255, 0.2))',
          border: '1px solid rgba(92, 244, 255, 0.4)',
          color: '#5cf4ff',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(92, 244, 255, 0.3), rgba(177, 140, 255, 0.3))';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(92, 244, 255, 0.6)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(92, 244, 255, 0.2), rgba(177, 140, 255, 0.2))';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(92, 244, 255, 0.4)';
        }}
      >
        <span>←</span>
        <span>GameBuddies</span>
      </button>
    );
  }

  // Button variant for lobby display
  return (
    <div className="gamebuddies-return">
      <button
        onClick={() => isHost ? setShowOptions(true) : handleReturn('individual')}
        style={{
          background: 'linear-gradient(135deg, #5cf4ff 0%, #b18cff 100%)',
          color: '#001a1a',
          border: 'none',
          borderRadius: '10px',
          padding: '15px 30px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(92, 244, 255, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(92, 244, 255, 0.5)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px rgba(92, 244, 255, 0.3)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        ← Return to GameBuddies
      </button>
    </div>
  );
};

export default GameBuddiesReturnButton;