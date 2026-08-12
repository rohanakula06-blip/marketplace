'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Line } from '@react-three/drei';
import * as THREE from 'three';

function Building({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

function Pin({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2) * 0.15;
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <pointLight color={color} intensity={0.5} distance={3} />
    </group>
  );
}

function WorkerFigure({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={1.5} floatIntensity={0.3}>
      <group position={position}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.5, 8, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#fcd9b6" />
        </mesh>
      </group>
    </Float>
  );
}

function Route({ points, color }: { points: [number, number, number][]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.visible = Math.sin(clock.elapsedTime) > -0.3;
  });
  return (
    <group ref={ref}>
      <Line points={points} color={color} lineWidth={2} transparent opacity={0.6} />
    </group>
  );
}

function Vehicle({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = (Math.sin(clock.elapsedTime * 0.5) + 1) / 2;
      ref.current.position.x = THREE.MathUtils.lerp(start[0], end[0], t);
      ref.current.position.z = THREE.MathUtils.lerp(start[2], end[2], t);
    }
  });
  return (
    <mesh ref={ref} position={start}>
      <boxGeometry args={[0.3, 0.15, 0.5]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
    </mesh>
  );
}

function Scene({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouseX * 0.15 + Math.sin(clock.elapsedTime * 0.1) * 0.05;
      groupRef.current.rotation.x = mouseY * 0.05;
    }
  });

  const buildings = useMemo(() => [
    { pos: [-4, 0.6, -2] as [number, number, number], size: [1.2, 1.2, 1.2] as [number, number, number], color: '#1e3a5f' },
    { pos: [-2.5, 0.8, 1] as [number, number, number], size: [1, 1.6, 1] as [number, number, number], color: '#1e40af' },
    { pos: [-1, 0.5, -1] as [number, number, number], size: [0.8, 1, 0.8] as [number, number, number], color: '#334155' },
    { pos: [0, 0.7, 0.5] as [number, number, number], size: [1.5, 1.4, 1] as [number, number, number], color: '#0f766e' },
    { pos: [2, 0.55, -1.5] as [number, number, number], size: [1, 1.1, 0.9] as [number, number, number], color: '#1e3a5f' },
    { pos: [3.5, 0.9, 1] as [number, number, number], size: [1.1, 1.8, 1.1] as [number, number, number], color: '#1e40af' },
    { pos: [5, 0.4, 0] as [number, number, number], size: [0.9, 0.8, 0.9] as [number, number, number], color: '#334155' },
  ], []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow color="#93c5fd" />
      <pointLight position={[-3, 3, 2]} intensity={0.5} color="#14b8a6" />
      <pointLight position={[4, 3, -2]} intensity={0.5} color="#f59e0b" />
      <Stars radius={80} depth={40} count={2000} factor={3} saturation={0} fade speed={0.5} />

      <group ref={groupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0c1222" roughness={0.9} />
        </mesh>

        {buildings.map((b, i) => (
          <Building key={i} position={b.pos} size={b.size} color={b.color} />
        ))}

        {/* Customer pins (left) */}
        <Pin position={[-3.5, 1.5, 0.5]} color="#60a5fa" />
        <Pin position={[-2, 1.2, -0.5]} color="#60a5fa" />
        <Pin position={[-4.5, 1.8, -1]} color="#60a5fa" />

        {/* Worker pins (right) */}
        <Pin position={[3, 1.5, 0]} color="#2dd4bf" />
        <Pin position={[4.5, 1.3, -0.8]} color="#2dd4bf" />
        <Pin position={[2.5, 1.6, 1.2]} color="#2dd4bf" />

        {/* Workers */}
        <WorkerFigure position={[-3, 0, 1.5]} color="#2563eb" />
        <WorkerFigure position={[4, 0, 0.5]} color="#0d9488" />
        <WorkerFigure position={[1.5, 0, -2]} color="#7c3aed" />

        {/* Routes connecting demand & skill */}
        <Route points={[[-3.5, 1.5, 0.5], [-1, 1, 0], [1, 0.8, 0], [3, 1.5, 0]]} color="#fbbf24" />
        <Route points={[[-2, 1.2, -0.5], [0.5, 0.9, -0.5], [4.5, 1.3, -0.8]]} color="#f97316" />

        <Vehicle start={[-5, 0.1, 2]} end={[5, 0.1, -2]} />
      </group>
    </>
  );
}

export function HeroScene() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        camera={{ position: [0, 4, 8], fov: 50 }}
        onPointerMove={(e) => {
          mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
          mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene mouseX={mouse.current.x} mouseY={mouse.current.y} />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/40 via-[#0a0f1e]/60 to-[#0a0f1e] pointer-events-none" />
    </div>
  );
}

export function HeroSceneFallback() {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0c4a6e]">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 30% 50%, #2563eb33 0%, transparent 50%), radial-gradient(circle at 70% 50%, #14b8a633 0%, transparent 50%)',
      }} />
    </div>
  );
}
