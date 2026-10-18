import React from 'react';
import {useVideoConfig} from 'remotion';
import {CheckCircle2, CalendarPlus} from 'lucide-react';
import {BookingCalendar, SALON_SATURDAY} from '../../components/ui/BookingCalendar';
import {beatFrame, SlideUp, useRamp, useSpringAt} from '../../components/motion';
import {COLORS, fontFamily} from '../../lib/brand';
import {Stage, usePortrait, type SceneProps} from './shared';

// Portrait: drop the first stylist column so names stay legible at 1080 wide.
const PORTRAIT_DATA = {
	...SALON_SATURDAY,
	stylists: SALON_SATURDAY.stylists!.slice(1),
	appointments: SALON_SATURDAY.appointments!.filter((a) => a.stylist > 0).map((a) => ({...a, stylist: a.stylist - 1})),
	incoming: {...SALON_SATURDAY.incoming!, stylist: SALON_SATURDAY.incoming!.stylist - 1},
};
// Landscape: 12–5 pm keeps the calendar plus the confirmation row inside the safe box.
const LANDSCAPE_DATA = {
	...SALON_SATURDAY,
	startHour: 12,
	appointments: SALON_SATURDAY.appointments!.filter((a) => a.start >= 12),
};

const Pill: React.FC<{icon: React.ReactNode; text: string; bg: string; fg: string}> = ({icon, text, bg, fg}) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			gap: 16,
			padding: '16px 32px',
			borderRadius: 999,
			background: bg,
			color: fg,
			fontSize: 44,
			fontWeight: 700,
			whiteSpace: 'nowrap',
			boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
		}}
	>
		{icon}
		{text}
	</div>
);

export const S03Booking: React.FC<SceneProps> = ({scene, words}) => {
	const {fps} = useVideoConfig();
	const portrait = usePortrait();
	const b = (w: string) => beatFrame(words, scene, w, fps);

	const tSlot = b('book');
	const tLand = b('lands');
	const tCal = b('calendar');

	const calIn = useSpringAt(0);
	const slotHighlight = useRamp(tSlot, 12) * (1 - useRamp(tLand, 10));
	const incomingProgress = useSpringAt(tLand, {damping: 14, stiffness: 120});
	const incomingHighlight = useRamp(tLand, 10) * (1 - useRamp(tCal + 30, 30));
	const incomingTick = useRamp(tCal, 18);
	const [booked, added] = scene.onScreenText;
	const data = portrait ? PORTRAIT_DATA : LANDSCAPE_DATA;

	return (
		<Stage w={portrait ? 1080 : 1560} h={portrait ? 1340 : 900} background={COLORS.canvas}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, fontFamily}}>
				<div
					style={{
						display: 'flex',
						flexDirection: portrait ? 'column' : 'row',
						alignItems: 'center',
						gap: 24,
						minHeight: portrait ? 220 : 96,
					}}
				>
					<SlideUp at={tLand}>
						<Pill icon={<CheckCircle2 size={44} />} text={booked} bg={COLORS.primary} fg="#ffffff" />
					</SlideUp>
					<SlideUp at={tCal}>
						<Pill icon={<CalendarPlus size={44} />} text={added} bg={COLORS.successSoft} fg="#14532d" />
					</SlideUp>
				</div>
				<div style={{opacity: Math.min(1, calIn * 1.5), transform: `translateY(${(1 - calIn) * 40}px)`}}>
					<BookingCalendar
						{...data}
						className={portrait ? 'w-[1080px]' : undefined}
						appointments={data.appointments!}
						stylists={data.stylists!}
						startHour={data.startHour!}
						endHour={data.endHour!}
						salonName={data.salonName!}
						dateLabel={data.dateLabel!}
						slotHighlight={slotHighlight}
						incomingProgress={incomingProgress}
						incomingHighlight={incomingHighlight}
						incomingTick={incomingTick}
					/>
				</div>
			</div>
		</Stage>
	);
};
