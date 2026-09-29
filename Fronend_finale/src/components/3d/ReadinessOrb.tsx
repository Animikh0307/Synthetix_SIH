import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { bandText } from "@/components/risk";
import { BAND_LABEL, type Assessment } from "@/lib/personnel-data";
import { Scene } from "./Scene";

type ReadinessOrbProps = {
  score: number;
  band: Assessment["band"];
};

/** Standalone for now; swap for the shared hook once
 * `src/hooks/useReducedMotion.ts` exists (same note as the other 3d/ files). */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Approximate hex equivalents of the app's own band tokens (--color-low,
// --color-mid, --color-high, --color-red-alert in styles.css) — hardcoded
// because these feed WebGL materials, not the DOM. Swap for a
// `getComputedStyle` read via a shared `useThemeColor` hook if the
// palette needs to stay perfectly in sync automatically.
const BAND_COLOR_HEX: Record<Assessment["band"], string> = {
  low: "#6cc79a",
  elevated: "#d8b673",
  high: "#e0793f",
  red: "#d1453e",
};

/** How urgently each band should animate, independent of the exact
 * score. This scales *how* the score-driven motion looks — it never
 * invents or overrides score/band themselves. Red is deliberately the
 * outlier ("a red pulse" in the brief); low/elevated/high stay calm. */
const BAND_URGENCY: Record<Assessment["band"], number> = {
  low: 0.15,
  elevated: 0.35,
  high: 0.6,
  red: 1,
};

const PARTICLE_COUNT = 140;

/** A small halo of particles orbiting the sphere, tinted to the current
 * band. Positions are generated once on mount — cheap, and cheaper
 * still since they never change after that; only the group's rotation
 * is touched per frame. */
function OrbParticles({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const positions = useMemo(() => {
    const array = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Roughly a shell between the sphere and the outer ring, so
      // particles read as "orbiting" rather than scattered at random.
      const radius = 1.35 + Math.random() * 0.55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      array[i3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      array[i3 + 2] = radius * Math.cos(phi) * 0.4; // flattened toward the camera
    }
    return array;
  }, []);

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={groupRef}>
      <points raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={color}
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

function OrbVisual({
  score,
  band,
  reducedMotion,
}: {
  score: number;
  band: Assessment["band"];
  reducedMotion: boolean;
}) {
  const color = BAND_COLOR_HEX[band];
  const urgency = BAND_URGENCY[band];
  // 0-1, purely to modulate how strongly the existing animation runs —
  // never to alter the score/band values themselves.
  const severity = Math.max(0, Math.min(1, score / 100));

  const sphereRef = useRef<THREE.Mesh>(null);
  const sphereMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const energyRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulseSpeed = 0.6 + urgency * 1.8 + severity * 0.6;
    const pulseAmplitude = 0.03 + urgency * 0.09;

    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(
        reducedMotion ? 1 : 1 + Math.sin(t * pulseSpeed) * pulseAmplitude,
      );
    }
    if (sphereMaterialRef.current) {
      const base = 0.55 + severity * 0.5;
      sphereMaterialRef.current.emissiveIntensity = reducedMotion
        ? base
        : base + Math.sin(t * pulseSpeed) * (0.15 + urgency * 0.25);
    }
    if (ringRef.current && !reducedMotion) {
      ringRef.current.rotation.z += 0.0016 + severity * 0.001;
    }
    if (energyRingRef.current && !reducedMotion) {
      energyRingRef.current.rotation.z -= 0.006 + urgency * 0.01;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 2.5]} intensity={1.1} color={color} distance={6} />

      {/* Central sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.85, 48, 48]} />
        <meshStandardMaterial
          ref={sphereMaterialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>

      {/* Outer ring — structural, near-static */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.35, 0.02, 16, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* Animated energy ring — a moving arc, distinct from the static ring above */}
      <mesh ref={energyRingRef} rotation={[Math.PI / 2.4, 0, 0]}>
        <ringGeometry args={[1.1, 1.14, 64, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <OrbParticles color={color} reducedMotion={reducedMotion} />
    </>
  );
}

/**
 * Reusable readiness visualization: a glowing sphere + rings + a small
 * orbiting particle halo, colored and animated entirely by the real
 * `score`/`band` passed in. Owns its own <Scene> (camera/lighting/fog),
 * so it can drop into any square-ish slot — the check-in result panel,
 * the commander's selected-personnel aside, etc.
 *
 * The numeric score and band label render as plain HTML in an overlay
 * div, not inside the canvas — they stay selectable and readable even
 * if WebGL is unavailable, per the brief.
 *
 * Never fabricates or overrides score/band: both are read straight from
 * whatever the caller passes in (the real Assessment), and the
 * `Assessment` type itself is only imported here, never changed.
 */
export function ReadinessOrb({ score, band }: ReadinessOrbProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative aspect-square w-full">
      <Scene fov={38} cameraDistance={3.4}>
        <OrbVisual score={score} band={band} reducedMotion={reducedMotion} />
      </Scene>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`font-mono text-5xl font-semibold ${bandText[band]}`}>{score}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-ink">
            {BAND_LABEL[band]}
          </div>
        </div>
      </div>
    </div>
  );
}
