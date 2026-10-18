import React from 'react';
import {cn} from '../../lib/utils';

// Hand-written from the shadcn/ui Card source (MIT); theme vars replaced with concrete colours.
export function Card({className, ...props}: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card"
			className={cn(
				'flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white py-8 text-slate-950 shadow-xl',
				className,
			)}
			{...props}
		/>
	);
}

export function CardHeader({className, ...props}: React.ComponentProps<'div'>) {
	return <div data-slot="card-header" className={cn('flex flex-col gap-2 px-8', className)} {...props} />;
}

export function CardTitle({className, ...props}: React.ComponentProps<'div'>) {
	return (
		<div data-slot="card-title" className={cn('text-[40px] leading-tight font-semibold', className)} {...props} />
	);
}

export function CardContent({className, ...props}: React.ComponentProps<'div'>) {
	return <div data-slot="card-content" className={cn('px-8', className)} {...props} />;
}
