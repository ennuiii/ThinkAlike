import React, { useState, useEffect } from 'react';
import type { Lobby } from '../../types';

interface TextModeInputProps {
  lobby: Lobby;
  onSubmit: (word: string) => void;
}

export const TextModeInput: React.FC<TextModeInputProps> = ({ lobby, onSubmit }) => {
  const [word, setWord] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const myPlayer = lobby.players.find(p => p.socketId === lobby.mySocketId);
  const opponentPlayer = lobby.players.find(p => p.socketId !== lobby.mySocketId);

  useEffect(() => {
    // Reset when moving to new round
    if (!myPlayer?.hasSubmitted) {
      setWord('');
      setHasSubmitted(false);
    }
  }, [myPlayer?.hasSubmitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedWord = word.trim();
    if (!trimmedWord || trimmedWord.length === 0) {
      alert('Please enter a word!');
      return;
    }

    if (trimmedWord.length > 50) {
      alert('Word is too long (max 50 characters)');
      return;
    }

    setHasSubmitted(true);
    onSubmit(trimmedWord);
  };

  const timeRemaining = lobby.gameData?.timeRemaining || 0;
  const isLowTime = timeRemaining <= 10;

  return (
    <div className="text-mode-input-container px-4 sm:px-6 md:px-8">
      {/* Timer Display */}
      <div className={`timer-circle ${isLowTime ? 'timer-warning' : ''}`}>
        <div className="timer-value text-lg sm:text-xl md:text-2xl">{timeRemaining}s</div>
      </div>

      {/* Instructions */}
      <div className="input-instructions">
        <h2 className="text-2xl sm:text-3xl md:text-4xl">Think of a word...</h2>
        <p className="text-base sm:text-lg md:text-xl">Type the same word as your opponent to win!</p>
      </div>

      {/* Word Input Form */}
      {!hasSubmitted && !myPlayer?.hasSubmitted ? (
        <form onSubmit={handleSubmit} className="word-input-form w-full max-w-md">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Type your word..."
            className="word-input text-lg sm:text-xl md:text-2xl px-4 py-3 w-full"
            autoFocus
            maxLength={50}
            disabled={hasSubmitted}
          />
          <button
            type="submit"
            className="submit-button text-base sm:text-lg md:text-xl px-6 py-3 mt-4 w-full sm:w-auto"
            disabled={!word.trim() || hasSubmitted}
          >
            Submit Word
          </button>
        </form>
      ) : (
        <div className="waiting-container px-4">
          <div className="submitted-word">
            <div className="submitted-label text-sm sm:text-base">Your word:</div>
            <div className="submitted-value text-xl sm:text-2xl md:text-3xl">{myPlayer?.currentWord || word}</div>
          </div>

          {opponentPlayer?.hasSubmitted ? (
            <div className="status-message success">
              ✓ Both players submitted! Revealing words...
            </div>
          ) : (
            <div className="status-message waiting">
              <div className="spinner"></div>
              Waiting for {opponentPlayer?.name || 'opponent'}...
            </div>
          )}
        </div>
      )}

      {/* Round Info */}
      <div className="round-info">
        Round {lobby.gameData?.currentRound || 1}
      </div>
    </div>
  );
};
