import React from "react";
import { interpolate } from "remotion";
import { ArrowRight } from "lucide-react";
import { Button } from "./button";
import { COLORS, fontFamily } from "../../lib/brand";
import { cn } from "../../lib/utils";

export type CtaButtonProps = {
  text: string;
  /** 0–1 entrance (rise + fade). Spring overshoot above 1 allowed. */
  progress?: number;
  /** 0–1 single pulse: scale up and back with an accent glow ring at the peak. */
  pulse?: number;
  /** Fill colour; defaults to brand primary (white text, 6.3:1). */
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function CtaButton({
  text,
  progress = 1,
  pulse = 0,
  color = COLORS.primary,
  className,
  style,
}: CtaButtonProps) {
  const p = Math.sin(Math.min(1, Math.max(0, pulse)) * Math.PI);
  return (
    <Button
      size="lg"
      className={cn("font-bold", className)}
      style={{
        fontFamily,
        background: color,
        opacity: interpolate(progress, [0, 1], [0, 1], clamp),
        transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px) scale(${1 + 0.06 * p})`,
        boxShadow: `0 0 0 ${18 * p}px rgba(244,114,182,${0.35 * p}), 0 20px 50px rgba(79,70,229,0.35)`,
        ...style,
      }}
    >
      {text}
      <ArrowRight strokeWidth={2.5} />
    </Button>
  );
}
