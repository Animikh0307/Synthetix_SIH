import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type FloatingShieldProps = {
  scale?: number;
  position?: [number, number, number];
};

const MOBILE_BREAKPOINT = 768;

const DESKTOP_SCALE = 1;
const MOBILE_SCALE = 0.68;

const GLASS_COLOR = "#12151f";
const GLASS_EMISSIVE = "#1c2440";

const EDGE_COLOR = "#d8b673";
const CORE_GLOW_COLOR = "#f4e4b8";

const EXTRUDE_DEPTH = 0.22;
const BEVEL_THICKNESS = 0.05;
const BEVEL_SIZE = 0.045;

/* -----------------------------------------------------------
   RESPONSIVE SCALE
----------------------------------------------------------- */

function useResponsiveScale(override?: number) {
  const [scale, setScale] = useState(DESKTOP_SCALE);

  useEffect(() => {
    if (override !== undefined) return;

    const update = () => {
      setScale(
        window.innerWidth < MOBILE_BREAKPOINT
          ? MOBILE_SCALE
          : DESKTOP_SCALE,
      );
    };

    update();

    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, [override]);

  return override ?? scale;
}

/* -----------------------------------------------------------
   REDUCED MOTION
----------------------------------------------------------- */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const update = () => {
      setReduced(media.matches);
    };

    update();

    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  return reduced;
}

/* -----------------------------------------------------------
   SHIELD SHAPE
----------------------------------------------------------- */

function useShieldShape() {
  return useMemo(() => {
    const shape = new THREE.Shape();

    shape.moveTo(-1, 1.05);
    shape.lineTo(1, 1.05);

    shape.bezierCurveTo(
      1,
      0.35,
      1.05,
      -0.2,
      0.85,
      -0.68,
    );

    shape.bezierCurveTo(
      0.6,
      -1.25,
      0.25,
      -1.6,
      0,
      -1.8,
    );

    shape.bezierCurveTo(
      -0.25,
      -1.6,
      -0.6,
      -1.25,
      -0.85,
      -0.68,
    );

    shape.bezierCurveTo(
      -1.05,
      -0.2,
      -1,
      0.35,
      -1,
      1.05,
    );

    return shape;
  }, []);
}

/* -----------------------------------------------------------
   3D SHIELD GEOMETRY
----------------------------------------------------------- */

function useShieldGeometry(shape: THREE.Shape) {
  return useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape, {
        depth: EXTRUDE_DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL_THICKNESS,
        bevelSize: BEVEL_SIZE,
        bevelSegments: 5,
        curveSegments: 32,
      }),
    [shape],
  );
}

function useFlatShieldGeometry(shape: THREE.Shape) {
  return useMemo(
    () => new THREE.ShapeGeometry(shape, 32),
    [shape],
  );
}

/* -----------------------------------------------------------
   ORIGINAL RAKSHAMITRA EMBLEM
----------------------------------------------------------- */

