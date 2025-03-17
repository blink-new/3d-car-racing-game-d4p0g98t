import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Define car physics properties
const MAX_SPEED = 40;
const ACCELERATION = 0.2;
const DECELERATION = 0.1;
const BRAKE_POWER = 0.5;
const TURN_SPEED = 0.03;
const TURN_DAMPING = 0.9;

export function Car({ 
  position = [0, 0.5, 0], 
  onPositionChange = (position: THREE.Vector3) => {},
  onCollision = () => {},
}) {
  // Create refs for the car and camera
  const carRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  // Car state
  const carState = useRef({
    speed: 0,
    rotation: 0,
    position: new THREE.Vector3(...position),
    direction: new THREE.Vector3(0, 0, -1),
    turnDirection: 0,
    isAccelerating: false,
    isBraking: false,
  });
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          carState.current.isAccelerating = true;
          break;
        case 's':
        case 'arrowdown':
          carState.current.isBraking = true;
          break;
        case 'a':
        case 'arrowleft':
          carState.current.turnDirection = 1;
          break;
        case 'd':
        case 'arrowright':
          carState.current.turnDirection = -1;
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          carState.current.isAccelerating = false;
          break;
        case 's':
        case 'arrowdown':
          carState.current.isBraking = false;
          break;
        case 'a':
        case 'arrowleft':
          if (carState.current.turnDirection === 1) {
            carState.current.turnDirection = 0;
          }
          break;
        case 'd':
        case 'arrowright':
          if (carState.current.turnDirection === -1) {
            carState.current.turnDirection = 0;
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Update car physics on each frame
  useFrame((state, delta) => {
    if (!carRef.current) return;
    
    const car = carState.current;
    
    // Update speed based on input
    if (car.isAccelerating) {
      car.speed += ACCELERATION;
    } else if (car.speed > 0) {
      car.speed -= DECELERATION;
    }
    
    if (car.isBraking) {
      car.speed -= BRAKE_POWER;
    }
    
    // Clamp speed
    car.speed = Math.max(0, Math.min(car.speed, MAX_SPEED));
    
    // Update rotation based on turn direction and speed
    if (car.speed > 0.1) {
      car.rotation += car.turnDirection * TURN_SPEED * (car.speed / MAX_SPEED);
    }
    
    // Apply rotation to car model
    carRef.current.rotation.y = car.rotation;
    
    // Calculate movement direction
    car.direction.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation);
    
    // Update position
    const moveDistance = car.speed * delta;
    car.position.addScaledVector(car.direction, moveDistance);
    
    // Apply position to car model
    carRef.current.position.copy(car.position);
    
    // Update camera position
    if (cameraRef.current) {
      const cameraOffset = new THREE.Vector3(0, 3, 8);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation);
      cameraRef.current.position.copy(car.position).add(cameraOffset);
      cameraRef.current.lookAt(car.position);
    }
    
    // Notify parent component of position change
    onPositionChange(car.position.clone());
  });
  
  // Create a simple car mesh
  return (
    <group ref={carRef} position={position}>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 3, 8]} fov={75} />
      
      {/* Car body */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.5, 0.5, 3]} />
        <meshStandardMaterial color="#ff3e00" metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Car top */}
      <mesh castShadow position={[0, 0.8, -0.2]}>
        <boxGeometry args={[1.2, 0.4, 1.5]} />
        <meshStandardMaterial color="#ff3e00" metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Wheels */}
      <Wheel position={[0.8, 0.2, 1]} />
      <Wheel position={[-0.8, 0.2, 1]} />
      <Wheel position={[0.8, 0.2, -1]} />
      <Wheel position={[-0.8, 0.2, -1]} />
      
      {/* Headlights */}
      <pointLight position={[0.5, 0.5, -1.5]} intensity={1} color="#ffffff" distance={10} />
      <pointLight position={[-0.5, 0.5, -1.5]} intensity={1} color="#ffffff" distance={10} />
    </group>
  );
}

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <mesh castShadow position={position}>
      <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
      <meshStandardMaterial color="#111" metalness={0.5} roughness={0.2} />
    </mesh>
  );
}