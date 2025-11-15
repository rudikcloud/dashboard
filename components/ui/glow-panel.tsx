"use client";

import { useRef } from "react";
import type { PointerEvent, ReactNode } from "react";

type GlowPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlowPanel({ children, className }: GlowPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = panelRef.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    element.style.setProperty("--glow-x", `${x}px`);
    element.style.setProperty("--glow-y", `${y}px`);
  };

  return (
    <div
      ref={panelRef}
      className={`glow-panel${className ? ` ${className}` : ""}`}
      onPointerMove={handlePointerMove}
    >
      {children}
    </div>
  );
}
