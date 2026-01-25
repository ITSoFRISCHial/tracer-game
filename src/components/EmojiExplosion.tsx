'use client';

import { useEffect, useState, useMemo } from 'react';

interface EmojiExplosionProps {
  emoji?: string;
  duration?: number; // milliseconds
  onComplete?: () => void;
}

// Random celebration emojis for words without specific emoji
const CELEBRATION_EMOJIS = ['🎉', '🎊', '⭐', '🌟', '✨', '💫', '🏆', '👏', '🙌', '💪', '🔥', '💯'];

interface Particle {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  scale: number;
  delay: number;
  duration: number;
}

/**
 * Dev Notes: Emoji Explosion Animation
 *
 * Creates particles that burst from center and fly outward with physics-like motion.
 * Uses CSS animations for performance - no JS animation loop needed.
 * Each particle has randomized trajectory, rotation, scale, and timing.
 */
export default function EmojiExplosion({
  emoji,
  duration = 3000,
  onComplete
}: EmojiExplosionProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Pick random emoji if none provided
  const displayEmoji = emoji || CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];

  // Generate particles on mount
  const particles = useMemo(() => {
    const count = 40; // Number of emojis to explode
    const result: Particle[] = [];

    for (let i = 0; i < count; i++) {
      // Random angle for explosion direction
      const angle = (Math.random() * Math.PI * 2);
      // Random distance from center (varying burst radius)
      const distance = 150 + Math.random() * 400;

      result.push({
        id: i,
        emoji: displayEmoji,
        startX: 50, // Start from center (%)
        startY: 50,
        endX: 50 + Math.cos(angle) * (distance / 5), // End position (%)
        endY: 50 + Math.sin(angle) * (distance / 5),
        rotation: Math.random() * 720 - 360, // Random spin
        scale: 0.5 + Math.random() * 1.5, // Random size
        delay: Math.random() * 200, // Stagger start
        duration: 1500 + Math.random() * 1000, // Vary animation length
      });
    }

    return result;
  }, [displayEmoji]);

  // Trigger completion callback and hide after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Flash background */}
      <div
        className="absolute inset-0 bg-yellow-300/30"
        style={{
          animation: 'flash 0.3s ease-out',
        }}
      />

      {/* Big central emoji */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl"
        style={{
          animation: 'popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}
      >
        {displayEmoji}
      </div>

      {/* Exploding particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-4xl"
          style={{
            left: `${particle.startX}%`,
            top: `${particle.startY}%`,
            transform: 'translate(-50%, -50%)',
            animation: `explode-${particle.id} ${particle.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${particle.delay}ms forwards`,
            fontSize: `${particle.scale * 2}rem`,
          }}
        >
          {particle.emoji}
          <style>{`
            @keyframes explode-${particle.id} {
              0% {
                left: ${particle.startX}%;
                top: ${particle.startY}%;
                opacity: 1;
                transform: translate(-50%, -50%) rotate(0deg) scale(0);
              }
              20% {
                transform: translate(-50%, -50%) rotate(${particle.rotation * 0.2}deg) scale(${particle.scale});
                opacity: 1;
              }
              100% {
                left: ${particle.endX}%;
                top: ${particle.endY + 20}%;
                opacity: 0;
                transform: translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${particle.scale * 0.5});
              }
            }
          `}</style>
        </div>
      ))}

      {/* Global keyframes */}
      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes popIn {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.3); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
