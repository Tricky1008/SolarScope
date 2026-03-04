import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number;
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const clamp = Math.max(0, Math.min(100, score));

  // Color from spec: red (0-39), amber (40-69), green (70-100)
  const color =
    clamp >= 70 ? '#22C55E' :      // success green
      clamp >= 40 ? '#F59E0B' :      // amber warning
        '#EF4444';                      // alert red

  const label =
    clamp >= 80 ? 'Excellent' :
      clamp >= 70 ? 'Good' :
        clamp >= 40 ? 'Average' :
          'Poor';

  // SVG arc
  const r = 42;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - clamp / 100);

  // Count-up animation
  useEffect(() => {
    setDisplayScore(0);
    const duration = 1200;
    const steps = 60;
    const increment = clamp / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= clamp) {
        setDisplayScore(clamp);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [clamp]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      className="flex flex-col items-center"
      role="meter"
      aria-valuenow={clamp}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Solar suitability score: ${clamp} out of 100`}
    >
      <div className="relative">
        <svg width="112" height="70" viewBox="0 0 112 70">
          {/* Background arc */}
          <path
            d="M 14 56 A 42 42 0 0 1 98 56"
            fill="none"
            stroke="#1E3550"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 14 56 A 42 42 0 0 1 98 56"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${color}66)`,
            }}
          />
          {/* Score text — JetBrains Mono */}
          <text
            x="56" y="50" textAnchor="middle"
            fill="white" fontSize="24" fontWeight="800"
            fontFamily="'JetBrains Mono', monospace"
          >
            {displayScore}
          </text>
          <text
            x="56" y="64" textAnchor="middle"
            fill="#8BA7C2" fontSize="9"
            fontFamily="'JetBrains Mono', monospace"
          >
            /100
          </text>
        </svg>
        {/* Glow ring behind gauge */}
        {clamp >= 70 && (
          <div
            className="absolute inset-0 rounded-full animate-glow pointer-events-none"
            style={{ filter: `blur(20px)`, background: `${color}15` }}
          />
        )}
      </div>
      <span className="text-sm font-semibold mt-1 font-data" style={{ color }}>
        {label}
      </span>
    </motion.div>
  );
}
