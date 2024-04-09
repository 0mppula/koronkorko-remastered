import { calculators } from '@/constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getCalculatorWithPathname(path: (typeof calculators)[number]['url']) {
	return calculators.find((calculator) => calculator.url === path)!;
}
