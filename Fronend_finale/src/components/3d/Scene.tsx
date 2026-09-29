import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, type ReactNode } from "react";

type SceneProps = {
  /** 3D content: meshes, particles, extra lights, etc. */
  children: ReactNode;
  /** Classes for the wrapping <div>. Defaults to a full-bleed absolute layer
   * that never blocks clicks/scroll on the real UI behind it. */
  className?: string;
  /** Camera field of view in degrees. Auto-picked from viewport width when omitted. */
  fov?: number;
  /** Camera distance from the origin along +z. Auto-picked from viewport width when omitted. */
  cameraDistance?: number;
};

/**
 * True once mounted on the client. TanStack Start renders this route tree
 * on the server first; delaying the <Canvas> until after mount avoids an
 * SSR/hydration mismatch (no `window` on the server, and WebGL context
 * creation must happen in the browser regardless).
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Mirrors the OS/browser "reduce motion" accessibility setting. This is a
 * standalone read for now; once `src/hooks/useReducedMotion.ts` exists as
 * its own shared hook, swap this out for that import so every 3D component
 * reads the same source of truth.
 */
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

/** Below this width the camera backs off and widens slightly so 3D content
 * stays framed on phones. Matches the app's own `md` breakpoint rather than
 * introducing a new one. Standalone for now; fold into
 * `src/hooks/useResponsive3D.ts` once that hook exists. */
const MOBILE_BREAKPOINT = 768;

function useResponsiveCamera(fovProp: number | undefined, distanceProp: number | undefined) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return {
    fov: fovProp ?? (isMobile ? 55 : 45),
    distance: distanceProp ?? (isMobile ? 7 : 6),
  };
}

/**
 * Shared React Three Fiber canvas used across the login hero, the
 * readiness orb (check-in) and the risk radar (commander).
 *
 * - Transparent background: composites over the existing dark-navy /
 *   glass UI. This component never owns page background color.
 * - Renders nothing until mounted client-side, and nothing at all if
 *   WebGL is unavailable is NOT handled here — pair each call site with
 *   `<WebGLFallback>` for that; this component assumes a working context.
 * - Pointer events are off on the wrapper by default so the canvas never
 *   blocks clicks on real buttons/forms behind or beside it. Individual
 *   meshes that need hover/click can opt back in locally.
 * - No wheel/drag camera controls are attached, so page scroll is
 *   untouched; `touchAction: "pan-y"` on the canvas element makes that
 *   explicit for touch devices too.
 */
export function Scene({ children, className, fov, cameraDistance }: SceneProps) {
  const mounted = useMounted();
  const reducedMotion = usePrefersReducedMotion();
  const { fov: resolvedFov, distance } = useResponsiveCamera(fov, cameraDistance);

  if (!mounted) return null;

  return (
    <div
      className={className ?? "pointer-events-none absolute inset-0"}
      data-reduced-motion={reducedMotion}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, distance], fov: resolvedFov }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", touchAction: "pan-y" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 5]} intensity={1} />
        <directionalLight position={[-4, -2, -3]} intensity={0.25} color="#6b7cff" />
        {/* Subtle depth cue, not a visual centerpiece — dark enough to read
            against the app's near-black background at any zoom level. */}
        <fog attach="fog" args={["#0b0e1a", distance + 2, distance + 14]} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
