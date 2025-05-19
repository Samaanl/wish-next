// File: CelebrationEffects.tsx
"use client";

import { useEffect, useState } from "react";

interface Confetti {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  rotation: number;
  rotationSpeed: number;
}

const CelebrationEffects: React.FC = () => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [counter, setCounter] = useState(0);

  // Generate random confetti pieces on mount
  useEffect(() => {
    const colors = [
      "#FFD700", // Gold
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#7FB800", // Green
      "#9370DB", // Purple
      "#FF8C00", // Orange
    ];

    const newConfetti = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 10,
      size: 5 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 1 + Math.random() * 3,
      angle: -30 + Math.random() * 60,
      rotation: Math.random() * 360,
      rotationSpeed: -3 + Math.random() * 6,
    }));

    setConfetti(newConfetti);

    // Start animation timer
    const intervalId = setInterval(() => {
      setCounter((c) => c + 1);
    }, 50);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Update confetti positions
  useEffect(() => {
    if (counter > 0) {
      setConfetti((prevConfetti) =>
        prevConfetti.map((piece) => {
          // Move confetti down and to the sides based on angle
          const angleRad = piece.angle * (Math.PI / 180);
          const newY = piece.y + piece.speed;
          const newX = piece.x + piece.speed * Math.sin(angleRad);
          const newRotation = (piece.rotation + piece.rotationSpeed) % 360;

          // Reset confetti that goes off screen to create a continuous effect
          if (newY > 110) {
            return {
              ...piece,
              y: -10,
              x: Math.random() * 100,
            };
          }

          return {
            ...piece,
            y: newY,
            x: newX,
            rotation: newRotation,
          };
        })
      );
    }
  }, [counter]);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 1.5}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
};

export default CelebrationEffects;
