import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

import { Car } from './Car';
import { Track, trackPoints, isOnTrack } from './Track';
import { GameUI } from './GameUI';

export function RacingGame() {
  // Game state
  const [speed, setSpeed] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);
  const [lapCount, setLapCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Refs for game logic
  const startTime = useRef(Date.now());
  const lastLapTime = useRef(Date.now());
  const carPosition = useRef(new THREE.Vector3(0, 0.5, 0));
  const hasPassedStartLine = useRef(false);
  const gameActive = useRef(true);
  
  // Start line position (first track point)
  const startLine = trackPoints[0];
  
  // Update lap timer
  useEffect(() => {
    if (isGameOver || !gameActive.current) return;
    
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setLapTime(currentTime - lastLapTime.current);
    }, 10);
    
    return () => clearInterval(interval);
  }, [isGameOver]);
  
  // Handle car position updates
  const handlePositionChange = (position: THREE.Vector3) => {
    carPosition.current = position;
    
    // Check if car is on track
    if (!isOnTrack(position, trackPoints) && gameActive.current) {
      gameActive.current = false;
      setIsGameOver(true);
    }
    
    // Check if car has passed the start line
    const distanceToStart = position.distanceTo(startLine);
    
    if (distanceToStart < 5) {
      if (!hasPassedStartLine.current) {
        hasPassedStartLine.current = true;
        
        // If this isn't the first time passing the start line, complete a lap
        if (lapCount > 0) {
          const currentLapTime = Date.now() - lastLapTime.current;
          
          // Update best lap time
          if (!bestLapTime || currentLapTime < bestLapTime) {
            setBestLapTime(currentLapTime);
          }
          
          // Reset lap timer
          lastLapTime.current = Date.now();
        }
        
        // Increment lap count
        setLapCount(prev => prev + 1);
      }
    } else if (distanceToStart > 20) {
      // Reset flag when car is far enough from start line
      hasPassedStartLine.current = false;
    }
  };
  
  // Handle game restart
  const handleRestart = () => {
    // Reset game state
    setIsGameOver(false);
    setLapTime(0);
    setLapCount(0);
    
    // Reset refs
    startTime.current = Date.now();
    lastLapTime.current = Date.now();
    hasPassedStartLine.current = false;
    gameActive.current = true;
  };
  
  return (
    <>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        
        <Car 
          position={[0, 0.5, 0]} 
          onPositionChange={handlePositionChange} 
        />
        
        <Track />
        
        <Sky sunPosition={[100, 10, 100]} />
        <Stars radius={100} depth={50} count={5000} factor={4} />
        
        <fog attach="fog" args={['#17184b', 10, 100]} />
      </Canvas>
      
      <GameUI 
        speed={speed * 3.6} // Convert m/s to km/h
        lapTime={lapTime}
        bestLapTime={bestLapTime}
        lapCount={lapCount}
        isGameOver={isGameOver}
        onRestart={handleRestart}
      />
    </>
  );
}