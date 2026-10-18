import React from "react";
import { interpolate } from "remotion";
import { CalendarCheck } from "lucide-react";
import { Card } from "./card";
import {
  AppointmentBlock,
  formatTime,
  type Appointment,
} from "./AppointmentBlock";
import { COLORS, fontFamily } from "../../lib/brand";
import { cn } from "../../lib/utils";

export type BookingCalendarProps = {
  salonName: string;
  dateLabel: string;
  stylists: string[];
  /** Visible hours, 24h. */
  startHour: number;
  endHour: number;
  appointments: Appointment[];
  /** The booking ReceptionAI just made; drawn featured on top. */
  incoming?: Appointment;
  /** 0–1 slide-in of the incoming block. */
  incomingProgress?: number;
  /** 0–1 confirmation tick draw on the incoming block. */
  incomingTick?: number;
  /** 0–1 glow on the incoming block. */
  incomingHighlight?: number;
  /** 0–1 dashed outline on the open slot before the booking lands. */
  slotHighlight?: number;
  className?: string;
  style?: React.CSSProperties;
};

const HOUR_PX = 125;
const GUTTER_PX = 150;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function BookingCalendar({
  salonName,
  dateLabel,
  stylists,
  startHour,
  endHour,
  appointments,
  incoming,
  incomingProgress = 1,
  incomingTick = 0,
  incomingHighlight = 0,
  slotHighlight = 0,
  className,
  style,
}: BookingCalendarProps) {
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const colPct = 100 / stylists.length;
  const place = (a: Appointment): React.CSSProperties => ({
    position: "absolute",
    top: (a.start - startHour) * HOUR_PX + 3,
    height: (a.durationMin / 60) * HOUR_PX - 6,
    left: `calc(${a.stylist * colPct}% + 6px)`,
    width: `calc(${colPct}% - 12px)`,
  });

  return (
    <Card
      className={cn("w-[1560px] gap-0 overflow-hidden py-0", className)}
      style={{ fontFamily, ...style }}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
        <div className="flex items-center gap-4">
          <CalendarCheck size={44} color={COLORS.primary} />
          <span className="text-[40px] font-bold text-slate-950">
            {dateLabel}
          </span>
        </div>
        <span className="text-[28px] font-medium text-slate-600">
          {salonName}
        </span>
      </div>
      <div
        className="flex border-b border-slate-200 bg-slate-50"
        style={{ paddingLeft: GUTTER_PX }}
      >
        {stylists.map((s) => (
          <div
            key={s}
            className="flex-1 py-3 text-center text-[32px] font-semibold text-slate-800"
          >
            {s}
          </div>
        ))}
      </div>
      <div className="relative flex" style={{ height: hours.length * HOUR_PX }}>
        <div className="shrink-0" style={{ width: GUTTER_PX }}>
          {hours.map((h) => (
            <div
              key={h}
              className="pt-1 pr-4 text-right text-[28px] text-slate-500"
              style={{ height: HOUR_PX }}
            >
              {formatTime(h).replace(":00", "")}
            </div>
          ))}
        </div>
        <div className="relative flex-1 border-l border-slate-200">
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute right-0 left-0 border-t border-slate-200"
              style={{ top: i * HOUR_PX }}
            />
          ))}
          {stylists.slice(1).map((s, i) => (
            <div
              key={s}
              className="absolute top-0 bottom-0 border-l border-slate-100"
              style={{ left: `${(i + 1) * colPct}%` }}
            />
          ))}
          {appointments.map((a) => (
            <AppointmentBlock key={a.id} appointment={a} style={place(a)} />
          ))}
          {incoming ? (
            <>
              <div
                className="rounded-xl border-4 border-dashed"
                style={{
                  ...place(incoming),
                  borderColor: COLORS.primary,
                  opacity: interpolate(slotHighlight, [0, 1], [0, 1], clamp),
                }}
              />
              <AppointmentBlock
                appointment={incoming}
                featured
                progress={incomingProgress}
                tick={incomingTick}
                highlight={incomingHighlight}
                style={place(incoming)}
              />
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

// Saturday at Bella Nails & Spa; Sophie's 2:30 pm slot is open for Jasmine (matches s03 on-screen text).
export const SALON_SATURDAY: Pick<
  BookingCalendarProps,
  | "salonName"
  | "dateLabel"
  | "stylists"
  | "startHour"
  | "endHour"
  | "appointments"
  | "incoming"
> = {
  salonName: "Bella Nails & Spa",
  dateLabel: "Saturday, 24 October",
  stylists: ["Mai", "Linh", "Sophie"],
  startHour: 11,
  endHour: 17,
  appointments: [
    {
      id: "a1",
      client: "Linda Park",
      service: "Acrylic full set",
      start: 11,
      durationMin: 60,
      stylist: 0,
    },
    {
      id: "a2",
      client: "Grace Nguyen",
      service: "Pedicure & gel",
      start: 13,
      durationMin: 90,
      stylist: 0,
    },
    {
      id: "a3",
      client: "Kim Le",
      service: "Gel polish change",
      start: 15.5,
      durationMin: 45,
      stylist: 0,
    },
    {
      id: "a4",
      client: "Ava Chen",
      service: "Gel manicure",
      start: 11.5,
      durationMin: 45,
      stylist: 1,
    },
    {
      id: "a5",
      client: "Rosa Diaz",
      service: "Dip powder",
      start: 12.5,
      durationMin: 60,
      stylist: 1,
    },
    {
      id: "a6",
      client: "Hannah Lee",
      service: "Nail art",
      start: 15,
      durationMin: 60,
      stylist: 1,
    },
    {
      id: "a7",
      client: "Emma Wright",
      service: "Spa pedicure",
      start: 11,
      durationMin: 60,
      stylist: 2,
    },
    {
      id: "a8",
      client: "Olivia Brown",
      service: "Acrylic fill",
      start: 12.25,
      durationMin: 75,
      stylist: 2,
    },
    {
      id: "a9",
      client: "Mia Patel",
      service: "Gel manicure",
      start: 15.5,
      durationMin: 60,
      stylist: 2,
    },
  ],
  incoming: {
    id: "new",
    client: "Jasmine Tran",
    service: "Gel manicure",
    start: 14.5,
    durationMin: 45,
    stylist: 2,
    price: 55,
  },
};
