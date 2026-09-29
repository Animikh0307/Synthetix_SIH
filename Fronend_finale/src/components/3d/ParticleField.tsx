import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type ParticleFieldProps = {
  /** Override the auto-picked particle count (desktop/mobile defaults below). */
  count?: number;
};

/** Below this width, particle count drops for phone-class GPUs. Matches the
 * breakpoint Scene.tsx uses; fold both into `useResponsive3D.ts` once that
 * shared hook exists. */
const MOBILE_BREAKPOINT = 768;
const DESKTOP_COUNT = 2400;
const MOBILE_COUNT = 800;

function useParticleCount(override?: number) {
  const [count, setCount] = useState(DESKTOP_COUNT);

  useEffect(() => {
    if (override !== undefined) return;
    const update = () =>
      setCount(window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_COUNT : DESKTOP_COUNT);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [override]);

  return override ?? count;
}

/** Standalone for now; swap for the shared hook once
 * `src/hooks/useReducedMotion.ts` exists (same note as in Scene.tsx). */
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

/** Approximate hex equivalents of the app's OKLCH design tokens
 * (--color-accent-gold, --color-low, --color-muted-ink in styles.css).
 * Hardcoded because this feeds a WebGL vertex color buffer, not the DOM —
 * if the palette needs to stay perfectly in sync automatically, read
 * these via `getComputedStyle` in a shared `useThemeColor` hook instead. */
const GOLD = new THREE.Color("#d8b673");
const GREEN = new THREE.Color("#6cc79a");
const NEUTRAL = new THREE.Color("#9aa3b8");

/**
 * Builds the position/color buffers once per particle count. Pure typed
 * arrays — no scene objects are constructed here — so recomputing this
 * on the rare occasion `count` changes (e.g. an orientation change
 * crossing the mobile breakpoint) is cheap.
 */
function useParticleGeometry(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread wide in x/y, biased toward depth (negative z) so perspective
      // and the fog set up in Scene.tsx do the work of reading as "depth"
      // rather than a flat wall of dots.
      positions[i3] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 9;
      positions[i3 + 2] = Math.random() * -12 + 1;

      // ~80% neutral, ~12% gold, ~8% green — highlights, not the majority,
      // per "subtle particles" + "gold/green highlights".
      const roll = Math.random();
      const color = roll < 0.12 ? GOLD : roll < 0.2 ? GREEN : NEUTRAL;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, colors };
  }, [count]);
}

/**
 * Decorative particle field for the command-center 3D background. Render
 * as a child of <Scene>. Carries no application state and is never a hit
 * target: `raycast={() => null}` opts the points object out of
 * raycasting entirely, so it cannot intercept clicks meant for real UI,
 * and it attaches no pointer handlers of its own.
 *
 * Movement is a single slow group rotation plus gentle vertical drift —
 * not per-particle animation. That's one rotation write and one position
 * write per frame, no new Three.js objects allocated in the loop, and it
 * stops completely (fully static field) when reduced motion is on.
 *
 * Geometry/material are plain JSX elements owned by this component, so
 * React Three Fiber disposes them automatically on unmount — no manual
 * cleanup needed, no leaked GPU buffers across route changes.
 */
export function ParticleField({ count }: ParticleFieldProps) {
  const resolvedCount = useParticleCount(count);
  const reducedMotion = usePrefersReducedMotion();
  const { positions, colors } = useParticleGeometry(resolvedCount);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.018;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.15;
  });

  return (
    <group ref={groupRef}>
      <points raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
