'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Stars({ count = 4000, radius = 1000 }) {
  const pointsRef = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Sphere distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.8 + Math.random() * 0.2);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, [count, radius]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.005;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.2}
        sizeAttenuation
        color={new THREE.Color('#bcd1ff')}
        depthWrite={false}
        transparent
        opacity={0.9}
      />
    </points>
  );
}

function FreeCameraControls({ enabled, speed = 200 }) {
  const keys = useRef({});
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true;
    };
    const up = (e) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, delta) => {
    if (!enabled) return;
    const { camera } = state;
    const moveSpeed = speed * delta;

    // Pointer lock style yaw/pitch via right-drag
    // We keep it simple: rely on OrbitControls-like built-in if desired later.

    direction.current.set(0, 0, 0);
    if (keys.current['KeyW'] || keys.current['ArrowUp']) direction.current.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) direction.current.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) direction.current.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) direction.current.x += 1;
    if (keys.current['Space']) direction.current.y += 1;
    if (keys.current['ShiftLeft'] || keys.current['ShiftRight']) direction.current.y -= 1;

    if (direction.current.lengthSq() > 0) direction.current.normalize();

    velocity.current.copy(direction.current).multiplyScalar(moveSpeed);

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const up = new THREE.Vector3().copy(camera.up).normalize();

    const deltaPos = new THREE.Vector3();
    deltaPos.addScaledVector(forward, velocity.current.z);
    deltaPos.addScaledVector(right, velocity.current.x);
    deltaPos.addScaledVector(up, velocity.current.y);
    camera.position.add(deltaPos);
  });

  return null;
}

export default function SpaceBackground({ freeCameraEnabled }) {
  return (
    <Canvas
      className="absolute inset-0"
      style={{ position: 'absolute', inset: 0, pointerEvents: freeCameraEnabled ? 'auto' : 'none' }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.1, far: 5000, position: [0, 0, 800] }}
    >
      <color attach="background" args={[0, 0, 0]} />
      <ambientLight intensity={0.2} />
      <Stars />
      <FreeCameraControls enabled={freeCameraEnabled} />
    </Canvas>
  );
}


