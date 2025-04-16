import { calculators } from '@/constants/calculators';
import {
	contributionFrequencies,
	currencies,
	depositFrequencies,
	durationMultipliers,
} from '@/constants/data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getCalculatorWithPathname(path: (typeof calculators)[number]['url']) {
	return calculators.find((calculator) => calculator.url === path)!;
}

export const formatPercentage = (value: number, fractionDigits = 2) => {
	let formatted = '0.00%';

	if (!isNaN(value)) {
		formatted = `${new Intl.NumberFormat(undefined, {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}).format(value)}%`;
	}
	return formatted;
};

const getCurrencyLocale = (value: (typeof currencies)[number]['value']): string => {
	return currencies.find((currency) => currency.value === value)?.locale || 'en-US';
};

export const getCurrencyName = (
	value: (typeof currencies)[number]['value'],
	plural = false
): string => {
	if (plural) {
		return (
			currencies.find((currency) => currency.value === value)?.pluralName ||
			'United States dollar'
		);
	}

	return currencies.find((currency) => currency.value === value)?.name || 'United States dollar';
};

export const getCurrencySymbol = (value: (typeof currencies)[number]['value']): string => {
	return currencies.find((currency) => currency.value === value)?.symbol || '$';
};

export const getDurationLabel = (value: number) => {
	return durationMultipliers.find((duration) => duration.value === value)?.label || 'Years';
};

export const getContributionFrequencyShortLabel = (value: number) => {
	return contributionFrequencies.find((duration) => duration.value === value)?.shortLabel || 'y';
};

export const getDepositFrequencyShortLabel = (value: number) => {
	return depositFrequencies.find((duration) => duration.value === value)?.shortLabel || 'y';
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

export const formatCurrencyK = (
	value: number,
	currency: (typeof currencies)[number]['value'] = 'usd'
) => {
	if (!isNaN(value)) {
		let formatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			maximumFractionDigits: 0,
		}).format(value / 1000);
		return `${formatted}k`;
	} else {
		let formatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			maximumFractionDigits: 0,
		}).format(0);
		return formatted;
	}
};

export const formatNumber = (number: number, toFixedPrecision: number | null = null) => {
	if (toFixedPrecision !== null) {
		return new Intl.NumberFormat(undefined, {
			minimumFractionDigits: toFixedPrecision,
			maximumFractionDigits: toFixedPrecision,
		}).format(isNaN(number) ? 0 : number);
	}

	if (isNaN(number)) {
		return '0';
	}

	return new Intl.NumberFormat().format(number);
};
