import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Sky, useTexture, Text, Plane, Box } from '@react-three/drei'
import { Vector3, Euler, Mesh, Group } from 'three'
import './App.css'

// Car component
function Car({ position, rotation, gameOver, setGameOver }) {
  const carRef = useRef()
  const headlightsRef = useRef()
  const carBodyRef = useRef()
  
  // Update car position
  useEffect(() => {
    if (carRef.current) {
      carRef.current.position.set(position.x, position.y, position.z)
      carRef.current.rotation.set(rotation.x, rotation.y, rotation.z)
    }
  }, [position, rotation])

  return (
    <group ref={carRef}>
      {/* Car body */}
      <mesh ref={carBodyRef} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color={gameOver ? "red" : "blue"} />
      </mesh>
      
      {/* Car roof */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.5, 0.5, 2]} />
        <meshStandardMaterial color={gameOver ? "darkred" : "darkblue"} />
      </mesh>
      
      {/* Wheels */}
      <Wheel position={[1, 0, 1.5]} />
      <Wheel position={[-1, 0, 1.5]} />
      <Wheel position={[1, 0, -1.5]} />
      <Wheel position={[-1, 0, -1.5]} />
      
      {/* Headlights */}
      <group ref={headlightsRef} position={[0, 0.5, 2]}>
        <pointLight
          position={[0.7, 0, 0]}
          intensity={5}
          distance={20}
          color="white"
        />
        <pointLight
          position={[-0.7, 0, 0]}
          intensity={5}
          distance={20}
          color="white"
        />
      </group>
    </group>
  )
}

// Wheel component
function Wheel({ position }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 0.5, 32]} rotation={[Math.PI / 2, 0, 0]} />
      <meshStandardMaterial color="black" />
    </mesh>
  )
}

