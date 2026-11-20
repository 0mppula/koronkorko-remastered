import { describe, expect, it } from 'vitest';

import {
	formatCurrency,
	formatHoursMinutes,
	formatMinutes,
	getFuelDensity,
	getFuelTypeLabel,
	getFuelUnitContext,
} from '@/lib/utils';

// Intl uses non-breaking spaces (e.g. fi-FI), so compare with plain spaces.
const normalize = (value: string) => value.replace(/\s/g, ' ');

describe('formatCurrency', () => {
	it('defaults to USD', () => {
		expect(formatCurrency(1234.56)).toBe('$1,234.56');
	});

	it('formats each currency with its locale', () => {
		expect(formatCurrency(1234.56, 'usd')).toBe('$1,234.56');
		expect(normalize(formatCurrency(1234.56, 'eur'))).toBe('1 234,56 €');
		expect(formatCurrency(1234.56, 'gbp')).toBe('£1,234.56');
		expect(formatCurrency(1234, 'jpy')).toBe('¥1,234');
		expect(formatCurrency(1234567.89, 'inr')).toBe('₹1,234,567.89');
	});

	it('formats negative values', () => {
		expect(formatCurrency(-1234.5)).toBe('-$1,234.50');
	});

	it('rounds to the maximum fraction digits', () => {
		expect(formatCurrency(1234.567)).toBe('$1,234.57');
		expect(formatCurrency(1234.567, 'usd', 0)).toBe('$1,235');
	});

	it('formats very large values', () => {
		expect(formatCurrency(1e12)).toBe('$1,000,000,000,000.00');
	});

	it('formats zero', () => {
		expect(formatCurrency(0, 'usd')).toBe('$0.00');
		expect(normalize(formatCurrency(0, 'eur'))).toBe('0,00 €');
		expect(formatCurrency(0, 'gbp')).toBe('£0.00');
		expect(formatCurrency(0, 'inr')).toBe('₹0.00');
	});

	// FINDING: zero yen is hardcoded as '¥0.00', but JPY has no minor unit (ISO 4217)
	it('formats zero yen without decimals', () => {
		expect(formatCurrency(0, 'jpy')).toBe('¥0');
	});

	it('formats zero with Intl when formatZero is false', () => {
		expect(formatCurrency(0, 'usd', 2, false)).toBe('$0.00');
	});

	it('falls back to zero for NaN', () => {
		expect(formatCurrency(NaN, 'usd')).toBe('$0.00');
		expect(normalize(formatCurrency(NaN, 'eur'))).toBe('0,00 €');
	});
});

describe('getFuelDensity', () => {
	it('returns the FAA-H-8083-1B weights in kg/L', () => {
		// 6.0 and 6.68 lb/US gal × 0.45359237 kg/lb ÷ 3.785411784 L/US gal
		expect(getFuelDensity('avgas')).toBeCloseTo(0.71896, 5);
		expect(getFuelDensity('jetA')).toBeCloseTo(0.80044, 5);
	});

	it('gives 6.0 and 6.68 lb per US gallon when converted back', () => {
		expect((getFuelDensity('avgas')! * 3.785411784) / 0.45359237).toBeCloseTo(6, 12);
		expect((getFuelDensity('jetA')! * 3.785411784) / 0.45359237).toBeCloseTo(6.68, 12);
	});

	it('returns undefined for an unknown fuel type', () => {
		expect(getFuelDensity('diesel')).toBeUndefined();
		expect(getFuelUnitContext({ fuelType: 'diesel' })).toEqual({
			fuelDensityKgPerL: undefined,
		});
	});

	it('gives the unit context of a fuel type', () => {
		expect(getFuelUnitContext({ fuelType: 'jetA' })).toEqual({
			fuelDensityKgPerL: getFuelDensity('jetA'),
		});
	});
});

describe('getFuelTypeLabel', () => {
	it('returns the label of a fuel type', () => {
		expect(getFuelTypeLabel('avgas')).toBe('AVGAS');
		expect(getFuelTypeLabel('jetA')).toBe('Jet A');
	});
});

describe('formatHoursMinutes', () => {
	it('splits minutes into hours and minutes', () => {
		expect(formatHoursMinutes(90)).toBe('1 h 30 min');
		expect(formatHoursMinutes(45)).toBe('0 h 45 min');
		expect(formatHoursMinutes(1440)).toBe('24 h 0 min');
		expect(formatHoursMinutes(0)).toBe('0 h 0 min');
		expect(formatHoursMinutes(120)).toBe('2 h 0 min');
	});

	it('rounds to whole minutes before splitting', () => {
		expect(formatHoursMinutes(59.6)).toBe('1 h 0 min');
		expect(formatHoursMinutes(90.4)).toBe('1 h 30 min');
	});

	it('falls back to zero for NaN', () => {
		expect(formatHoursMinutes(NaN)).toBe('0 h 0 min');
	});
});

describe('formatMinutes', () => {
	it('formats minutes with up to 2 decimals', () => {
		expect(formatMinutes(45)).toBe('45 min');
		expect(formatMinutes(30.5)).toBe('30.5 min');
		expect(formatMinutes(0)).toBe('0 min');
		expect(formatMinutes(NaN)).toBe('0 min');
	});
});
