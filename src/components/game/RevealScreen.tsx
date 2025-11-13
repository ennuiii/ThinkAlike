import React, { useState, useEffect } from 'react';
import type { Lobby } from '../../types';
import { Confetti } from '../animations/Confetti';
import { HeartBreak } from '../animations/HeartBreak';
import { playLoseLifeSound } from '../../utils/soundEffects';

interface RevealScreenProps {
  lobby: Lobby;
  onNextRound: () => void;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({ lobby, onNextRound }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  const players = lobby.players;
  const player1 = players[0];
  const player2 = players[1];

  const lastRound = lobby.gameData?.rounds[lobby.gameData.rounds.length - 1];
  const isMatch = lastRound?.wasMatch || false;

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Play lose sound when no match
  useEffect(() => {
    if (!isMatch) {
      playLoseLifeSound();
    }
  }, [isMatch]);

  const word1 = lastRound?.player1Word || '';
  const word2 = lastRound?.player2Word || '';

  return (
    <div className="reveal-container">
      {/* Confetti animation on match */}
      {isMatch && <Confetti />}

      {/* Heart break animation on no match */}
      {!isMatch && <HeartBreak />}

      {/* Main reveal area */}
      <div className={`reveal-content ${showAnimation ? 'reveal-animate' : ''}`}>
        {/* Title */}
        <h1 className={`reveal-title ${isMatch ? 'match' : 'no-match'} text-2xl sm:text-3xl md:text-4xl lg:text-5xl`}>
          {isMatch ? '🎉 MIND MELD! 🎉' : '❌ Not Quite...'}
        </h1>

        {/* Word comparison */}
        <div className="word-comparison flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 px-4">
          <div className="player-word w-full md:w-auto">
            <div className="player-name text-sm sm:text-base md:text-lg">{player1?.name || 'Player 1'}</div>
            <div className={`word-display ${isMatch ? 'match-word' : 'no-match-word'} text-xl sm:text-2xl md:text-3xl lg:text-4xl`}>
              {word1 || '(empty)'}
            </div>
          </div>

          <div className="vs-divider text-2xl sm:text-3xl md:text-4xl hidden md:block">
            {isMatch ? '=' : '≠'}
          </div>

          {/* Mobile divider */}
          <div className="vs-divider md:hidden text-xl sm:text-2xl">
            {isMatch ? '=' : '≠'}
          </div>

          <div className="player-word w-full md:w-auto">
            <div className="player-name text-sm sm:text-base md:text-lg">{player2?.name || 'Player 2'}</div>
            <div className={`word-display ${isMatch ? 'match-word' : 'no-match-word'} text-xl sm:text-2xl md:text-3xl lg:text-4xl`}>
              {word2 || '(empty)'}
            </div>
          </div>
        </div>

        {/* Result message */}
        <div className={`result-message ${isMatch ? 'success' : 'failure'}`}>
          {isMatch ? (
            <p>You both thought of the same word!</p>
          ) : (
            <>
              <p>Not a match. You lost a life!</p>
              <div className="lives-lost">
                Lives remaining: ❤️ × {lobby.gameData?.livesRemaining || 0}
              </div>
            </>
          )}
        </div>

        {/* Time taken */}
        {lastRound && (
          <div className="round-stats">
            Time taken: {lastRound.timeTaken}s
          </div>
        )}

        {/* Next round button (only show if not match - match goes to victory) */}
        {!isMatch && lobby.gameData && lobby.gameData.livesRemaining > 0 && (
          <button className="next-round-button" onClick={onNextRound}>
            Try Again (Round {(lobby.gameData.currentRound || 0) + 1})
          </button>
        )}
      </div>
    </div>
  );
};
