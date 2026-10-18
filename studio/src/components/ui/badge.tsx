import React from 'react';
import {cn} from '../../lib/utils';

// Hand-written from the shadcn/ui Badge source (MIT). cva swapped for a plain map (no extra dep).
const variants = {
	default: 'border-transparent bg-indigo-600 text-white',
	secondary: 'border-transparent bg-slate-100 text-slate-900',
	destructive: 'border-transparent bg-red-600 text-white',
	success: 'border-transparent bg-green-600 text-white',
	outline: 'border-slate-300 text-slate-900',
} as const;

export type BadgeProps = React.ComponentProps<'span'> & {variant?: keyof typeof variants};

export function Badge({className, variant = 'default', ...props}: BadgeProps) {
	return (
		<span
			data-slot="badge"
			className={cn(
				'inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full border px-4 py-1 text-[28px] font-semibold whitespace-nowrap [&>svg]:size-7',
				variants[variant],
				className,
			)}
			{...props}
		/>
	);
}
