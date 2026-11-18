import { describe, expect, it } from 'vitest';

import {
	BASE_UNITS,
	DEFAULT_UNIT_PREFERENCES,
	formatUnitValue,
	formDataFromBaseUnits,
	formDataToBaseUnits,
	fromBaseUnit,
	getUnitSymbol,
	toBaseUnit,
	unitOptions,
	unitQuantities,
	withDefaultUnitPreferences,
	type UnitFields,
	type UnitPreferences,
} from '@/lib/units';

// Intl may use non-breaking spaces, so compare with plain spaces.
const normalize = (value: string) => value.replace(/\s/g, ' ');

describe('speed conversions', () => {
	it('converts knots to and from km/h (1 NM = 1852 m)', () => {
		expect(fromBaseUnit(1, 'speed', 'kmh')).toBe(1.852);
		expect(toBaseUnit(1.852, 'speed', 'kmh')).toBe(1);
	});

	it('converts knots to mph (1 mi = 1609.344 m)', () => {
		expect(fromBaseUnit(1, 'speed', 'mph')).toBeCloseTo(1852 / 1609.344, 12);
		expect(fromBaseUnit(1, 'speed', 'mph')).toBeCloseTo(1.150779, 6);
	});

	it('converts knots to m/s (1852 m per 3600 s)', () => {
		expect(fromBaseUnit(1, 'speed', 'ms')).toBeCloseTo(1852 / 3600, 12);
		expect(fromBaseUnit(1, 'speed', 'ms')).toBeCloseTo(0.514444, 6);
	});

	it('does not round converted values', () => {
		expect(toBaseUnit(10, 'speed', 'kmh')).toBe(10 / 1.852);
	});
});

describe('altitude conversions', () => {
	it('converts feet to and from metres (1 ft = 0.3048 m)', () => {
		expect(fromBaseUnit(1000, 'altitude', 'm')).toBeCloseTo(304.8, 10);
		expect(toBaseUnit(304.8, 'altitude', 'm')).toBeCloseTo(1000, 10);
	});
});

describe('temperature conversions', () => {
	it.each([
		[0, 32],
		[100, 212],
		[-40, -40],
		[15, 59],
	])('converts %d °C to and from %d °F', (celsius, fahrenheit) => {
		expect(fromBaseUnit(celsius, 'temperature', 'f')).toBeCloseTo(fahrenheit, 10);
		expect(toBaseUnit(fahrenheit, 'temperature', 'f')).toBeCloseTo(celsius, 10);
	});
});

describe('base units', () => {
	it('converts base units as identities', () => {
		for (const { value: quantity } of unitQuantities) {
			expect(toBaseUnit(123.456, quantity, BASE_UNITS[quantity])).toBe(123.456);
			expect(fromBaseUnit(123.456, quantity, BASE_UNITS[quantity])).toBe(123.456);
		}
	});

	it('round trips every option of every quantity', () => {
		for (const { value: quantity } of unitQuantities) {
			for (const option of unitOptions[quantity]) {
				for (const value of [-40, 0, 1, 12.5, 41000]) {
					expect(
						fromBaseUnit(
							toBaseUnit(value, quantity, option.value),
							quantity,
							option.value
						)
					).toBeCloseTo(value, 9);
				}
			}
		}
	});

	it('throws for an unknown unit', () => {
		expect(() => toBaseUnit(1, 'speed', 'furlongs')).toThrow();
	});
});

describe('getUnitSymbol', () => {
	it('returns the symbol of a unit', () => {
		expect(getUnitSymbol('temperature', 'f')).toBe('°F');
		expect(getUnitSymbol('speed', 'kmh')).toBe('km/h');
	});
});

describe('formatUnitValue', () => {
	it('uses the default precision of each quantity', () => {
		expect(normalize(formatUnitValue(12.54, 'speed', 'kt'))).toBe('12.5 kt');
		expect(normalize(formatUnitValue(1250.4, 'altitude', 'ft'))).toBe('1,250 ft');
		expect(normalize(formatUnitValue(15, 'temperature', 'c'))).toBe('15.0 °C');
	});

	it('respects explicit fraction digits', () => {
		expect(normalize(formatUnitValue(12.5, 'speed', 'kmh', 0))).toBe('13 km/h');
		expect(normalize(formatUnitValue(1250, 'altitude', 'm', 2))).toBe('1,250.00 m');
	});

	it('falls back to zero for NaN', () => {
		expect(normalize(formatUnitValue(NaN, 'speed', 'kt'))).toBe('0.0 kt');
		expect(normalize(formatUnitValue(NaN, 'altitude', 'ft'))).toBe('0 ft');
	});
});