function ShieldLogo() {
  const texture = useTexture(
    "/rakshamitra-emblem.png",
  );

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: {
          value: texture,
        },
      },

      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform sampler2D uMap;

        varying vec2 vUv;

        void main() {

          vec4 tex =
            texture2D(uMap, vUv);

          /*
           * Preserve the actual RakshaMitra emblem.
           *
           * Only remove the near-white background
           * if the PNG contains one.
           */
          if (
            tex.r > 0.92 &&
            tex.g > 0.92 &&
            tex.b > 0.92
          ) {
            discard;
          }

          gl_FragColor =
            vec4(
              tex.rgb,
              tex.a
            );
        }
      `,

      transparent: true,
      depthWrite: false,
      depthTest: true,

      side: THREE.DoubleSide,

      toneMapped: false,
    });
  }, [texture]);

  return (
    <mesh
      position={[
        0,
        0,
        EXTRUDE_DEPTH +
          BEVEL_THICKNESS +
          0.035,
      ]}
      scale={[0.62, 0.62, 0.62]}
      raycast={() => null}
      renderOrder={10}
    >
      <planeGeometry args={[2, 2]} />

      <primitive
        object={material}
        attach="material"
      />
    </mesh>
  );
}

/* -----------------------------------------------------------
   GOLD SHINE
   IMPORTANT:
   Shine is behind the logo.
----------------------------------------------------------- */

function ShieldShine({
  geometry,
  reducedMotion,
}: {
  geometry: THREE.ShapeGeometry;
  reducedMotion: boolean;
}) {
  const materialRef =
    useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0,
        },
      },

      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform float uTime;

        varying vec2 vUv;

        void main() {

          /*
           * Slow diagonal sweep.
           */
          float progress =
            fract(uTime * 0.12);

          float diagonal =
            vUv.x + vUv.y;

          float center =
            progress * 2.4 - 0.45;

          float distanceFromShine =
            abs(
              diagonal - center
            );

          float shine =
            1.0 -
            smoothstep(
              0.0,
              0.18,
              distanceFromShine
            );

          shine =
            pow(
              shine,
              3.0
            );

          /*
           * Keep it subtle.
           */
          float alpha =
            shine * 0.28;

          vec3 gold =
            vec3(
              1.0,
              0.78,
              0.34
            );

          gl_FragColor =
            vec4(
              gold,
              alpha
            );
        }
      `,

      transparent: true,
      depthWrite: false,
      depthTest: true,

      blending:
        THREE.AdditiveBlending,

      toneMapped: false,

      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value =
      reducedMotion
        ? 0
        : state.clock.elapsedTime;
  });

  return (
    <mesh
      geometry={geometry}
      position={[
        0,
        0,
        EXTRUDE_DEPTH +
          BEVEL_THICKNESS +
          0.018,
      ]}
      scale={0.96}
      raycast={() => null}
      renderOrder={5}
    >
      <primitive
        ref={materialRef}
        object={material}
        attach="material"
      />
    </mesh>
  );
}

/* -----------------------------------------------------------
   MAIN SHIELD
----------------------------------------------------------- */

