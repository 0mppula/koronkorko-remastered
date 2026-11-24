import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	BASE_UNITS,
	changeFormDataUnits,
	DEFAULT_UNIT_PREFERENCES,
	formatBaseValue,
	formatDegrees,
	formatSignedDegrees,
	formatTemperatureDifference,
	formatUnitInputValue,
	formatUnitValue,
	formatVariation,
	formDataFromBaseUnits,
	formDataToBaseUnits,
	formDataToExactBaseUnits,
	fromBaseTemperatureDifference,
	fromBaseUnit,
	getPairedFuelUnit,
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

describe('distance conversions', () => {
	it('converts nautical miles to and from kilometres (1 NM = 1852 m)', () => {
		expect(fromBaseUnit(1, 'distance', 'km')).toBe(1.852);
		expect(toBaseUnit(1.852, 'distance', 'km')).toBe(1);
	});

	it('converts nautical miles to and from statute miles (1 SM = 1609.344 m)', () => {
		expect(fromBaseUnit(1, 'distance', 'sm')).toBeCloseTo(1852 / 1609.344, 12);
		expect(fromBaseUnit(1, 'distance', 'sm')).toBeCloseTo(1.150779, 6);
		expect(toBaseUnit(1852, 'distance', 'sm')).toBeCloseTo(1609.344, 9);
	});

	it('formats distances with 2 decimals and grouping', () => {
		expect(normalize(formatUnitValue(10000, 'distance', 'nm'))).toBe('10,000.00 NM');
		// 10,000 NM × 1852 / 1609.344 = 11,507.794 SM
		expect(normalize(formatBaseValue(10000, 'distance', 'sm'))).toBe('11,507.79 SM');
		expect(normalize(formatBaseValue(210, 'distance', 'km'))).toBe('388.92 km');
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

describe('pressure conversions', () => {
	it('converts hPa to and from inHg (1 inHg = 33.8639 hPa)', () => {
		expect(fromBaseUnit(33.8639, 'pressure', 'inhg')).toBe(1);
		expect(toBaseUnit(29.92, 'pressure', 'inhg')).toBeCloseTo(29.92 * 33.8639, 10);
		expect(toBaseUnit(29.92, 'pressure', 'inhg')).toBeCloseTo(1013.2079, 4);
		expect(fromBaseUnit(1013.25, 'pressure', 'inhg')).toBeCloseTo(29.9212, 4);
	});

	it('formats pressures with 2 decimals and no grouping', () => {
		expect(normalize(formatUnitValue(1013.25, 'pressure', 'hpa'))).toBe('1013.25 hPa');
		expect(normalize(formatUnitValue(1013, 'pressure', 'hpa'))).toBe('1013.00 hPa');
		expect(normalize(formatBaseValue(1013.25, 'pressure', 'inhg'))).toBe('29.92 inHg');
	});

	describe('in a form with the default QNH shown in inHg', () => {
		type FormData = { qnh: number | string };

		const unitFields: UnitFields<FormData> = { qnh: 'pressure' };
		const units: UnitPreferences = { ...BASE_UNITS, pressure: 'inhg' };
		const values = unitFormValuesFromBase<FormData>({ qnh: 1013.25 }, unitFields, units);

		it('shows 29.92 but calculates an untouched QNH with exactly 1013.25 hPa', () => {
			expect(formatUnitInputValue(values.formData.qnh)).toBe('29.92');
			expect(formDataToExactBaseUnits(values.formData, unitFields, units, values).qnh).toBe(
				1013.25
			);
		});

		it('uses a typed QNH as typed', () => {
			expect(formDataToExactBaseUnits({ qnh: '29.92' }, unitFields, units, values).qnh).toBe(
				29.92 * 33.8639
			);
		});
	});
});

describe('fuel conversions', () => {
	// FAA-H-8083-1B: AVGAS 6.0 lb/US gal; Jet A 6.68 lb/US gal at 59 °F (Figure 3-4).
	const AVGAS = (6.0 * 0.45359237) / 3.785411784;
	const JET_A = (6.68 * 0.45359237) / 3.785411784;
	const avgas = { fuelDensityKgPerL: AVGAS };
	const jetA = { fuelDensityKgPerL: JET_A };

	it('has the expected densities in kg/L', () => {
		expect(AVGAS).toBeCloseTo(0.71896, 5);
		expect(JET_A).toBeCloseTo(0.80044, 5);
	});

	it('converts litres to and from US gallons (1 US gal = 3.785411784 L)', () => {
		expect(fromBaseUnit(3.785411784, 'fuel', 'usgal')).toBe(1);
		expect(toBaseUnit(1, 'fuel', 'usgal')).toBe(3.785411784);
	});

	it('converts pounds of fuel to litres through the density', () => {
		// 6 lb of AVGAS and 6.68 lb of Jet A are 1 US gal by definition.
		expect(toBaseUnit(6, 'fuel', 'lb', avgas)).toBeCloseTo(3.785411784, 12);
		expect(toBaseUnit(6.68, 'fuel', 'lb', jetA)).toBeCloseTo(3.785411784, 12);
		expect(fromBaseUnit(3.785411784, 'fuel', 'lb', avgas)).toBeCloseTo(6, 12);
		expect(fromBaseUnit(3.785411784, 'fuel', 'lb', jetA)).toBeCloseTo(6.68, 12);
	});

	it('converts kilograms of fuel to litres through the density', () => {
		expect(toBaseUnit(AVGAS, 'fuel', 'kg', avgas)).toBeCloseTo(1, 12);
		expect(fromBaseUnit(1, 'fuel', 'kg', jetA)).toBe(JET_A);
		expect(toBaseUnit(1, 'fuel', 'kg', avgas)).toBeCloseTo(1 / 0.71896, 4);
	});

	it('converts kilograms to pounds with the international pound', () => {
		const litres = toBaseUnit(1, 'fuel', 'kg', jetA);

		expect(fromBaseUnit(litres, 'fuel', 'lb', jetA)).toBeCloseTo(1 / 0.45359237, 12);
	});

	it('returns the inputs when converting back through the density', () => {
		for (const context of [avgas, jetA]) {
			for (const unit of ['kg', 'lb']) {
				for (const value of [0.01, 1, 64.71, 150, 10000]) {
					const litres = toBaseUnit(value, 'fuel', unit, context);

					expect(fromBaseUnit(litres, 'fuel', unit, context)).toBeCloseTo(value, 9);
				}
			}
		}
	});

	it('throws for mass units without a valid density', () => {
		expect(() => toBaseUnit(1, 'fuel', 'kg')).toThrow();
		expect(() => fromBaseUnit(1, 'fuel', 'lb', {})).toThrow();
		expect(() => toBaseUnit(1, 'fuel', 'lb', { fuelDensityKgPerL: 0 })).toThrow();
	});

	it('ignores the density for volume units', () => {
		expect(toBaseUnit(1, 'fuel', 'usgal', jetA)).toBe(3.785411784);
		expect(fromBaseUnit(25, 'fuel', 'l', avgas)).toBe(25);
	});

	it('pairs L with kg and US gal with lb', () => {
		expect(getPairedFuelUnit('l')).toBe('kg');
		expect(getPairedFuelUnit('kg')).toBe('l');
		expect(getPairedFuelUnit('usgal')).toBe('lb');
		expect(getPairedFuelUnit('lb')).toBe('usgal');
	});

	it('formats fuel with 2 decimals and grouping', () => {
		expect(normalize(formatUnitValue(2641.72, 'fuel', 'usgal'))).toBe('2,641.72 US gal');
		expect(normalize(formatBaseValue(90, 'fuel', 'l'))).toBe('90.00 L');
		// 90 L × 0.71896 kg/L = 64.71 kg
		expect(normalize(formatBaseValue(90, 'fuel', 'kg', avgas))).toBe('64.71 kg');
		// 25 US gal × 6.0 lb/US gal and × 6.68 lb/US gal
		expect(normalize(formatBaseValue(25 * 3.785411784, 'fuel', 'usgal'))).toBe('25.00 US gal');
		expect(normalize(formatBaseValue(25 * 3.785411784, 'fuel', 'lb', avgas))).toBe('150.00 lb');
		expect(normalize(formatBaseValue(25 * 3.785411784, 'fuel', 'lb', jetA))).toBe('167.00 lb');
	});

	describe('in a form with a fuel type', () => {
		interface FormData {
			fuelBurnRate: number | string;
			taxiFuel: number | string | null;
			fuelType: string;
		}

		const unitFields: UnitFields<FormData> = { fuelBurnRate: 'fuel', taxiFuel: 'fuel' };
		const getContext = ({ fuelType }: FormData) => (fuelType === 'jetA' ? jetA : avgas);
		const withFuel = (fuel: UnitPreferences['fuel']): UnitPreferences => ({
			...BASE_UNITS,
			fuel,
		});
		const saved: FormData = { fuelBurnRate: 30, taxiFuel: 5, fuelType: 'avgas' };

		it("converts mass fields with the density of the record's own fuel type", () => {
			const units = withFuel('lb');

			expect(
				formDataToBaseUnits(
					{ fuelBurnRate: 60, taxiFuel: 6.68, fuelType: 'jetA' },
					unitFields,
					units,
					getContext
				)
			).toEqual({
				fuelBurnRate: toBaseUnit(60, 'fuel', 'lb', jetA),
				taxiFuel: toBaseUnit(6.68, 'fuel', 'lb', jetA),
				fuelType: 'jetA',
			});
			expect(
				formDataFromBaseUnits(
					{ fuelBurnRate: 3.785411784, taxiFuel: null, fuelType: 'jetA' },
					unitFields,
					units,
					getContext
				)
			).toEqual({ fuelBurnRate: 6.68, taxiFuel: null, fuelType: 'jetA' });
		});

		it('round trips L → US gal → lb → kg → L exactly for both fuel types', () => {
			const path: UnitPreferences['fuel'][] = ['l', 'usgal', 'lb', 'kg', 'l'];

			for (const fuelType of ['avgas', 'jetA']) {
				const start = { ...saved, fuelType };
				let values = unitFormValuesFromBase(start, unitFields, withFuel('l'), getContext);

				for (let round = 0; round < 50; round++) {
					for (let i = 1; i < path.length; i++) {
						values = changeFormDataUnits(
							values.formData,
							unitFields,
							withFuel(path[i - 1]),
							withFuel(path[i]),
							values,
							getContext
						);
					}
				}

				expect(values.formData).toEqual(start);
				expect(values.baseFormData).toEqual(start);
			}
		});

		it('round trips every 2-decimal amount up to 200 lb exactly', () => {
			const path: UnitPreferences['fuel'][] = ['lb', 'l', 'usgal', 'kg', 'lb'];

			for (let i = 0; i <= 20000; i++) {
				const value = i / 100;
				const base = { ...saved, fuelBurnRate: toBaseUnit(value, 'fuel', 'lb', avgas) };
				let values = unitFormValuesFromBase(base, unitFields, withFuel('lb'), getContext);

				for (let j = 1; j < path.length; j++) {
					values = changeFormDataUnits(
						values.formData,
						unitFields,
						withFuel(path[j - 1]),
						withFuel(path[j]),
						values,
						getContext
					);
				}

				expect(values.formData.fuelBurnRate).toBe(value);
			}
		});

		it('saves an untouched imported calculation with the exact stored litres', () => {
			for (const fuel of ['usgal', 'kg', 'lb'] as const) {
				const values = unitFormValuesFromBase(
					saved,
					unitFields,
					withFuel(fuel),
					getContext
				);

				expect(
					formDataToExactBaseUnits(
						values.formData,
						unitFields,
						withFuel(fuel),
						values,
						getContext
					)
				).toEqual(saved);
			}
		});

		it('keeps the shown mass and converts it with the new density after a fuel type change', () => {
			const units = withFuel('kg');
			const values = unitFormValuesFromBase(saved, unitFields, units, getContext);
			const changed = { ...values.formData, fuelType: 'jetA' };
			const base = formDataToExactBaseUnits(changed, unitFields, units, values, getContext);

			// 30 L of AVGAS shown in kg, then read as kg of Jet A.
			expect(changed.fuelBurnRate).toBe(Number((30 * AVGAS).toPrecision(12)));
			expect(base.fuelBurnRate).toBe(Number(changed.fuelBurnRate) / JET_A);
			expect(base.fuelBurnRate).toBeCloseTo((30 * AVGAS) / JET_A, 9);
			expect(base.taxiFuel).toBe(Number(changed.taxiFuel) / JET_A);
		});

		it('restores the exact litres when the fuel type is changed back', () => {
			const units = withFuel('lb');
			const values = unitFormValuesFromBase(saved, unitFields, units, getContext);
			const changed = { ...values.formData, fuelType: 'jetA' };
			const changedBack = { ...changed, fuelType: 'avgas' };

			expect(
				formDataToExactBaseUnits(changed, unitFields, units, values, getContext)
					.fuelBurnRate
			).not.toBe(30);
			expect(
				formDataToExactBaseUnits(changedBack, unitFields, units, values, getContext)
			).toEqual(saved);
		});

		it('keeps the exact litres after a fuel type change in volume units', () => {
			const units = withFuel('usgal');
			const values = unitFormValuesFromBase(saved, unitFields, units, getContext);

			expect(
				formDataToExactBaseUnits(
					{ ...values.formData, fuelType: 'jetA' },
					unitFields,
					units,
					values,
					getContext
				)
			).toEqual({ ...saved, fuelType: 'jetA' });
		});

		it('changes units after a fuel type change with the new density', () => {
			const values = unitFormValuesFromBase(saved, unitFields, withFuel('lb'), getContext);
			const changed = { ...values.formData, fuelType: 'jetA' };
			const inLitres = changeFormDataUnits(
				changed,
				unitFields,
				withFuel('lb'),
				withFuel('l'),
				values,
				getContext
			);

			expect(inLitres.baseFormData.fuelBurnRate).toBe(
				toBaseUnit(Number(changed.fuelBurnRate), 'fuel', 'lb', jetA)
			);
			expect(inLitres.formData.fuelType).toBe('jetA');
		});

		it('converts a typed value with the current fuel type', () => {
			const units = withFuel('lb');
			const values = unitFormValuesFromBase(saved, unitFields, units, getContext);

			expect(
				formDataToExactBaseUnits(
					{ ...values.formData, fuelBurnRate: '66.8', fuelType: 'jetA' },
					unitFields,
					units,
					values,
					getContext
				).fuelBurnRate
			).toBeCloseTo(10 * 3.785411784, 9);
		});
	});
});

describe('temperature differences', () => {
	it('converts without the 32 °F offset', () => {
		expect(fromBaseTemperatureDifference(10, 'f')).toBe(18);
		expect(fromBaseTemperatureDifference(10, 'c')).toBe(10);
		expect(fromBaseTemperatureDifference(0, 'f')).toBe(0);
		expect(fromBaseTemperatureDifference(-5, 'f')).toBe(-9);
	});

	it('formats differences with a sign', () => {
		expect(normalize(formatTemperatureDifference(19.9, 'c'))).toBe('+19.90 °C');
		expect(normalize(formatTemperatureDifference(10, 'f'))).toBe('+18.00 °F');
		expect(normalize(formatTemperatureDifference(-5, 'c'))).toBe('-5.00 °C');
	});

	it('shows no sign for zero or values that round to zero', () => {
		expect(normalize(formatTemperatureDifference(0, 'c'))).toBe('0.00 °C');
		expect(normalize(formatTemperatureDifference(-0.004, 'c'))).toBe('0.00 °C');
		// 0.002 °C = 0.0036 °F
		expect(normalize(formatTemperatureDifference(0.002, 'f'))).toBe('0.00 °F');
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
		const context = { fuelDensityKgPerL: 0.8 };

		for (const { value: quantity } of unitQuantities) {
			for (const option of unitOptions[quantity]) {
				for (const value of [-40, 0, 1, 12.5, 41000]) {
					expect(
						fromBaseUnit(
							toBaseUnit(value, quantity, option.value, context),
							quantity,
							option.value,
							context
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

describe('formatUnitInputValue', () => {
	it('rounds numbers to 2 decimals without trailing zeros', () => {
		expect(formatUnitInputValue(29.9212849081)).toBe('29.92');
		expect(formatUnitInputValue(304.8)).toBe('304.8');
		expect(formatUnitInputValue(37.04)).toBe('37.04');
		expect(formatUnitInputValue(-457.2)).toBe('-457.2');
		expect(formatUnitInputValue(20000)).toBe('20000');
		expect(formatUnitInputValue(115.077944802)).toBe('115.08');
	});

	it('shows values that round to zero as 0', () => {
		expect(formatUnitInputValue(-0.001)).toBe('0');
		expect(formatUnitInputValue(0)).toBe('0');
	});

	it('leaves typed values unchanged', () => {
		expect(formatUnitInputValue('29.9212')).toBe('29.9212');
		expect(formatUnitInputValue('')).toBe('');
		expect(formatUnitInputValue('-')).toBe('-');
		expect(formatUnitInputValue(undefined)).toBe(undefined);
	});

	describe('in a form with a 100 kt wind shown in mph', () => {
		type FormData = { windSpeed: number | string };

		const unitFields: UnitFields<FormData> = { windSpeed: 'speed' };
		const units: UnitPreferences = { ...BASE_UNITS, speed: 'mph' };
		const values = unitFormValuesFromBase<FormData>({ windSpeed: 100 }, unitFields, units);

		it('shows 115.08 but calculates an untouched field with exactly 100 kt', () => {
			expect(formatUnitInputValue(values.formData.windSpeed)).toBe('115.08');
			expect(
				formDataToExactBaseUnits(values.formData, unitFields, units, values).windSpeed
			).toBe(100);
		});

		it('uses a typed value as typed', () => {
			expect(
				formDataToExactBaseUnits({ windSpeed: '115.08' }, unitFields, units, values)
					.windSpeed
			).toBe(toBaseUnit(115.08, 'speed', 'mph'));
		});
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

describe('formatSignedDegrees', () => {
	it('shows whole degrees with a sign', () => {
		expect(formatSignedDegrees(2)).toBe('+2°');
		expect(formatSignedDegrees(-2)).toBe('-2°');
		expect(formatSignedDegrees(-20)).toBe('-20°');
		expect(formatSignedDegrees(1.6)).toBe('+2°');
	});

	it('shows values that round to 0 as 0° without a sign', () => {
		expect(formatSignedDegrees(0)).toBe('0°');
		expect(formatSignedDegrees(-0.4)).toBe('0°');
		expect(formatSignedDegrees(0.4)).toBe('0°');
	});
});

describe('formatVariation', () => {
	it('shows whole degrees with East or West', () => {
		expect(formatVariation(9, 'east')).toBe('9° E');
		expect(formatVariation(10.4, 'west')).toBe('10° W');
		expect(formatVariation(180, 'west')).toBe('180° W');
	});

	it('shows a variation that rounds to 0 as 0° without East or West', () => {
		expect(formatVariation(0, 'east')).toBe('0°');
		expect(formatVariation(0.4, 'west')).toBe('0°');
	});
});

describe('withDefaultUnitPreferences', () => {
	it('returns the defaults for missing preferences', () => {
		expect(withDefaultUnitPreferences(null)).toEqual(DEFAULT_UNIT_PREFERENCES);
		expect(withDefaultUnitPreferences(undefined)).toEqual(DEFAULT_UNIT_PREFERENCES);
	});

	it('defaults to ICAO units', () => {
		expect(DEFAULT_UNIT_PREFERENCES).toEqual({
			speed: 'kt',
			altitude: 'ft',
			temperature: 'c',
			pressure: 'hpa',
			fuel: 'l',
			distance: 'nm',
		});
	});

	it('keeps valid values and fills the rest with defaults', () => {
		expect(withDefaultUnitPreferences({ speed: 'kmh' })).toEqual({
			...DEFAULT_UNIT_PREFERENCES,
			speed: 'kmh',
		});
	});

	it('adds the default pressure, fuel and distance to preferences saved before they existed', () => {
		expect(
			withDefaultUnitPreferences({ speed: 'kmh', altitude: 'm', temperature: 'f' })
		).toEqual({
			speed: 'kmh',
			altitude: 'm',
			temperature: 'f',
			pressure: 'hpa',
			fuel: 'l',
			distance: 'nm',
		});
	});

	it('keeps the other choices when only fuel and distance are missing', () => {
		expect(
			withDefaultUnitPreferences({
				speed: 'mph',
				altitude: 'm',
				temperature: 'f',
				pressure: 'inhg',
			})
		).toEqual({
			speed: 'mph',
			altitude: 'm',
			temperature: 'f',
			pressure: 'inhg',
			fuel: 'l',
			distance: 'nm',
		});
	});

	it('keeps the other choices when only distance is missing', () => {
		expect(
			withDefaultUnitPreferences({
				speed: 'mph',
				altitude: 'm',
				temperature: 'f',
				pressure: 'inhg',
				fuel: 'lb',
			})
		).toEqual({
			speed: 'mph',
			altitude: 'm',
			temperature: 'f',
			pressure: 'inhg',
			fuel: 'lb',
			distance: 'nm',
		});
	});

	it('falls back to the default for invalid values', () => {
		expect(withDefaultUnitPreferences({ speed: 'furlongs', altitude: null })).toEqual(
			DEFAULT_UNIT_PREFERENCES
		);
	});

	it('drops unknown quantities', () => {
		const units = { speed: 'mph', volume: 'm3' } as Partial<Record<'speed', string>>;

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
	const units: UnitPreferences = { ...BASE_UNITS, speed: 'kmh', altitude: 'm' };

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
