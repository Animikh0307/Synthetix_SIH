import { useRef } from "react";

type TacticalHoverProps = {
  children: React.ReactNode;
  className?: string;
};

export function TacticalHover({
  children,
  className = "",
}: TacticalHoverProps) {
  const ref =
    useRef<HTMLDivElement>(null);

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      ).matches === false
    ) {
      return;
    }

    const element = ref.current;

    if (!element) return;

    const rect =
      element.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) /
        rect.width) *
      100;

    const y =
      ((event.clientY - rect.top) /
        rect.height) *
      100;

    element.style.setProperty(
      "--hover-x",
      `${x}%`,
    );

    element.style.setProperty(
      "--hover-y",
      `${y}%`,
    );
  };

  return (
    <div
      ref={ref}
      className={`tactical-hover ${className}`}
      onPointerMove={handlePointerMove}
    >
      {children}
    </div>
  );
}