export function FloatingShield({
  scale,
  position = [0, 0, 0],
}: FloatingShieldProps) {
  const resolvedScale =
    useResponsiveScale(scale);

  const reducedMotion =
    usePrefersReducedMotion();

  const shape =
    useShieldShape();

  const shieldGeometry =
    useShieldGeometry(shape);

  const flatGeometry =
    useFlatShieldGeometry(shape);

  const groupRef =
    useRef<THREE.Group>(null);

  const coreMaterialRef =
    useRef<THREE.MeshBasicMaterial>(null);

  const edgeMaterialRef =
    useRef<THREE.MeshStandardMaterial>(null);

  /*
   * Mouse position.
   *
   * -1 = left/top
   *  0 = center
   * +1 = right/bottom
   */
  const mouseTarget = useRef({
    x: 0,
    y: 0,
  });

  /*
   * Smoothed mouse position.
   */
  const mouseCurrent = useRef({
    x: 0,
    y: 0,
  });

  /* ---------------------------------------------------------
     MOUSE TRACKER
  --------------------------------------------------------- */

  useEffect(() => {
    if (reducedMotion) return;

    const handlePointerMove = (
      event: PointerEvent,
    ) => {
      /*
       * Disable the effect on touch/mobile.
       */
      if (
        window.innerWidth <
        MOBILE_BREAKPOINT
      ) {
        mouseTarget.current.x = 0;
        mouseTarget.current.y = 0;
        return;
      }

      mouseTarget.current.x =
        (event.clientX /
          window.innerWidth) *
          2 -
        1;

      mouseTarget.current.y =
        (event.clientY /
          window.innerHeight) *
          2 -
        1;
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );
    };
  }, [reducedMotion]);

  /* ---------------------------------------------------------
     MATERIALS
  --------------------------------------------------------- */

  const materials = useMemo(
    () => [
      /*
       * Main shield face.
       */
      new THREE.MeshPhysicalMaterial({
        color: GLASS_COLOR,

        metalness: 0.76,
        roughness: 0.24,

        clearcoat: 0.85,
        clearcoatRoughness: 0.12,

        emissive: GLASS_EMISSIVE,
        emissiveIntensity: 0.18,
      }),

      /*
       * Gold bevel / rim.
       */
      new THREE.MeshStandardMaterial({
        color: EDGE_COLOR,

        metalness: 0.95,
        roughness: 0.2,

        emissive: EDGE_COLOR,
        emissiveIntensity: 0.4,
      }),
    ],
    [],
  );

  /* ---------------------------------------------------------
     ANIMATION
  --------------------------------------------------------- */

  useFrame((state) => {
    const group =
      groupRef.current;

    if (!group) return;

    const t =
      state.clock.elapsedTime;

    if (reducedMotion) {
      group.position.set(
        position[0],
        position[1],
        position[2],
      );

      group.rotation.set(
        0,
        0,
        0,
      );

      return;
    }

    /* -------------------------------------------------------
       SMOOTH MOUSE
    ------------------------------------------------------- */

    mouseCurrent.current.x =
      THREE.MathUtils.lerp(
        mouseCurrent.current.x,
        mouseTarget.current.x,
        0.055,
      );

    mouseCurrent.current.y =
      THREE.MathUtils.lerp(
        mouseCurrent.current.y,
        mouseTarget.current.y,
        0.055,
      );

    const mx =
      mouseCurrent.current.x;

    const my =
      mouseCurrent.current.y;

    /* -------------------------------------------------------
       NATURAL FLOAT
    ------------------------------------------------------- */

    const floatingY =
      Math.sin(t * 0.35) *
      0.10;

    const floatingX =
      Math.sin(t * 0.22) *
      0.025;

    const floatingZ =
      Math.cos(t * 0.18) *
      0.025;

    /* -------------------------------------------------------
       MOUSE MOVEMENT
       This makes the SHIELD itself follow the pointer.
    ------------------------------------------------------- */

    const pointerX =
      mx * 0.16;

    const pointerY =
      -my * 0.10;

    const pointerZ =
      Math.abs(mx) *
      0.025;

    /* -------------------------------------------------------
       POSITION
    ------------------------------------------------------- */

    group.position.x =
      position[0] +
      floatingX +
      pointerX;

    group.position.y =
      position[1] +
      floatingY +
      pointerY;

    group.position.z =
      position[2] +
      floatingZ +
      pointerZ;

    /* -------------------------------------------------------
       3D TILT
    ------------------------------------------------------- */

    group.rotation.y =
      Math.sin(t * 0.12) *
        0.055 +
      mx * 0.18;

    group.rotation.x =
      Math.sin(t * 0.09) *
        0.025 -
      my * 0.12;

    group.rotation.z =
      Math.sin(t * 0.16) *
      0.012;

    /* -------------------------------------------------------
       GOLD RIM BREATHING
    ------------------------------------------------------- */

    if (edgeMaterialRef.current) {
      edgeMaterialRef.current.emissiveIntensity =
        0.34 +
        Math.sin(t * 0.8) *
        0.08;
    }

    /* -------------------------------------------------------
       INNER GLOW
    ------------------------------------------------------- */

    if (coreMaterialRef.current) {
      coreMaterialRef.current.opacity =
        0.26 +
        Math.sin(t * 0.5) *
        0.07;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={resolvedScale}
    >
      {/* =====================================================
          1. REAL 3D SHIELD BODY
         ===================================================== */}

      <mesh
        geometry={shieldGeometry}
        material={materials}
      />

      {/* =====================================================
          2. INNER GLOW
         ===================================================== */}

      <mesh
        geometry={flatGeometry}
        position={[
          0,
          0,
          EXTRUDE_DEPTH +
            BEVEL_THICKNESS +
            0.008,
        ]}
        scale={0.5}
        raycast={() => null}
        renderOrder={2}
      >
        <meshBasicMaterial
          ref={coreMaterialRef}
          color={CORE_GLOW_COLOR}
          transparent
          opacity={0.3}
          blending={
            THREE.AdditiveBlending
          }
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* =====================================================
          3. MOVING SHINE
          Behind the logo.
         ===================================================== */}

      <ShieldShine
        geometry={flatGeometry}
        reducedMotion={
          reducedMotion
        }
      />

      {/* =====================================================
          4. ACTUAL RAKSHAMITRA EMBLEM
          This is the original PNG.
          Rendered LAST so shine never covers it.
         ===================================================== */}

      <ShieldLogo />

      {/* =====================================================
          5. SMALL GOLD LIGHT
         ===================================================== */}

      <pointLight
        position={[
          0,
          0.2,
          1.5,
        ]}
        intensity={1.0}
        distance={3.5}
        color="#d8b673"
      />
    </group>
  );
}