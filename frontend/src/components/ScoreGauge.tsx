import React, { useEffect, useState } from 'react';

/**
 * ScoreGauge Component
 * 
 * Draws an SVG donut chart representing a score from 0 to 100.
 * Includes a subtle animation on mount.
 */
interface ScoreGaugeProps {
  score: number;
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Simple animation for the score value
    const duration = 1000; // ms
    const steps = 20;
    const stepTime = duration / steps;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        current = score;
        clearInterval(timer);
      }
      setAnimatedScore(current);
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // SVG parameters
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Calculate stroke dasharray and dashoffset for a donut (circle with missing bottom part)
  const circumference = 2 * Math.PI * radius;
  // We want to draw 75% of the circle (leaving the bottom quarter open)
  const maxArcLength = circumference * 0.75;
  const arcOffset = circumference * 0.25 / 2; // Offset to start drawing from the bottom left

  // Calculate the filled portion based on the score
  const fillRatio = Math.max(0, Math.min(100, animatedScore)) / 100;
  const fillLength = maxArcLength * fillRatio;
  const emptyLength = circumference - fillLength;

  // Determine color based on score
  let strokeColor = "#f59e0b"; // amber-500
  if (score >= 80) strokeColor = "#4ade80"; // green-400
  else if (score >= 60) strokeColor = "#a3e635"; // lime-400
  else if (score < 40) strokeColor = "#f87171"; // red-400

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track (the grey part) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1e293b" // slate-800
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${maxArcLength} ${circumference - maxArcLength}`}
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Foreground bar (the colored part) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${emptyLength}`}
          // The rotation starts drawing at 3 o'clock.
          // 135 degrees moves the start point to bottom-left (45 degrees past 6 o'clock)
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
        />
      </svg>
    </div>
  );
}
