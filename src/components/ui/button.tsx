import React from 'react';
import {cn} from '../../lib/utils';

// Hand-written from the shadcn/ui Button source (MIT). Hover/focus/motion classes stripped; sizes scaled for 1080p.
const variants = {
	default: 'bg-indigo-600 text-white shadow-lg',
	secondary: 'bg-slate-100 text-slate-900',
	outline: 'border-2 border-slate-300 bg-white text-slate-900',
	ghost: 'bg-transparent text-slate-900',
} as const;

const sizes = {
	default: 'h-20 px-10 text-[40px] gap-4 [&>svg]:size-10',
	lg: 'h-28 px-14 text-[48px] gap-5 [&>svg]:size-12',
} as const;

export type ButtonProps = React.ComponentProps<'button'> & {
	variant?: keyof typeof variants;
	size?: keyof typeof sizes;
};

export function Button({className, variant = 'default', size = 'default', ...props}: ButtonProps) {
	return (
		<button
			data-slot="button"
			type="button"
			className={cn(
				'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap',
				variants[variant],
				sizes[size],
				className,
			)}
			{...props}
		/>
	);
}
