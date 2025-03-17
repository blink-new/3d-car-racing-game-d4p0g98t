import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Track segments
const TRACK_SEGMENTS = [
  { type: 'straight', length: 20 },
  { type: 'curve', angle: Math.PI / 2, radius: 10 },
  { type: 'straight', length: 15 },
  { type: 'curve', angle: Math.PI / 2, radius: 10 },
  { type: 'straight', length: 20 },
  { type: 'curve', angle: Math.PI / 2, radius: 10 },
  { type: 'straight', length: 15 },
  { type: 'curve', angle: Math.PI / 2, radius: 10 },
];

// Track width
const TRACK_WIDTH = 10;

export function Track() {
  const trackRef = useRef<THREE.Group>(null);
  
  // Generate track points
  const trackPoints = generateTrackPoints();
  
  // Create track segments
  const trackSegments = [];
  for (let i = 0; i < trackPoints.length - 1; i++) {
    const start = trackPoints[i];
    const end = trackPoints[i + 1];
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    // Calculate rotation to align with direction
    const rotation = new THREE.Euler(0, Math.atan2(direction.x, direction.z), 0);
    
    trackSegments.push(
      <mesh key={i} position={center} rotation={rotation} receiveShadow>
        <boxGeometry args={[TRACK_WIDTH, 0.1, length]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
    );
    
    // Add track borders
    trackSegments.push(
      <mesh key={`border-left-${i}`} position={[center.x - TRACK_WIDTH/2, center.y + 0.25, center.z]} rotation={rotation} castShadow>
        <boxGeometry args={[0.5, 0.5, length]} />
        <meshStandardMaterial color="#f00" roughness={0.5} />
      </mesh>
    );
    
    trackSegments.push(
      <mesh key={`border-right-${i}`} position={[center.x + TRACK_WIDTH/2, center.y + 0.25, center.z]} rotation={rotation} castShadow>
        <boxGeometry args={[0.5, 0.5, length]} />
        <meshStandardMaterial color="#f00" roughness={0.5} />
      </mesh>
    );
  }
  
  return (
    <group ref={trackRef}>
      {trackSegments}
      <Ground />
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color="#1a5c1a" roughness={1} />
    </mesh>
  );
}

// Helper function to generate track points
function generateTrackPoints() {
  const points = [];
  let currentPoint = new THREE.Vector3(0, 0, 0);
  let currentDirection = new THREE.Vector3(0, 0, -1);
  
  points.push(currentPoint.clone());
  
  TRACK_SEGMENTS.forEach(segment => {
    if (segment.type === 'straight') {
      const endPoint = currentPoint.clone().addScaledVector(currentDirection, segment.length);
      points.push(endPoint);
      currentPoint = endPoint;
    } else if (segment.type === 'curve') {
      // For curves, we'll add multiple points to make it smooth
      const steps = 10;
      const angleStep = segment.angle / steps;
      
      // Calculate the center of the curve
      const perpendicular = new THREE.Vector3(-currentDirection.z, 0, currentDirection.x).normalize();
      const center = currentPoint.clone().addScaledVector(perpendicular, segment.radius);
      
      for (let i = 1; i <= steps; i++) {
        const angle = angleStep * i;
        const rotatedDirection = currentDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        const newPoint = center.clone().addScaledVector(rotatedDirection.clone().negate(), segment.radius);
        points.push(newPoint);
        
        if (i === steps) {
          currentPoint = newPoint;
          currentDirection = rotatedDirection;
        }
      }
    }
  });
  
  return points;
}

// Helper function to check if a point is on the track
export function isOnTrack(position: THREE.Vector3, trackPoints: THREE.Vector3[]) {
  for (let i = 0; i < trackPoints.length - 1; i++) {
    const start = trackPoints[i];
    const end = trackPoints[i + 1];
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    // Project the position onto the line segment
    const toPosition = new THREE.Vector3().subVectors(position, start);
    const projection = toPosition.dot(direction) / length;
    
    // Check if the projection is within the line segment
    if (projection >= 0 && projection <= length) {
      // Calculate the distance from the position to the line segment
      const projectedPoint = start.clone().addScaledVector(direction.normalize(), projection);
      const distance = new THREE.Vector3().subVectors(position, projectedPoint).length();
      
      // Check if the distance is within the track width
      if (distance <= TRACK_WIDTH / 2) {
        return true;
      }
    }
  }
  
  return false;
}

// Export track points for collision detection
export const trackPoints = generateTrackPoints();