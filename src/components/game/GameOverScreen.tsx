import React from 'react';
import type { Lobby } from '../../types';

interface GameOverScreenProps {
  lobby: Lobby;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ lobby, onRestart }) => {
  const roundsCompleted = lobby.gameData?.currentRound || 0;
  const totalAttempts = lobby.gameData?.rounds.length || 0;
  const matchedRounds = lobby.gameData?.rounds.filter(r => r.wasMatch).length || 0;

  return (
    <div className="gameover-container">
      <div className="gameover-content px-4">
        {/* Broken heart icon */}
        <div className="gameover-icon text-5xl sm:text-6xl md:text-7xl">💔</div>

        {/* Game Over title */}
        <h1 className="gameover-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl">GAME OVER</h1>
        <h2 className="gameover-subtitle text-lg sm:text-xl md:text-2xl">Out of Lives!</h2>

        {/* Stats */}
        <div className="gameover-stats grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="stat-item">
            <div className="stat-label text-sm sm:text-base">Rounds Completed</div>
            <div className="stat-value text-2xl sm:text-3xl md:text-4xl">{roundsCompleted}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label text-sm sm:text-base">Total Attempts</div>
            <div className="stat-value text-2xl sm:text-3xl md:text-4xl">{totalAttempts}</div>
          </div>

          <div className="stat-item">
            <div className="stat-label text-sm sm:text-base">Matches</div>
            <div className="stat-value text-2xl sm:text-3xl md:text-4xl">{matchedRounds}</div>
          </div>
        </div>

        {/* Failed attempts */}
        {lobby.gameData && lobby.gameData.rounds.length > 0 && (
          <div className="failed-attempts mt-6 md:mt-8">
            <h3 className="text-lg sm:text-xl md:text-2xl mb-4">Your Attempts</h3>
            <div className="attempts-list">
              {lobby.gameData.rounds.map((round, index) => (
                <div
                  key={index}
                  className={`attempt-item ${round.wasMatch ? 'match' : 'no-match'}`}
                >
                  <span className="attempt-number">#{round.number}</span>
                  <span className="attempt-words">
                    {round.player1Word} vs {round.player2Word}
                  </span>
                  <span className="attempt-result">
                    {round.wasMatch ? '✓ Match!' : '✗ No match'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encouragement */}
        <div className="encouragement-message">
          {matchedRounds > 0 ? (
            <p>So close! You matched {matchedRounds} time{matchedRounds !== 1 ? 's' : ''}!</p>
          ) : (
            <p>Keep trying! Synchronizing minds takes practice!</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="gameover-actions">
          <button className="retry-button" onClick={onRestart}>
            🔄 Try Again
          </button>
        </div>
      </div>
    </div>
  );
};
