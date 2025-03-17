import { useState, useEffect } from 'react';

interface GameUIProps {
  speed: number;
  lapTime: number;
  bestLapTime: number | null;
  lapCount: number;
  isGameOver: boolean;
  onRestart: () => void;
}

export function GameUI({ 
  speed, 
  lapTime, 
  bestLapTime, 
  lapCount, 
  isGameOver, 
  onRestart 
}: GameUIProps) {
  // Format time as mm:ss.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="game-ui">
      <div className="speedometer">
        {Math.floor(speed)} km/h
      </div>
      
      <div className="lap-timer">
        <div>Lap: {lapCount}</div>
        <div>Time: {formatTime(lapTime)}</div>
        {bestLapTime && <div>Best: {formatTime(bestLapTime)}</div>}
      </div>
      
      <div className="controls">
        <div>Controls:</div>
        <div>W/↑ - Accelerate</div>
        <div>S/↓ - Brake</div>
        <div>A/← - Turn Left</div>
        <div>D/→ - Turn Right</div>
      </div>
      
      {isGameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>You went off the track!</p>
          <p>Best Lap Time: {bestLapTime ? formatTime(bestLapTime) : 'N/A'}</p>
          <button onClick={onRestart}>Restart</button>
        </div>
      )}
    </div>
  );
}