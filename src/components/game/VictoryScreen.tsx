import React, { useEffect } from 'react';
import type { Lobby } from '../../types';
import { Confetti } from '../animations/Confetti';
import { soundEffects } from '../../utils/soundEffects';

interface VictoryScreenProps {
  lobby: Lobby;
  onRestart: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ lobby, onRestart }) => {
  const lastRound = lobby.gameData?.rounds[lobby.gameData.rounds.length - 1];
  const matchedWord = lastRound?.player1Word || '';
  const roundsCompleted = lobby.gameData?.currentRound || 0;
  const livesRemaining = lobby.gameData?.livesRemaining || 0;

  // Calculate stats
  const totalAttempts = lobby.gameData?.rounds.length || 0;

  // Play victory sound on mount
  useEffect(() => {
    soundEffects.play('win');
  }, []);

  return (
    <div className="victory-container">
      {/* Confetti celebration */}
      <Confetti />

      <div className="victory-content px-4">
        {/* Trophy icon */}
        <img src={import.meta.env.BASE_URL + 'trophy.svg'} alt="Victory Trophy" className="trophy-icon" />

        {/* Victory title */}
        <h1 className="victory-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl">VICTORY!</h1>
        <h2 className="victory-subtitle text-lg sm:text-xl md:text-2xl">You achieved MIND MELD!</h2>

        {/* Matched word display */}
        <div className="matched-word-display">
          <div className="matched-label text-sm sm:text-base md:text-lg">The word was:</div>
          <div className="matched-word text-2xl sm:text-3xl md:text-4xl lg:text-5xl">{matchedWord}</div>
        </div>

        {/* Stats card */}
        <div className="victory-stats grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="stat-item">
            <div className="stat-label text-sm sm:text-base">Rounds Taken</div>
            <div className="stat-value text-2xl sm:text-3xl md:text-4xl">{roundsCompleted}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label text-sm sm:text-base">Lives Remaining</div>
            <div className="stat-value text-2xl sm:text-3xl md:text-4xl">❤️ × {livesRemaining}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label text-sm sm:text-base">Total Attempts</div>
            <div className="stat-value text-2xl sm:text-3xl md:text-4xl">{totalAttempts}</div>
          </div>
        </div>

        {/* Round history */}
        {lobby.gameData && lobby.gameData.rounds.length > 0 && (
          <div className="round-history mt-6 md:mt-8">
            <h3 className="text-lg sm:text-xl md:text-2xl mb-4">Round History</h3>
            <div className="history-list">
              {lobby.gameData.rounds.map((round, index) => (
                <div
                  key={index}
                  className={`history-item ${round.wasMatch ? 'match' : 'no-match'}`}
                >
                  <span className="round-number">Round {round.number}:</span>
                  <span className="round-words">
                    {round.player1Word} vs {round.player2Word}
                  </span>
                  <span className="round-result">
                    {round.wasMatch ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons - Only for players, not spectators */}
        {!lobby.isSpectator && (
          <div className="victory-actions">
            <button className="play-again-button" onClick={onRestart}>
              🎮 Play Again
            </button>
          </div>
        )}

        {/* Encouragement message */}
        <div className="victory-message">
          Great teamwork! You synchronized your minds perfectly!
        </div>
      </div>
    </div>
  );
};
