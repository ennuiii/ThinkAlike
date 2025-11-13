import React, { useState, useEffect } from 'react';
import './RoundStartOverlay.css';

interface RoundStartOverlayProps {
  roundNumber: number;
  onComplete: () => void;
}

export const RoundStartOverlay: React.FC<RoundStartOverlayProps> = ({ roundNumber, onComplete }) => {
  const [displayNumber, setDisplayNumber] = useState<number | string>(3);

  useEffect(() => {
    // Timeline for countdown: 3 (1s) -> 2 (1s) -> 1 (1s) -> GO! (0.5s)
    const timings = [
      { number: 3, delay: 0 },
      { number: 2, delay: 1000 },
      { number: 1, delay: 2000 },
      { number: 'GO!', delay: 3000 },
    ];

    // Set each number at the right time
    const timeouts = timings.map((timing) =>
      setTimeout(() => {
        console.log('[RoundStartOverlay] Setting number:', timing.number);
        setDisplayNumber(timing.number);
      }, timing.delay)
    );

    // Complete after all animations (GO! shows for 0.5s after 3s mark)
    const completeTimeout = setTimeout(() => {
      console.log('[RoundStartOverlay] Countdown complete, calling onComplete');
      onComplete();
    }, 3500);

    return () => {
      console.log('[RoundStartOverlay] Cleaning up timeouts');
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="round-start-overlay">
      {/* Background with blur */}
      <div className="round-start-backdrop" />

      {/* Content */}
      <div className="round-start-content">
        {/* Round label */}
        <div className="round-label">
          Round {roundNumber}
        </div>

        {/* Animated countdown or GO! */}
        {displayNumber === 'GO!' ? (
          <div key="go" className="go-text">
            GO!
          </div>
        ) : (
          <div key={displayNumber} className="countdown-number">
            {displayNumber}
          </div>
        )}

        {/* Animated circles (neural network effect) */}
        <div className="neural-circles">
          <div className="circle circle-1" />
          <div className="circle circle-2" />
          <div className="circle circle-3" />
        </div>
      </div>
    </div>
  );
};

export default RoundStartOverlay;
