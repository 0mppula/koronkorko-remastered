import { calculators, currencies, durationMultipliers } from '@/constants/data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getCalculatorWithPathname(path: (typeof calculators)[number]['url']) {
	return calculators.find((calculator) => calculator.url === path)!;
}

export const formatPercentage = (value: number) => {
	let formatted = '0.00%';

	if (!isNaN(value)) {
		formatted = `${Number(value).toFixed(2)}%`;
	}
	return formatted;
};

const getCurrencyLocale = (value: (typeof currencies)[number]['value']): string => {
	return currencies.find((currency) => currency.value === value)?.locale || 'en-US';
};

export const getCurrencySymbol = (value: (typeof currencies)[number]['value']): string => {
	return currencies.find((currency) => currency.value === value)?.symbol || '$';
};

export const getDurationLabel = (value: number) => {
	return durationMultipliers.find((duration) => duration.value === value)?.label || 'Years';
};

export const formatCurrency = (
	value: number,
	currency: (typeof currencies)[number]['value'] = 'usd',
	maximumFractionDigits = 2,
	formatZero = true
) => {
	let formatted;

	if ((value === 0 && formatZero) || isNaN(value)) {
		switch (currency) {
			case 'eur':
				formatted = '0,00 €';
				break;
			case 'gbp':
				formatted = '£0.00';
				break;
			case 'jpy':
				formatted = '¥0.00';
				break;
			case 'inr':
				formatted = '₹0.00';
				break;
			default:
				formatted = '$0.00';
				break;
		}
	} else {
		formatted = new Intl.NumberFormat(getCurrencyLocale(currency), {
			style: 'currency',
			maximumFractionDigits,
			currency,
		}).format(value);
	}

	return formatted;
};
