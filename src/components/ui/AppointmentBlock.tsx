import React from "react";
import { interpolate } from "remotion";
import { COLORS, fontFamily } from "../../lib/brand";
import { cn } from "../../lib/utils";

export type Appointment = {
  id: string;
  client: string;
  service: string;
  /** Start time in decimal hours, 24h (14.5 = 2:30 pm). */
  start: number;
  durationMin: number;
  /** Index into BookingCalendar's stylists. */
  stylist: number;
  price?: number;
};

/** 14.5 -> "2:30 pm" */
export function formatTime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
}

export type AppointmentBlockProps = {
  appointment: Appointment;
  /** Featured = the new booking: brand fill, 40px client name, tick. */
  featured?: boolean;
  /** 0–1 entrance: slides in from the right and fades. Spring overshoot above 1 allowed. */
  progress?: number;
  /** 0–1 confirmation tick stroke draw (featured only). */
  tick?: number;
  /** 0–1 glow ring strength. */
  highlight?: number;
  className?: string;
  style?: React.CSSProperties;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function AppointmentBlock({
  appointment: a,
  featured = false,
  progress = 1,
  tick = 0,
  highlight = 0,
  className,
  style,
}: AppointmentBlockProps) {
  // Most important first: segments that don't fit wrap onto a hidden row, so the
  // line drops whole trailing segments instead of ellipsising mid-word.
  const meta = [
    a.service,
    formatTime(a.start),
    `${a.durationMin} min`,
    a.price != null ? `$${a.price}` : null,
  ].filter((m): m is string => Boolean(m));
  const glow = Math.min(1, Math.max(0, highlight));

  return (
    <div
      className={cn(
        "relative flex h-full flex-col justify-center overflow-hidden rounded-xl px-4",
        featured && "py-3",
        className,
      )}
      style={{
        fontFamily,
        background: featured ? COLORS.primary : COLORS.accentSoft,
        borderLeft: `8px solid ${featured ? COLORS.primaryDark : COLORS.accent}`,
        color: featured ? "#ffffff" : COLORS.ink,
        opacity: interpolate(progress, [0, 1], [0, 1], clamp),
        transform: `translateX(${interpolate(progress, [0, 1], [240, 0])}px)`,
        boxShadow: `0 0 0 ${6 * glow}px rgba(79,70,229,${0.35 * glow}), 0 ${12 * glow}px ${40 * glow}px rgba(79,70,229,${0.45 * glow})`,
        ...style,
        // Featured: always fits 40px name + 28px meta (line-height 1.375) + py-3.
        ...(featured ? { minHeight: 40 * 1.25 + 28 * 1.375 + 24 } : null),
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "truncate leading-tight font-semibold",
            featured ? "text-[40px]" : "text-[28px]",
          )}
        >
          {a.client}
        </span>
        {featured ? (
          <svg
            width={44}
            height={44}
            viewBox="0 0 24 24"
            className="shrink-0"
            aria-hidden
          >
            <circle
              cx={12}
              cy={12}
              r={11}
              fill="#ffffff"
              opacity={interpolate(tick, [0, 0.3], [0, 1], clamp)}
            />
            <path
              d="M6.5 12.5l3.5 3.5 7.5-8"
              fill="none"
              stroke={COLORS.success}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - interpolate(tick, [0.2, 1], [0, 1], clamp)}
            />
          </svg>
        ) : null}
      </div>
      {featured ? (
        <div
          className="flex flex-wrap overflow-hidden text-[28px] leading-[1.375] text-indigo-50"
          style={{ height: 28 * 1.375 }}
        >
          {meta.map((m, i) => (
            <span key={m} className="whitespace-nowrap">
              {i > 0 ? ` · ${m}` : m}
            </span>
          ))}
        </div>
      ) : (
        <span className="truncate text-[28px] leading-tight text-slate-700">
          {a.service}
        </span>
      )}
    </div>
  );
}
