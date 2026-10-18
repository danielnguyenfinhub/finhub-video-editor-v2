import React from 'react';
import {cn} from '../../lib/utils';

// Hand-written from the shadcn/ui Table source (MIT). Hover colour change stripped.
export function Table({className, ...props}: React.ComponentProps<'table'>) {
	return (
		<div data-slot="table-container" className="relative w-full overflow-hidden">
			<table data-slot="table" className={cn('w-full caption-bottom text-[32px]', className)} {...props} />
		</div>
	);
}

export function TableHeader({className, ...props}: React.ComponentProps<'thead'>) {
	return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({className, ...props}: React.ComponentProps<'tbody'>) {
	return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({className, ...props}: React.ComponentProps<'tr'>) {
	return <tr data-slot="table-row" className={cn('border-b border-slate-200', className)} {...props} />;
}

export function TableHead({className, ...props}: React.ComponentProps<'th'>) {
	return (
		<th
			data-slot="table-head"
			className={cn('h-16 px-4 text-left align-middle text-[28px] font-semibold whitespace-nowrap text-slate-600', className)}
			{...props}
		/>
	);
}

export function TableCell({className, ...props}: React.ComponentProps<'td'>) {
	return <td data-slot="table-cell" className={cn('p-4 align-middle whitespace-nowrap', className)} {...props} />;
}
