import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

// shadcn/ui cn(): merge conditional class lists, last Tailwind utility wins.
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
