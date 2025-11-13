import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  velocity: number;
  size: number;
}

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Create 50 particles
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: ['#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#f59e0b'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
      velocity: Math.random() * 3 + 2,
      size: Math.random() * 10 + 5
    }));

    setParticles(newParticles);

    // Animate particles falling
    const intervalId = setInterval(() => {
      setParticles(prevParticles =>
        prevParticles.map(p => ({
          ...p,
          y: p.y + p.velocity,
          rotation: p.rotation + 5
        })).filter(p => p.y < window.innerHeight + 50)
      );
    }, 30);

    // Clear after 3 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setParticles([]);
    }, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="confetti-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            position: 'fixed',
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      ))}
    </div>
  );
};
