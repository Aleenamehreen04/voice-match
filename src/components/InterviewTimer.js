// src/components/InterviewTimer.js
import React, { useState, useEffect } from 'react';

const InterviewTimer = ({ duration = 15, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
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

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-lg font-bold shadow-sm ${
        isWarning
          ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <span>⏱</span>
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {isWarning && (
        <span className="text-sm font-medium">Time running out!</span>
      )}
    </div>
  );
};

export default InterviewTimer;