describe('withDefaultUnitPreferences', () => {
	it('returns the defaults for missing preferences', () => {
		expect(withDefaultUnitPreferences(null)).toEqual(DEFAULT_UNIT_PREFERENCES);
		expect(withDefaultUnitPreferences(undefined)).toEqual(DEFAULT_UNIT_PREFERENCES);
	});

	it('defaults to ICAO units', () => {
		expect(DEFAULT_UNIT_PREFERENCES).toEqual({ speed: 'kt', altitude: 'ft', temperature: 'c' });
	});

	it('keeps valid values and fills the rest with defaults', () => {
		expect(withDefaultUnitPreferences({ speed: 'kmh' })).toEqual({
			...DEFAULT_UNIT_PREFERENCES,
			speed: 'kmh',
		});
	});

	it('falls back to the default for invalid values', () => {
		expect(withDefaultUnitPreferences({ speed: 'furlongs', altitude: null })).toEqual(
			DEFAULT_UNIT_PREFERENCES
		);
	});

	it('drops unknown quantities', () => {
		const units = { speed: 'mph', distance: 'nm' } as Partial<Record<'speed', string>>;

		expect(withDefaultUnitPreferences(units)).toEqual({
			...DEFAULT_UNIT_PREFERENCES,
			speed: 'mph',
		});
	});
});

describe('formDataToBaseUnits / formDataFromBaseUnits', () => {
	interface FormData {
		windSpeed: number | string | null | undefined;
		elevation: number | string;
		runway: number;
	}

	const unitFields: UnitFields<FormData> = { windSpeed: 'speed', elevation: 'altitude' };
	const units: UnitPreferences = { speed: 'kmh', altitude: 'm', temperature: 'c' };

	it('converts mapped fields only', () => {
		expect(
			formDataToBaseUnits(
				{ windSpeed: 18.52, elevation: 304.8, runway: 27 },
				unitFields,
				units
			)
		).toEqual({ windSpeed: 18.52 / 1.852, elevation: 304.8 / 0.3048, runway: 27 });
	});

	it('converts base units to the user units', () => {
		expect(
			formDataFromBaseUnits({ windSpeed: 10, elevation: 1000, runway: 27 }, unitFields, units)
		).toEqual({ windSpeed: 18.52, elevation: 304.8, runway: 27 });
	});

	it('does not mutate its input', () => {
		const formData = { windSpeed: 10, elevation: 1000, runway: 27 };

		formDataToBaseUnits(formData, unitFields, units);
		formDataFromBaseUnits(formData, unitFields, units);

		expect(formData).toEqual({ windSpeed: 10, elevation: 1000, runway: 27 });
	});

	it('accepts numeric strings', () => {
		expect(
			formDataToBaseUnits(
				{ windSpeed: '1.852', elevation: '0', runway: 27 },
				unitFields,
				units
			)
		).toEqual({ windSpeed: 1, elevation: 0, runway: 27 });
	});

	it('leaves empty optional values unchanged', () => {
		for (const windSpeed of ['', undefined, null]) {
			expect(
				formDataToBaseUnits({ windSpeed, elevation: 0, runway: 27 }, unitFields, units)
					.windSpeed
			).toBe(windSpeed);
			expect(
				formDataFromBaseUnits({ windSpeed, elevation: 0, runway: 27 }, unitFields, units)
					.windSpeed
			).toBe(windSpeed);
		}
	});

	it('leaves non-numeric values unchanged', () => {
		expect(
			formDataToBaseUnits({ windSpeed: 'abc', elevation: 0, runway: 27 }, unitFields, units)
				.windSpeed
		).toBe('abc');
	});

	it('round trips user input without float noise', () => {
		const formData = { windSpeed: 100, elevation: 1234.5, runway: 27 };

		expect(
			formDataFromBaseUnits(
				formDataToBaseUnits(formData, unitFields, units),
				unitFields,
				units
			)
		).toEqual(formData);
	});

	it('keeps base unit values exact', () => {
		const formData = { windSpeed: 53.99568034557236, elevation: 1000.123456789012, runway: 27 };

		expect(formDataFromBaseUnits(formData, unitFields, BASE_UNITS)).toEqual(formData);
	});
});
