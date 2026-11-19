import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	BASE_UNITS,
	changeFormDataUnits,
	DEFAULT_UNIT_PREFERENCES,
	formatBaseValue,
	formatDegrees,
	formatUnitValue,
	formDataFromBaseUnits,
	formDataToBaseUnits,
	formDataToExactBaseUnits,
	fromBaseUnit,
	getUnitSymbol,
	normalizeDegrees,
	signedAngleDifference,
	toBaseUnit,
	toRadians,
	unitFormValuesFromBase,
	unitOptions,
	unitQuantities,
	withDefaultUnitPreferences,
	type UnitFields,
	type UnitFormValues,
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
		expect(normalize(formatUnitValue(12.544, 'speed', 'kt'))).toBe('12.54 kt');
		expect(normalize(formatUnitValue(1250.4, 'altitude', 'ft'))).toBe('1,250 ft');
		expect(normalize(formatUnitValue(15, 'temperature', 'c'))).toBe('15.00 °C');
	});

	it('respects explicit fraction digits', () => {
		expect(normalize(formatUnitValue(12.5, 'speed', 'kmh', 0))).toBe('13 km/h');
		expect(normalize(formatUnitValue(1250, 'altitude', 'm', 2))).toBe('1,250.00 m');
	});

	it('falls back to zero for NaN', () => {
		expect(normalize(formatUnitValue(NaN, 'speed', 'kt'))).toBe('0.00 kt');
		expect(normalize(formatUnitValue(NaN, 'altitude', 'ft'))).toBe('0 ft');
	});
});

describe('formatBaseValue', () => {
	it('formats base values unchanged in base units', () => {
		expect(normalize(formatBaseValue(12.544, 'speed', 'kt'))).toBe('12.54 kt');
	});

	it('converts base values to the given unit before formatting', () => {
		// 10 kt × 1.852 = 18.52 km/h
		expect(normalize(formatBaseValue(10, 'speed', 'kmh'))).toBe('18.52 km/h');
		// 1000 ft × 0.3048 = 304.8 m
		expect(normalize(formatBaseValue(1000, 'altitude', 'm'))).toBe('305 m');
		expect(normalize(formatBaseValue(15, 'temperature', 'f'))).toBe('59.00 °F');
	});
});

