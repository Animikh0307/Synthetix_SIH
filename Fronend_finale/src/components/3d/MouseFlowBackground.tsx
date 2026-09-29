import { useEffect, useRef } from "react";

export function MouseFlowBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  const target = useRef({
    x: 50,
    y: 50,
  });

  const current = useRef({
    x: 50,
    y: 50,
  });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x =
        (event.clientX / window.innerWidth) * 100;

      const y =
        (event.clientY / window.innerHeight) * 100;

      target.current.x = x;
      target.current.y = y;
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true },
    );

    let animationFrame = 0;

    const animate = () => {
      /*
       * Smooth delayed mouse following.
       * This makes the background feel fluid rather
       * than directly attached to the cursor.
       */
      current.current.x +=
        (target.current.x - current.current.x) *
        0.035;

      current.current.y +=
        (target.current.y - current.current.y) *
        0.035;

      if (containerRef.current) {
        containerRef.current.style.setProperty(
          "--mouse-x",
          `${current.current.x}%`,
        );

        containerRef.current.style.setProperty(
          "--mouse-y",
          `${current.current.y}%`,
        );
      }

      animationFrame =
        requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      cancelAnimationFrame(
        animationFrame,
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="mouse-flow-background"
    >
      {/* Main atmospheric field */}
      <div className="mouse-flow-main" />

      {/* Secondary cool field */}
      <div className="mouse-flow-cool" />

      {/* Long horizontal tactical stream */}
      <div className="mouse-flow-stream mouse-flow-stream-one" />

      <div className="mouse-flow-stream mouse-flow-stream-two" />

      {/* Tiny central focus */}
      <div className="mouse-flow-focus" />
    </div>
  );
}