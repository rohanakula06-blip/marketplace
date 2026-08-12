'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Sparkles, Grid, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

type Vec3 = [number, number, number];

function OrbitingNode({
  radius,
  speed,
  phase,
  color,
  height,
  size = 0.16,
}: {
  radius: number;
  speed: number;
  phase: number;
  color: string;
  height: number;
  size?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.position.set(Math.cos(t) * radius, height, Math.sin(t) * radius);
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -height, 0]}>
        <cylinderGeometry args={[0.02, 0.02, height, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.35} />
      </mesh>
      <pointLight color={color} intensity={0.35} distance={2.2} />
    </group>
  );
}

function PulseRing({ radius, color, speed = 1 }: { radius: number; color: string; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * speed) * 0.06;
    ref.current.scale.set(s, s, s);
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.22 + Math.sin(clock.elapsedTime * speed) * 0.08;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[radius * 0.92, radius, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DataStream({ from, to, color, offset = 0 }: { from: Vec3; to: Vec3; color: string; offset?: number }) {
  const dotRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 1.2 + Math.abs(from[0] - to[0]) * 0.15;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);

  const linePoints = useMemo(
    () => curve.getPoints(32).map((p) => [p.x, p.y, p.z] as Vec3),
    [curve]
  );

  useFrame(({ clock }) => {
    if (!dotRef.current) return;
    const t = (Math.sin(clock.elapsedTime * 1.4 + offset) + 1) / 2;
    const p = curve.getPoint(t);
    dotRef.current.position.copy(p);
  });

  return (
    <group>
      <Line points={linePoints} color={color} lineWidth={1.2} transparent opacity={0.35} />
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AuthWorld({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const rigRef = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Group>(null);

  const customerNodes = useMemo(
    () => [
      { radius: 3.2, speed: 0.35, phase: 0, height: 0.9, color: '#60a5fa' },
      { radius: 3.2, speed: 0.35, phase: 2.1, height: 1.1, color: '#3b82f6' },
      { radius: 3.2, speed: 0.35, phase: 4.2, height: 0.75, color: '#93c5fd' },
    ],
    []
  );

  const workerNodes = useMemo(
    () => [
      { radius: 3.2, speed: -0.42, phase: 1.0, height: 0.85, color: '#2dd4bf' },
      { radius: 3.2, speed: -0.42, phase: 3.1, height: 1.05, color: '#14b8a6' },
      { radius: 3.2, speed: -0.42, phase: 5.2, height: 0.7, color: '#5eead4' },
    ],
    []
  );

  useFrame(({ clock }) => {
    if (rigRef.current && mouseRef.current) {
      rigRef.current.rotation.y = mouseRef.current.x * 0.18 + clock.elapsedTime * 0.06;
      rigRef.current.rotation.x = mouseRef.current.y * 0.06 - 0.12;
    }
    if (ringA.current) ringA.current.rotation.z = clock.elapsedTime * 0.25;
    if (ringB.current) ringB.current.rotation.x = clock.elapsedTime * 0.18;
    if (coreRef.current) coreRef.current.rotation.y = clock.elapsedTime * 0.35;
  });

  return (
    <>
      <color attach="background" args={['#04060f']} />
      <fog attach="fog" args={['#04060f', 10, 28]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[0, 8, 4]} intensity={0.9} color="#c4d4ff" />
      <pointLight position={[0, 2.5, 0]} intensity={1.4} color="#fbbf24" distance={12} />

      <Sparkles count={90} scale={[14, 6, 14]} size={2.5} speed={0.35} opacity={0.45} color="#fbbf24" />
      <Sparkles count={60} scale={[16, 5, 16]} size={2} speed={0.25} opacity={0.3} color="#38bdf8" />

      <group ref={rigRef} position={[0, -0.6, 0]}>
        <Grid
          position={[0, 0, 0]}
          args={[16, 16]}
          cellSize={0.45}
          cellThickness={0.45}
          cellColor="#1e3a5f"
          sectionSize={2.25}
          sectionThickness={0.9}
          sectionColor="#334155"
          fadeDistance={14}
          fadeStrength={1.2}
          infiniteGrid
        />

        <PulseRing radius={3.2} color="#2563eb" speed={1.1} />
        <PulseRing radius={2.1} color="#f59e0b" speed={1.6} />

        <mesh ref={ringA} rotation={[Math.PI / 2.8, 0.4, 0]}>
          <torusGeometry args={[2.5, 0.03, 16, 100]} />
          <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <mesh ref={ringB} rotation={[Math.PI / 3.2, -0.5, 0.3]}>
          <torusGeometry args={[3.4, 0.025, 16, 100]} />
          <meshStandardMaterial color="#14b8a6" emissive="#0d9488" emissiveIntensity={1.1} toneMapped={false} />
        </mesh>

        <group ref={coreRef} position={[0, 1.35, 0]}>
          <Float speed={1.2} floatIntensity={0.35} rotationIntensity={0.15}>
            <mesh>
              <icosahedronGeometry args={[0.52, 1]} />
              <MeshDistortMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={0.9}
                roughness={0.15}
                metalness={0.6}
                distort={0.28}
                speed={2.5}
                toneMapped={false}
              />
            </mesh>
          </Float>
          <mesh>
            <sphereGeometry args={[0.72, 32, 32]} />
            <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={0.25} transparent opacity={0.12} />
          </mesh>
        </group>

        {customerNodes.map((n, i) => (
          <OrbitingNode key={`c-${i}`} {...n} />
        ))}
        {workerNodes.map((n, i) => (
          <OrbitingNode key={`w-${i}`} {...n} size={0.14} />
        ))}

        <DataStream from={[-3.2, 0.9, 0]} to={[0, 1.35, 0]} color="#60a5fa" offset={0} />
        <DataStream from={[0, 0.9, 3.2]} to={[0, 1.35, 0]} color="#3b82f6" offset={1.2} />
        <DataStream from={[3.2, 0.85, 0]} to={[0, 1.35, 0]} color="#2dd4bf" offset={2.1} />
        <DataStream from={[0, 0.8, -3.2]} to={[0, 1.35, 0]} color="#14b8a6" offset={0.7} />
      </group>
    </>
  );
}

export function AuthScene() {
  const mouseRef = useRef({ x: 0, y: 0 });

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 3.2, 8.5], fov: 38 }}
        onPointerMove={(e) => {
          mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
        }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <AuthWorld mouseRef={mouseRef} />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 auth-scene-overlay pointer-events-none" />
    </div>
  );
}

export function AuthSceneFallback() {
  return (
    <div className="absolute inset-0 z-0 bg-[#04060f]">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 45%, #f59e0b28 0%, transparent 40%), radial-gradient(circle at 20% 60%, #2563eb22 0%, transparent 35%), radial-gradient(circle at 80% 55%, #14b8a622 0%, transparent 35%)',
        }}
      />
    </div>
  );
}