// Track component
function Track() {
  const trackRef = useRef()
  
  // Track outer boundary
  const outerTrackPoints = [
    [-30, 0, -30],
    [30, 0, -30],
    [30, 0, 30],
    [-30, 0, 30]
  ]
  
  // Track inner boundary
  const innerTrackPoints = [
    [-15, 0, -15],
    [15, 0, -15],
    [15, 0, 15],
    [-15, 0, 15]
  ]
  
  return (
    <group ref={trackRef}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="green" />
      </mesh>
      
      {/* Track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[15, 30, 32]} />
        <meshStandardMaterial color="gray" />
      </mesh>
      
      {/* Track boundaries */}
      {outerTrackPoints.map((point, index) => {
        const nextPoint = outerTrackPoints[(index + 1) % outerTrackPoints.length]
        return (
          <TrackBoundary 
            key={`outer-${index}`}
            start={point} 
            end={nextPoint}
          />
        )
      })}
      
      {innerTrackPoints.map((point, index) => {
        const nextPoint = innerTrackPoints[(index + 1) % innerTrackPoints.length]
        return (
          <TrackBoundary 
            key={`inner-${index}`}
            start={point} 
            end={nextPoint}
          />
        )
      })}
      
      {/* Start/Finish line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -22.5]} receiveShadow>
        <planeGeometry args={[15, 1]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  )
}

// Track boundary component
function TrackBoundary({ start, end }) {
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + 
    Math.pow(end[2] - start[2], 2)
  )
  
  const position = [
    (start[0] + end[0]) / 2,
    0.5,
    (start[2] + end[2]) / 2
  ]
  
  const rotation = new Euler(
    0,
    Math.atan2(end[0] - start[0], end[2] - start[2]),
    0
  )
  
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={[0.5, 1, length]} />
      <meshStandardMaterial color="red" />
    </mesh>
  )
}

// Game component
function Game() {
  const [carPosition, setCarPosition] = useState({ x: 0, y: 0, z: -20 })
  const [carRotation, setCarRotation] = useState({ x: 0, y: 0, z: 0 })
  const [speed, setSpeed] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [lapTime, setLapTime] = useState(0)
  const [bestLapTime, setBestLapTime] = useState(null)
  const [lapCount, setLapCount] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [crossedStartLine, setCrossedStartLine] = useState(false)
  
  const keysPressed = useRef({})
  const maxSpeed = 0.5
  const acceleration = 0.01
  const deceleration = 0.005
  const turnSpeed = 0.03
  
  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true
    }
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // Game loop
  useFrame((state, delta) => {
    if (gameOver) return
    
    // Update lap time
    if (startTime !== null) {
      setLapTime(Date.now() - startTime)
    }
    
    // Handle controls
    const keys = keysPressed.current
    let newSpeed = speed
    let newRotation = { ...carRotation }
    
    // Acceleration and deceleration
    if ((keys['w'] || keys['arrowup']) && !gameOver) {
      newSpeed = Math.min(speed + acceleration, maxSpeed)
    } else if ((keys['s'] || keys['arrowdown']) && !gameOver) {
      newSpeed = Math.max(speed - acceleration, -maxSpeed / 2)
    } else {
      // Natural deceleration
      if (speed > 0) {
        newSpeed = Math.max(speed - deceleration, 0)
      } else if (speed < 0) {
        newSpeed = Math.min(speed + deceleration, 0)
      }
    }
    
    // Turning
    if ((keys['a'] || keys['arrowleft']) && !gameOver) {
      newRotation.y += turnSpeed * (newSpeed / maxSpeed)
    }
    if ((keys['d'] || keys['arrowright']) && !gameOver) {
      newRotation.y -= turnSpeed * (newSpeed / maxSpeed)
    }
    
    // Calculate new position
    const direction = new Vector3(
      Math.sin(newRotation.y),
      0,
      Math.cos(newRotation.y)
    )
    
    const newPosition = {
      x: carPosition.x + direction.x * newSpeed,
      y: carPosition.y,
      z: carPosition.z + direction.z * newSpeed
    }
    
    // Check if car is on track
    const distanceFromCenter = Math.sqrt(
      Math.pow(newPosition.x, 2) + 
      Math.pow(newPosition.z, 2)
    )
    
    if (distanceFromCenter > 30 || distanceFromCenter < 15) {
      if (!gameOver) {
        setGameOver(true)
      }
    }
    
    // Check if car crossed start/finish line
    if (
      newPosition.z < -22 && 
      carPosition.z >= -22 && 
      Math.abs(newPosition.x) < 7.5 &&
      !gameOver
    ) {
      if (crossedStartLine) {
        // Completed a lap
        const currentLapTime = Date.now() - startTime
        if (bestLapTime === null || currentLapTime < bestLapTime) {
          setBestLapTime(currentLapTime)
        }
        setLapCount(lapCount + 1)
        setStartTime(Date.now())
      } else {
        // First time crossing the line
        setCrossedStartLine(true)
        setStartTime(Date.now())
      }
    }
    
    // Update state
    setSpeed(newSpeed)
    setCarPosition(newPosition)
    setCarRotation(newRotation)
  })
  
  // Reset game function
  const resetGame = () => {
    setCarPosition({ x: 0, y: 0, z: -20 })
    setCarRotation({ x: 0, y: 0, z: 0 })
    setSpeed(0)
    setGameOver(false)
    setLapTime(0)
    setLapCount(0)
    setCrossedStartLine(false)
    setStartTime(null)
    // We keep the best lap time
  }
  
  return (
    <>
      {/* 3D Scene */}
      <PerspectiveCamera 
        makeDefault 
        position={[
          carPosition.x - 5 * Math.sin(carRotation.y),
          carPosition.y + 5,
          carPosition.z - 5 * Math.cos(carRotation.y)
        ]}
        rotation={[0, carRotation.y, 0]}
        fov={75}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      <Sky sunPosition={[100, 10, 100]} />
      
      <Track />
      <Car 
        position={carPosition} 
        rotation={carRotation}
        gameOver={gameOver}
        setGameOver={setGameOver}
      />
      
      {/* Game over screen */}
      {gameOver && (
        <group position={[0, 5, -5]}>
          <Text
            position={[0, 2, 0]}
            fontSize={1.5}
            color="red"
            anchorX="center"
            anchorY="middle"
          >
            Game Over!
          </Text>
          
          <group position={[0, 0, 0]} onClick={resetGame}>
            <Plane args={[5, 1.5]} position={[0, 0, -0.1]}>
              <meshStandardMaterial color="white" />
            </Plane>
            <Text
              position={[0, 0, 0]}
              fontSize={0.8}
              color="black"
              anchorX="center"
              anchorY="middle"
            >
              Restart Game
            </Text>
          </group>
        </group>
      )}
      
      {/* UI */}
      <group position={[0, 0, -10]}>
        {/* Speed indicator */}
        <Text
          position={[-8, 8, 0]}
          fontSize={0.5}
          color="white"
          anchorX="left"
          anchorY="top"
        >
          {`Speed: ${Math.abs(speed * 200).toFixed(0)} km/h`}
        </Text>
        
        {/* Lap time */}
        <Text
          position={[-8, 7, 0]}
          fontSize={0.5}
          color="white"
          anchorX="left"
          anchorY="top"
        >
          {`Lap Time: ${(lapTime / 1000).toFixed(2)}s`}
        </Text>
        
        {/* Best lap time */}
        <Text
          position={[-8, 6, 0]}
          fontSize={0.5}
          color="white"
          anchorX="left"
          anchorY="top"
        >
          {bestLapTime 
            ? `Best Lap: ${(bestLapTime / 1000).toFixed(2)}s` 
            : 'Best Lap: --:--'}
        </Text>
        
        {/* Lap count */}
        <Text
          position={[-8, 5, 0]}
          fontSize={0.5}
          color="white"
          anchorX="left"
          anchorY="top"
        >
          {`Laps: ${lapCount}`}
        </Text>
      </group>
    </>
  )
}

// Main App component
function App() {
  return (
    <div className="game-container">
      <Canvas shadows>
        <Game />
      </Canvas>
      <div className="controls-info">
        <h2>Controls</h2>
        <p>W/↑: Accelerate</p>
        <p>S/↓: Brake</p>
        <p>A/←: Turn Left</p>
        <p>D/→: Turn Right</p>
      </div>
    </div>
  )
}

export default App