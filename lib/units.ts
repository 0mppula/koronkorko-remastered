// Exact by definition: international nautical mile, statute mile and foot.
const NAUTICAL_MILE_IN_METRES = 1852;
const MILE_IN_METRES = 1609.344;
const FOOT_IN_METRES = 0.3048;
const SECONDS_IN_HOUR = 3600;
// NIST SP 811 App. B.9: 1 inHg (conventional) = 3386.389 Pa, rounded to 33.8639 hPa.
const INCH_OF_MERCURY_IN_HECTOPASCALS = 33.8639;

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
	{ value: 'pressure', label: 'Pressure' },
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
	pressure: [
		{
			value: 'hpa',
			label: 'Hectopascals (hPa)',
			symbol: 'hPa',
			toBase: identity,
			fromBase: identity,
		},
		{
			value: 'inhg',
			label: 'Inches of mercury (inHg)',
			symbol: 'inHg',
			toBase: (value: number) => value * INCH_OF_MERCURY_IN_HECTOPASCALS,
			fromBase: (value: number) => value / INCH_OF_MERCURY_IN_HECTOPASCALS,
		},
	],
} as const satisfies Record<UnitQuantity, readonly UnitOption[]>;

export type UnitValue<Q extends UnitQuantity> = (typeof unitOptions)[Q][number]['value'];
export type UnitPreferences = { [Q in UnitQuantity]: UnitValue<Q> };

export const BASE_UNITS: UnitPreferences = {
	speed: 'kt',
	altitude: 'ft',
	temperature: 'c',
	pressure: 'hpa',
};
export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = BASE_UNITS;

export const unitFractionDigits: Record<UnitQuantity, number> = {
	speed: 2,
	altitude: 0,
	temperature: 2,
	pressure: 2,
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
	fractionDigits: number = unitFractionDigits[quantity]
): string => {
	// Fixed locale, so reports and messages don't depend on the browser locale.
	const formatted = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
		// Pressures are written without separators (1013.25 hPa).
		useGrouping: quantity !== 'pressure',
	}).format(isNaN(value) ? 0 : value);

	return `${formatted} ${getUnitSymbol(quantity, unit)}`;
};

export const formatBaseValue = (baseValue: number, quantity: UnitQuantity, unit: string): string =>
	formatUnitValue(fromBaseUnit(baseValue, quantity, unit), quantity, unit);

// A difference has no offset: 10 °C warmer is 18 °F warmer, not 50 °F.
export const fromBaseTemperatureDifference = (valueC: number, unit: string): number =>
	unit === 'f' ? (valueC * 9) / 5 : valueC;

export const formatTemperatureDifference = (baseValue: number, unit: string): string => {
	const formatted = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: unitFractionDigits.temperature,
		maximumFractionDigits: unitFractionDigits.temperature,
		signDisplay: 'exceptZero',
	}).format(fromBaseTemperatureDifference(isNaN(baseValue) ? 0 : baseValue, unit));

	return `${formatted} ${getUnitSymbol('temperature', unit)}`;
};

// Display only: form state keeps the unrounded value so validation at the limits stays exact.
export const formatUnitInputValue = <T>(value: T): T | string =>
	typeof value === 'number' && Number.isFinite(value)
		? String(Number(value.toFixed(2)) || 0)
		: value;

export const normalizeDegrees = (value: number): number => ((value % 360) + 360) % 360;

// a − b in (−180, 180]; positive when a is clockwise of b.
export const signedAngleDifference = (a: number, b: number): number => {
	const difference = normalizeDegrees(a - b);

	return difference > 180 ? difference - 360 : difference;
};

export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Headings show north as 360°; angles show their absolute value.
export const formatDegrees = (value: number, { heading = false }: { heading?: boolean } = {}) => {
	let degrees = heading ? Math.round(normalizeDegrees(value)) : Math.round(Math.abs(value));

	if (heading && degrees % 360 === 0) degrees = 360;

	return `${String(degrees).padStart(3, '0')}°`;
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
	// Form values are display values, so float noise (e.g. 18.520000000000003) is stripped.
	return convertFormData(formData, unitFields, (value, quantity) =>
		Number(fromBaseUnit(value, quantity, units[quantity]).toPrecision(12))
	);
};

// Form values set from base units, with the exact base values behind them.
export interface UnitFormValues<T> {
	formData: T;
	baseFormData: T;
}

export const unitFormValuesFromBase = <T extends object>(
	baseFormData: T,
	unitFields: UnitFields<T>,
	units: UnitPreferences
): UnitFormValues<T> => ({
	formData: formDataFromBaseUnits(baseFormData, unitFields, units),
	baseFormData,
});

// Unedited fields (still equal to the values set from base units) use their exact base value;
// converting the rounded form value would add noise (e.g. 30 kt → mph → m/s → kt = 29.9999999999).
export const formDataToExactBaseUnits = <T extends object>(
	formData: T,
	unitFields: UnitFields<T>,
	units: UnitPreferences,
	values: UnitFormValues<T> | null
): T => {
	const baseFormData = formDataToBaseUnits(formData, unitFields, units);

	if (values) {
		for (const field of Object.keys(unitFields) as (keyof T)[]) {
			if (formData[field] === values.formData[field]) {
				baseFormData[field] = values.baseFormData[field];
			}
		}
	}

	return baseFormData;
};

export const changeFormDataUnits = <T extends object>(
	formData: T,
	unitFields: UnitFields<T>,
	prevUnits: UnitPreferences,
	units: UnitPreferences,
	prevValues: UnitFormValues<T> | null
): UnitFormValues<T> => {
	return unitFormValuesFromBase(
		formDataToExactBaseUnits(formData, unitFields, prevUnits, prevValues),
		unitFields,
		units
	);
};