describe('unit formatting with a non-English default locale', () => {
	const NumberFormat = Intl.NumberFormat;

	// Simulates a Finnish browser: Intl.NumberFormat without a locale formats as fi-FI.
	beforeEach(() => {
		vi.stubGlobal(
			'Intl',
			Object.create(Intl, {
				NumberFormat: {
					value: function (locales?: string, options?: Intl.NumberFormatOptions) {
						return new NumberFormat(locales ?? 'fi-FI', options);
					},
				},
			})
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('uses a decimal comma by default in the simulated locale', () => {
		expect(normalize(new Intl.NumberFormat(undefined).format(1234.5))).toBe('1 234,5');
	});

	it('formats unit values with a dot and comma grouping', () => {
		expect(formatUnitValue(37.04, 'speed', 'kmh')).toBe('37.04 km/h');
		expect(formatUnitValue(1250.4, 'altitude', 'ft')).toBe('1,250 ft');
		expect(formatUnitValue(-5.5, 'temperature', 'c')).toBe('-5.50 °C');
		expect(formatBaseValue(20, 'speed', 'kmh')).toBe('37.04 km/h');
		expect(formatBaseValue(1000, 'altitude', 'ft')).toBe('1,000 ft');
	});
});

describe('normalizeDegrees', () => {
	it('normalizes to [0, 360)', () => {
		expect(normalizeDegrees(370)).toBe(10);
		expect(normalizeDegrees(-10)).toBe(350);
		expect(normalizeDegrees(360)).toBe(0);
		expect(normalizeDegrees(0)).toBe(0);
		expect(normalizeDegrees(-720)).toBe(0);
	});
});

describe('signedAngleDifference', () => {
	it('returns a − b in (−180, 180]', () => {
		expect(signedAngleDifference(10, 350)).toBe(20);
		expect(signedAngleDifference(350, 10)).toBe(-20);
		expect(signedAngleDifference(240, 60)).toBe(180);
		expect(signedAngleDifference(60, 240)).toBe(180);
		expect(signedAngleDifference(90, 90)).toBe(0);
	});
});

describe('toRadians', () => {
	it('converts degrees to radians', () => {
		expect(toRadians(180)).toBe(Math.PI);
		expect(toRadians(90)).toBe(Math.PI / 2);
		expect(toRadians(-45)).toBe(-Math.PI / 4);
	});
});

describe('formatDegrees', () => {
	it('shows whole degrees with three digits', () => {
		expect(formatDegrees(87)).toBe('087°');
		expect(formatDegrees(5.4)).toBe('005°');
		expect(formatDegrees(-20)).toBe('020°');
		expect(formatDegrees(180)).toBe('180°');
	});

	it('shows an angle of 0 as 000°', () => {
		expect(formatDegrees(0)).toBe('000°');
	});

	it('shows north headings as 360°', () => {
		expect(formatDegrees(360, { heading: true })).toBe('360°');
		expect(formatDegrees(0, { heading: true })).toBe('360°');
		expect(formatDegrees(359.6, { heading: true })).toBe('360°');
		expect(formatDegrees(87, { heading: true })).toBe('087°');
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

	it('strips float noise from form values in base units too', () => {
		expect(
			formDataFromBaseUnits(
				{ windSpeed: 20.0000000000216, elevation: 999.9999999999999, runway: 27 },
				unitFields,
				BASE_UNITS
			)
		).toEqual({ windSpeed: 20, elevation: 1000, runway: 27 });
	});

	it('keeps conversions to base units unrounded', () => {
		expect(
			formDataToBaseUnits({ windSpeed: 50, elevation: 0, runway: 27 }, unitFields, units)
				.windSpeed
		).toBe(50 / 1.852);
	});
});

describe('changeFormDataUnits', () => {
	interface FormData {
		windSpeed: number | string;
		gustSpeed: number | string | null;
		runway: number;
	}

	const unitFields: UnitFields<FormData> = { windSpeed: 'speed', gustSpeed: 'speed' };
	const withSpeed = (speed: UnitPreferences['speed']): UnitPreferences => ({
		...BASE_UNITS,
		speed,
	});

	const toggle = (
		start: FormData,
		path: UnitPreferences['speed'][],
		rounds = 1
	): UnitFormValues<FormData> => {
		let values = unitFormValuesFromBase(start, unitFields, withSpeed(path[0]));

		for (let round = 0; round < rounds; round++) {
			for (let i = 1; i < path.length; i++) {
				values = changeFormDataUnits(
					values.formData,
					unitFields,
					withSpeed(path[i - 1]),
					withSpeed(path[i]),
					values
				);
			}
		}

		return values;
	};

	const imported = { windSpeed: 20, gustSpeed: 30, runway: 27 };

	it('converts the form to the new units', () => {
		expect(toggle(imported, ['kt', 'kmh']).formData).toEqual({
			windSpeed: 37.04,
			gustSpeed: 55.56,
			runway: 27,
		});
	});

	it('round trips kt → km/h → kt exactly', () => {
		expect(toggle(imported, ['kt', 'kmh', 'kt']).formData).toEqual(imported);
	});

	it('round trips kt → mph → m/s → kt exactly', () => {
		expect(toggle(imported, ['kt', 'mph', 'ms', 'kt']).formData).toEqual(imported);
	});

	it('does not drift with repeated toggling', () => {
		expect(toggle(imported, ['kt', 'mph', 'ms', 'kmh', 'kt'], 50).formData).toEqual(imported);
		expect(toggle(imported, ['kt', 'mph', 'ms', 'kt'], 50).formData).toEqual(imported);
	});

	it('round trips every 2-decimal speed up to 200 kt exactly', () => {
		for (let i = 0; i <= 20000; i++) {
			const start = { windSpeed: i / 100, gustSpeed: null, runway: 27 };

			expect(toggle(start, ['kt', 'mph', 'ms', 'kt'], 3).formData.windSpeed).toBe(i / 100);
		}
	});

	it('converts edited values from what the user typed', () => {
		const inKmh = toggle(imported, ['kt', 'kmh']);
		const edited = { ...inKmh.formData, windSpeed: '50' };

		const values = changeFormDataUnits(
			edited,
			unitFields,
			withSpeed('kmh'),
			withSpeed('kt'),
			inKmh
		);

		expect(values.baseFormData.windSpeed).toBe(50 / 1.852);
		expect(values.formData.windSpeed).toBe(Number((50 / 1.852).toPrecision(12)));
		expect(values.formData.gustSpeed).toBe(30);
	});

	it('keeps empty optional values empty', () => {
		const values = toggle({ windSpeed: 20, gustSpeed: null, runway: 27 }, ['kt', 'mph', 'kt']);

		expect(values.formData.gustSpeed).toBeNull();
	});

	it('converts from the form values without previous values', () => {
		expect(
			changeFormDataUnits(imported, unitFields, BASE_UNITS, withSpeed('kmh'), null).formData
		).toEqual({ windSpeed: 37.04, gustSpeed: 55.56, runway: 27 });
	});
});

describe('formDataToExactBaseUnits', () => {
	interface FormData {
		windSpeed: number | string;
		gustSpeed: number | string | null;
		runway: number;
	}

	const unitFields: UnitFields<FormData> = { windSpeed: 'speed', gustSpeed: 'speed' };
	const mph: UnitPreferences = { ...BASE_UNITS, speed: 'mph' };
	const saved: FormData = { windSpeed: 20, gustSpeed: 30, runway: 27 };
	const inMph = unitFormValuesFromBase(saved, unitFields, mph);

	it('uses the exact base value of untouched fields while another field is edited', () => {
		const edited: FormData = { ...inMph.formData, gustSpeed: '40' };

		// Converting the rounded mph value back is not exactly 20 kt.
		expect(formDataToBaseUnits(edited, unitFields, mph).windSpeed).not.toBe(20);
		expect(formDataToExactBaseUnits(edited, unitFields, mph, inMph).windSpeed).toBe(20);
	});

	it('converts edited fields from the typed value', () => {
		// 40 mph = 40 × 1609.344 / 1852 kt
		const expected = (40 * 1609.344) / 1852;

		for (const gustSpeed of ['40', 40]) {
			expect(
				formDataToExactBaseUnits({ ...inMph.formData, gustSpeed }, unitFields, mph, inMph)
					.gustSpeed
			).toBeCloseTo(expected, 12);
		}
	});

	it('keeps all exact base values when nothing is edited', () => {
		expect(formDataToExactBaseUnits(inMph.formData, unitFields, mph, inMph)).toEqual(saved);
	});

	it('keeps a cleared optional field empty', () => {
		expect(
			formDataToExactBaseUnits({ ...inMph.formData, gustSpeed: '' }, unitFields, mph, inMph)
				.gustSpeed
		).toBe('');
	});

	it('converts from the form values without previous values', () => {
		expect(
			formDataToExactBaseUnits(
				{ windSpeed: 37.04, gustSpeed: null, runway: 27 },
				unitFields,
				{ ...BASE_UNITS, speed: 'kmh' },
				null
			).windSpeed
		).toBe(37.04 / 1.852);
	});
});
