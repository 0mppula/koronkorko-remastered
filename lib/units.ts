// Exact by definition: international nautical mile, statute mile and foot.
const NAUTICAL_MILE_IN_METRES = 1852;
const MILE_IN_METRES = 1609.344;
const FOOT_IN_METRES = 0.3048;
const SECONDS_IN_HOUR = 3600;

export interface UnitOption {
	readonly value: string;
	readonly label: string;
	readonly symbol: string;
	readonly toBase: (value: number) => number;
	readonly fromBase: (value: number) => number;
}

export const unitQuantities = [
	{ value: 'speed', label: 'Speed' },
	{ value: 'altitude', label: 'Altitude' },
	{ value: 'temperature', label: 'Temperature' },
] as const;

export type UnitQuantity = (typeof unitQuantities)[number]['value'];

const identity = (value: number) => value;

export const unitOptions = {
	speed: [
		{ value: 'kt', label: 'Knots (kt)', symbol: 'kt', toBase: identity, fromBase: identity },
		{
			value: 'kmh',
			label: 'Kilometres per hour (km/h)',
			symbol: 'km/h',
			toBase: (value: number) => value / (NAUTICAL_MILE_IN_METRES / 1000),
			fromBase: (value: number) => value * (NAUTICAL_MILE_IN_METRES / 1000),
		},
		{
			value: 'mph',
			label: 'Miles per hour (mph)',
			symbol: 'mph',
			toBase: (value: number) => (value * MILE_IN_METRES) / NAUTICAL_MILE_IN_METRES,
			fromBase: (value: number) => (value * NAUTICAL_MILE_IN_METRES) / MILE_IN_METRES,
		},
		{
			value: 'ms',
			label: 'Metres per second (m/s)',
			symbol: 'm/s',
			toBase: (value: number) => (value * SECONDS_IN_HOUR) / NAUTICAL_MILE_IN_METRES,
			fromBase: (value: number) => (value * NAUTICAL_MILE_IN_METRES) / SECONDS_IN_HOUR,
		},
	],
	altitude: [
		{ value: 'ft', label: 'Feet (ft)', symbol: 'ft', toBase: identity, fromBase: identity },
		{
			value: 'm',
			label: 'Metres (m)',
			symbol: 'm',
			toBase: (value: number) => value / FOOT_IN_METRES,
			fromBase: (value: number) => value * FOOT_IN_METRES,
		},
	],
	temperature: [
		{ value: 'c', label: 'Celsius (°C)', symbol: '°C', toBase: identity, fromBase: identity },
		{
			value: 'f',
			label: 'Fahrenheit (°F)',
			symbol: '°F',
			toBase: (value: number) => ((value - 32) * 5) / 9,
			fromBase: (value: number) => (value * 9) / 5 + 32,
		},
	],
} as const satisfies Record<UnitQuantity, readonly UnitOption[]>;

export type UnitValue<Q extends UnitQuantity> = (typeof unitOptions)[Q][number]['value'];
export type UnitPreferences = { [Q in UnitQuantity]: UnitValue<Q> };

export const BASE_UNITS: UnitPreferences = { speed: 'kt', altitude: 'ft', temperature: 'c' };
export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = BASE_UNITS;

const defaultFractionDigits: Record<UnitQuantity, number> = {
	speed: 1,
	altitude: 0,
	temperature: 1,
};

export const getUnitOptions = (quantity: UnitQuantity): readonly UnitOption[] =>
	unitOptions[quantity];

const getUnitOption = (quantity: UnitQuantity, unit: string) => {
	const option = getUnitOptions(quantity).find((o) => o.value === unit);

	if (!option) {
		throw new Error(`Unknown ${quantity} unit: ${unit}`);
	}

	return option;
};

// Temperatures are absolute; temperature differences must not use these.
export const toBaseUnit = (value: number, quantity: UnitQuantity, unit: string): number =>
	getUnitOption(quantity, unit).toBase(value);

export const fromBaseUnit = (value: number, quantity: UnitQuantity, unit: string): number =>
	getUnitOption(quantity, unit).fromBase(value);

export const getUnitSymbol = (quantity: UnitQuantity, unit: string): string =>
	getUnitOption(quantity, unit).symbol;

export const formatUnitValue = (
	value: number,
	quantity: UnitQuantity,
	unit: string,
	fractionDigits: number = defaultFractionDigits[quantity]
): string => {
	const formatted = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(isNaN(value) ? 0 : value);

	return `${formatted} ${getUnitSymbol(quantity, unit)}`;
};

export const withDefaultUnitPreferences = (
	units?: Partial<Record<UnitQuantity, string | null>> | null
): UnitPreferences => {
	return Object.fromEntries(
		unitQuantities.map(({ value: quantity }) => {
			const unit = units?.[quantity];
			const isValid = getUnitOptions(quantity).some((o) => o.value === unit);

			return [quantity, isValid ? unit : DEFAULT_UNIT_PREFERENCES[quantity]];
		})
	) as UnitPreferences;
};

export type UnitFields<TFormData> = Partial<Record<keyof TFormData, UnitQuantity>>;

const convertFormData = <T extends object>(
	formData: T,
	unitFields: UnitFields<T>,
	convert: (value: number, quantity: UnitQuantity) => number
): T => {
	const converted = { ...formData };

	for (const field of Object.keys(unitFields) as (keyof T)[]) {
		const quantity = unitFields[field];
		const value: unknown = formData[field];

		// Empty optional values stay empty; non-numeric values stay for zod to report.
		if (!quantity || value === '' || value === undefined || value === null) continue;

		const number = Number(value);

		if (!Number.isFinite(number)) continue;

		converted[field] = convert(number, quantity) as T[keyof T];
	}

	return converted;
};

export const formDataToBaseUnits = <T extends object>(
	formData: T,
	unitFields: UnitFields<T>,
	units: UnitPreferences
): T => {
	return convertFormData(formData, unitFields, (value, quantity) =>
		toBaseUnit(value, quantity, units[quantity])
	);
};

export const formDataFromBaseUnits = <T extends object>(
	formData: T,
	unitFields: UnitFields<T>,
	units: UnitPreferences
): T => {
	return convertFormData(formData, unitFields, (value, quantity) => {
		if (units[quantity] === BASE_UNITS[quantity]) return value;

		// Strips float noise (e.g. 18.520000000000003) from values shown in inputs.
		return Number(fromBaseUnit(value, quantity, units[quantity]).toPrecision(12));
	});
};
