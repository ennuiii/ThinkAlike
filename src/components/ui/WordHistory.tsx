import React from 'react';
import type { Round } from '../../types';

interface WordHistoryProps {
  rounds: Round[];
  isCollapsed?: boolean;
}

export const WordHistory: React.FC<WordHistoryProps> = ({ rounds, isCollapsed = false }) => {
  const [collapsed, setCollapsed] = React.useState(isCollapsed);

  if (rounds.length === 0) {
    return null;
  }

  return (
    <div className={`word-history ${collapsed ? 'collapsed' : 'expanded'}`}>
      {/* Header with toggle */}
      <div className="history-header" onClick={() => setCollapsed(!collapsed)}>
        <h3>Round History</h3>
        <button className="toggle-button">
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {/* History list */}
      {!collapsed && (
        <div className="history-list">
          {rounds.map((round, index) => (
            <div
              key={index}
              className={`history-item ${round.wasMatch ? 'match' : 'no-match'}`}
            >
              {/* Round number */}
              <div className="round-number">
                Round {round.number}
              </div>

              {/* Words comparison */}
              <div className="words-comparison">
                <span className="word">{round.player1Word || '(empty)'}</span>
                <span className="vs">{round.wasMatch ? '=' : '≠'}</span>
                <span className="word">{round.player2Word || '(empty)'}</span>
              </div>

              {/* Result indicator */}
              <div className={`result-indicator ${round.wasMatch ? 'match' : 'no-match'}`}>
                {round.wasMatch ? '✓ Match!' : '✗ No match'}
              </div>

              {/* Time taken */}
              <div className="time-taken">
                {round.timeTaken}s
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary when collapsed */}
      {collapsed && (
        <div className="history-summary">
          {rounds.length} round{rounds.length !== 1 ? 's' : ''} played
        </div>
      )}
    </div>
  );
};
