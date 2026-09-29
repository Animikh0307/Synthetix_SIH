import { Grid } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type HolographicGridProps = {
  /** Vertical position of the grid plane, relative to the rest of the
   * scene content. Defaults to sitting below it, like a floor. */
  y?: number;
};

/** Fewer accent points on phone-class GPUs. Matches the breakpoint used
 * elsewhere in the 3D layer; fold into `useResponsive3D.ts` once it exists. */
const MOBILE_BREAKPOINT = 768;
const DESKTOP_ACCENT_COUNT = 14;
const MOBILE_ACCENT_COUNT = 6;

function useAccentCount() {
  const [count, setCount] = useState(DESKTOP_ACCENT_COUNT);
  useEffect(() => {
    const update = () =>
      setCount(window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_ACCENT_COUNT : DESKTOP_ACCENT_COUNT);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

/** Standalone for now; swap for the shared hook once
 * `src/hooks/useReducedMotion.ts` exists (same note as Scene.tsx / ParticleField.tsx). */
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

// Reuse the exact same gold/green as ParticleField so every 3D surface
// reads as one consistent accent language, not several near-matches.
const GOLD = new THREE.Color("#d8b673");
const GREEN = new THREE.Color("#6cc79a");

/**
 * Lays out accent-point transforms once per count. A THREE.Matrix4/Color
 * per point is built here (not per frame) purely as init data for the
 * instanced mesh below.
 */
function useAccentInstances(count: number) {
  return useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3 + (i % 3) * 1.4;
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        0.01,
        Math.sin(angle) * radius - 2,
      );
      matrices.push(new THREE.Matrix4().setPosition(position));
      // Mostly gold (the primary accent), green as the occasional
      // "normal/OK" marker — matching the app's own semantic use of green.
      colors.push(i % 3 === 0 ? GREEN : GOLD);
    }
    return { matrices, colors };
  }, [count]);
}

/**
 * Tactical floor grid for the command-center 3D background. Render as a
 * child of <Scene>, sitting below other content (a login hero, an orb,
 * a radar) rather than competing with it.
 *
 * Deliberately restrained to read as a technical instrument, not a game
 * environment: the grid itself uses drei's `Grid` helper (a single
 * shader-based plane, not hand-built line geometry) in muted navy with
 * gold section lines matching the app's own tokens; distance fade keeps
 * it from tiling to infinity in a distracting way. A small ring of
 * gold/green points marks it as "instrumented" without any lasers,
 * scanlines, or neon.
 *
 * The only animation is a slow, shared opacity breathe on the accent
 * points (one material, one number updated per frame — no per-point
 * work, no new objects allocated in the loop). It stops completely under
 * reduced motion, leaving a static grid.
 */
export function HolographicGrid({ y = -2 }: HolographicGridProps) {
  const accentCount = useAccentCount();
  const reducedMotion = usePrefersReducedMotion();
  const { matrices, colors } = useAccentInstances(accentCount);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    colors.forEach((color, i) => mesh.setColorAt(i, color));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  useFrame((state) => {
    if (reducedMotion) return;
    const material = meshRef.current?.material as THREE.MeshBasicMaterial | undefined;
    if (!material) return;
    material.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 0.6) * 0.2;
  });

  return (
    <group position={[0, y, 0]}>
      <Grid
        args={[24, 24]}
        cellSize={0.6}
        cellThickness={0.4}
        cellColor="#2a3348"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#8a703f"
        fadeDistance={22}
        fadeStrength={1.4}
        followCamera={false}
        infiniteGrid
      />
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, accentCount]}
        raycast={() => null}
      >
        <circleGeometry args={[0.05, 12]} />
        <meshBasicMaterial transparent opacity={0.6} vertexColors toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
