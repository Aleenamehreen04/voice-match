import React, { useState, useEffect } from 'react';

const InterviewTimer = ({ duration = 15, onTimeUp }) => {
  const totalSeconds = duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft <= 0 && isActive) {
        setIsActive(false);
        onTimeUp && onTimeUp();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isActive, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 120;
  const isCritical = timeLeft < 30;

  const pct = timeLeft / totalSeconds;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - pct);
  const ringColor = isCritical ? '#dc2626' : isWarning ? '#f59e0b' : '#7c3aed';

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm ${
        isWarning ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
      } ${isCritical ? 'animate-pulse' : ''}`}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" className="flex-shrink-0">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={radius} fill="none"
          stroke={ringColor} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 30 30)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
        <text x="30" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill={ringColor}>
          {minutes}:{String(seconds).padStart(2, '0')}
        </text>
      </svg>
      {isWarning && (
        <span className={`text-sm font-semibold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
          {isCritical ? 'Time almost up!' : 'Time running out!'}
        </span>
      )}
    </div>
  );
};

export default InterviewTimer;