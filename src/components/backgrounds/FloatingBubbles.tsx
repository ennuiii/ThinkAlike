import React from 'react';

const FloatingBubbles: React.FC = () => {
  // Generate floating bubble elements
  const bubbles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 20 + Math.random() * 60,
    delay: Math.random() * 3,
    duration: 15 + Math.random() * 10,
  }));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: `linear-gradient(135deg, #FAF3E0 0%, #FFF8E7 50%, #FFF4E6 100%)`,
      }}
    >
      {/* Paper texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          opacity: 0.5,
        }}
      />

      {/* Floating bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            top: `${bubble.top}%`,
            background: `radial-gradient(135deg, rgba(138, 198, 209, 0.3) 0%, rgba(255, 180, 162, 0.2) 100%)`,
            border: `2px solid rgba(138, 198, 209, 0.2)`,
            animation: `float${(bubble.id % 3) + 1} ${bubble.duration}s ease-in-out infinite`,
            animationDelay: `${bubble.delay}s`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* Decorative elements */}
      <svg
        className="absolute top-10 left-10 opacity-10"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="40" fill="none" stroke="#2B2D42" strokeWidth="2" />
        <line x1="30" y1="30" x2="70" y2="70" stroke="#2B2D42" strokeWidth="2" />
        <line x1="70" y1="30" x2="30" y2="70" stroke="#2B2D42" strokeWidth="2" />
      </svg>

      <svg
        className="absolute bottom-20 right-10 opacity-10"
        width="120"
        height="120"
        viewBox="0 0 120 120"
      >
        <polygon
          points="60,10 110,110 10,110"
          fill="none"
          stroke="#2B2D42"
          strokeWidth="2"
        />
      </svg>

      {/* CSS Animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-3deg); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(4deg); }
        }
      `}</style>
    </div>
  );
};

export default FloatingBubbles;
