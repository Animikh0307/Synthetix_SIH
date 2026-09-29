import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { bandText, DriverBars } from "@/components/risk";
import { bandOf, type Assessment, type RiskDriver } from "@/lib/personnel-data";
import { Scene } from "./Scene";

type RiskRadarProps = {
  drivers: RiskDriver[];
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

/** Same breakpoint used elsewhere in the 3D layer; fold into
 * `useResponsive3D.ts` once that shared hook exists. */
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return isMobile;
}

/**
 * One-time WebGL capability check. `null` means "not checked yet"
 * (nothing 3D-shaped is rendered for that one tick); `false` is the
 * signal to use the accessible 2D fallback instead of guessing or
 * rendering a broken canvas.
 */
function useWebglSupported() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(Boolean(gl));
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

// Approximate hex equivalents of the app's own band tokens — see the same
// note in ReadinessOrb.tsx. Kept in sync with that file's values by hand
// for now; consolidate into one shared constants module if these ever
// need to move together.
const BAND_COLOR_HEX: Record<Assessment["band"], string> = {
  low: "#6cc79a",
  elevated: "#d8b673",
  high: "#e0793f",
  red: "#d1453e",
};

const INNER_RADIUS = 0.5;
const MAX_BAR_LENGTH = 1.05;
const BAR_WIDTH = 0.07;
const BAR_DEPTH = 0.07;

/**
 * One radial bar + tip point + label for a single driver. Owns its own
 * `useFrame` so each bar eases toward its real target length
 * independently — the target itself is always `driver.value`, read
 * fresh on every render; nothing here invents a number.
 */
function RadarBar({
  label,
  value,
  angle,
  color,
  reducedMotion,
}: {
  label: string;
  value: number;
  angle: number;
  color: string;
  reducedMotion: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const targetLength = (clamped / 100) * MAX_BAR_LENGTH;
  const currentLength = useRef(reducedMotion ? targetLength : 0);

  const barRef = useRef<THREE.Mesh>(null);
  const tipRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);

  const rotationZ = angle - Math.PI / 2;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  useFrame((_, delta) => {
    if (reducedMotion) {
      currentLength.current = targetLength;
    } else {
      // Ease toward whatever the real value currently is — this is the
      // "animated" part. If `value` changes (a new check-in, a
      // commander action recalculating the score), the bar smoothly
      // retargets instead of snapping.
      currentLength.current += (targetLength - currentLength.current) * Math.min(1, delta * 3.2);
    }

    const length = currentLength.current;
    const mid = INNER_RADIUS + length / 2;
    const tipDistance = INNER_RADIUS + length;

    if (barRef.current) {
      barRef.current.position.set(dirX * mid, dirY * mid, 0);
      barRef.current.scale.y = Math.max(0.001, length);
    }
    if (tipRef.current) {
      tipRef.current.position.set(dirX * tipDistance, dirY * tipDistance, 0);
    }
    if (labelRef.current) {
      const labelDistance = tipDistance + 0.24;
      labelRef.current.position.set(dirX * labelDistance, dirY * labelDistance, 0);
    }
  });

  const band = bandOf(clamped);

  return (
    <group>
      <mesh ref={barRef} rotation={[0, 0, rotationZ]}>
        <boxGeometry args={[BAR_WIDTH, 1, BAR_DEPTH]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>
      <mesh ref={tipRef} raycast={() => null}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* Real DOM text, not canvas text — screen-reader visible, and
          legible at any zoom level regardless of the 3D scene's scale. */}
      <group ref={labelRef}>
        <Html center distanceFactor={6} occlude={false}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-line bg-ink/85 px-2 py-0.5 font-mono text-[9px] text-paper">
            {label} <span className={bandText[band]}>{clamped}</span>
          </div>
        </Html>
      </group>
    </group>
  );
}

/**
 * 3D risk radar: real Assessment.drivers laid out as animated bars
 * radiating from a central readiness core. Render standalone (it owns
 * its own <Scene>) — drop it into the commander's selected-personnel
 * panel alongside the existing <DriverBars>, both reading the same
 * `selected.drivers` array.
 *
 * Never invents drivers or values: with no data it shows an explicit
 * empty state rather than a placeholder radar, and every bar's target
 * length comes straight from the matching `RiskDriver.value`.
 *
 * Accessibility: driver labels are real HTML (via drei's <Html>), so
 * they're screen-reader visible even in 3D mode. When WebGL isn't
 * available at all, this renders the app's own existing <DriverBars> —
 * the same accessible semantic markup already used elsewhere for this
 * exact data — instead of a broken or blank canvas.
 */
export function RiskRadar({ drivers }: RiskRadarProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const webglSupported = useWebglSupported();

  if (drivers.length === 0) {
    return (
      <div className="grid min-h-[200px] place-items-center rounded-2xl border border-dashed border-line text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-ink">
          No driver data available
        </p>
      </div>
    );
  }

  if (webglSupported === false) {
    return (
      <div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-muted-ink">
          Risk contributors
        </p>
        <DriverBars drivers={drivers} />
      </div>
    );
  }

  // Not checked yet — skip rendering the 3D scene for this one tick
  // rather than flashing it before we know WebGL actually works.
  if (webglSupported === null) return null;

  const scale = isMobile ? 0.72 : 1;

  return (
    <div className="relative aspect-square w-full" style={{ minHeight: isMobile ? 240 : 320 }}>
      <Scene fov={42} cameraDistance={4.4}>
        <group scale={scale}>
          <ambientLight intensity={0.45} />
          <pointLight position={[0, 0, 3]} intensity={0.9} color="#d8b673" distance={7} />

          {/* Central readiness core — a neutral gold hub. This component
              only receives driver data (no score/band), so the core
              itself isn't risk-colored; it's just the point everything
              radiates from. */}
          <mesh>
            <sphereGeometry args={[0.32, 32, 32]} />
            <meshStandardMaterial
              color="#d8b673"
              emissive="#d8b673"
              emissiveIntensity={0.5}
              roughness={0.35}
              metalness={0.25}
            />
          </mesh>

          {drivers.map((driver, index) => {
            const angle = (index / drivers.length) * Math.PI * 2;
            const band = bandOf(Math.max(0, Math.min(100, driver.value)));
            return (
              <RadarBar
                key={driver.label}
                label={driver.label}
                value={driver.value}
                angle={angle}
                color={BAND_COLOR_HEX[band]}
                reducedMotion={reducedMotion}
              />
            );
          })}
        </group>
      </Scene>
    </div>
  );
}
