// Exact by definition (NIST SP 811, App. B.9): international nautical mile, statute mile and foot.
export const NAUTICAL_MILE_IN_METRES = 1852;
const MILE_IN_METRES = 1609.344;
export const FOOT_IN_METRES = 0.3048;
const SECONDS_IN_HOUR = 3600;
// NIST SP 811 App. B.9: 1 inHg (conventional) = 3386.389 Pa, rounded to 33.8639 hPa.
const INCH_OF_MERCURY_IN_HECTOPASCALS = 33.8639;
// Exact by definition: US gallon = 231 in³ with 1 in = 2.54 cm; international pound.
export const US_GALLON_IN_LITRES = 3.785411784;
export const POUND_IN_KILOGRAMS = 0.45359237;

// Values the conversion depends on besides the unit, e.g. the fuel density for fuel masses.
export interface UnitContext {
	fuelDensityKgPerL?: number;
}

export interface UnitOption {
	readonly value: string;
	readonly label: string;
	readonly symbol: string;
	readonly kind?: 'volume' | 'mass';
	readonly toBase: (value: number, context?: UnitContext) => number;
	readonly fromBase: (value: number, context?: UnitContext) => number;
}

export const unitQuantities = [
	{ value: 'speed', label: 'Speed' },
	{ value: 'altitude', label: 'Altitude' },
	{ value: 'temperature', label: 'Temperature' },
	{ value: 'pressure', label: 'Pressure' },
	{ value: 'fuel', label: 'Fuel' },
	{ value: 'distance', label: 'Distance' },
] as const;

export type UnitQuantity = (typeof unitQuantities)[number]['value'];

const identity = (value: number) => value;

const getFuelDensityFromContext = (context?: UnitContext) => {
	const density = context?.fuelDensityKgPerL;

	if (density === undefined || !(density > 0)) {
		throw new Error('Fuel mass units need a fuel density');
	}

	return density;
};

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
	fuel: [
		{
			value: 'l',
			label: 'Litres (L)',
			symbol: 'L',
			kind: 'volume',
			toBase: identity,
			fromBase: identity,
		},
		{
			value: 'usgal',
			label: 'US gallons (US gal)',
			symbol: 'US gal',
			kind: 'volume',
			toBase: (value: number) => value * US_GALLON_IN_LITRES,
			fromBase: (value: number) => value / US_GALLON_IN_LITRES,
		},
		{
			value: 'kg',
			label: 'Kilograms (kg)',
			symbol: 'kg',
			kind: 'mass',
			toBase: (value: number, context?: UnitContext) =>
				value / getFuelDensityFromContext(context),
			fromBase: (value: number, context?: UnitContext) =>
				value * getFuelDensityFromContext(context),
		},
		{
			value: 'lb',
			label: 'Pounds (lb)',
			symbol: 'lb',
			kind: 'mass',
			toBase: (value: number, context?: UnitContext) =>
				(value * POUND_IN_KILOGRAMS) / getFuelDensityFromContext(context),
			fromBase: (value: number, context?: UnitContext) =>
				(value * getFuelDensityFromContext(context)) / POUND_IN_KILOGRAMS,
		},
	],
	distance: [
		{
			value: 'nm',
			label: 'Nautical miles (NM)',
			symbol: 'NM',
			toBase: identity,
			fromBase: identity,
		},
		{
			value: 'km',
			label: 'Kilometres (km)',
			symbol: 'km',
			toBase: (value: number) => value / (NAUTICAL_MILE_IN_METRES / 1000),
			fromBase: (value: number) => value * (NAUTICAL_MILE_IN_METRES / 1000),
		},
		{
			value: 'sm',
			label: 'Statute miles (SM)',
			symbol: 'SM',
			toBase: (value: number) => (value * MILE_IN_METRES) / NAUTICAL_MILE_IN_METRES,
			fromBase: (value: number) => (value * NAUTICAL_MILE_IN_METRES) / MILE_IN_METRES,
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
	fuel: 'l',
	distance: 'nm',
};
export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = BASE_UNITS;

export const unitFractionDigits: Record<UnitQuantity, number> = {
	speed: 2,
	altitude: 0,
	temperature: 2,
	pressure: 2,
	fuel: 2,
	distance: 2,
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
export const toBaseUnit = (
	value: number,
	quantity: UnitQuantity,
	unit: string,
	context?: UnitContext
): number => getUnitOption(quantity, unit).toBase(value, context);

export const fromBaseUnit = (
	value: number,
	quantity: UnitQuantity,
	unit: string,
	context?: UnitContext
): number => getUnitOption(quantity, unit).fromBase(value, context);

// The fuel unit of the other kind for showing a total both ways: L ↔ kg, US gal ↔ lb.
export const getPairedFuelUnit = (unit: UnitValue<'fuel'>): UnitValue<'fuel'> => {
	const pairs = { l: 'kg', kg: 'l', usgal: 'lb', lb: 'usgal' } as const;

	return pairs[unit];
};

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

export const formatBaseValue = (
	baseValue: number,
	quantity: UnitQuantity,
	unit: string,
	context?: UnitContext
): string => formatUnitValue(fromBaseUnit(baseValue, quantity, unit, context), quantity, unit);

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

// For differences that are never negative, such as a temperature/dew point spread.
export const formatUnsignedTemperatureDifference = (baseValue: number, unit: string): string =>
	formatUnitValue(fromBaseTemperatureDifference(baseValue, unit), 'temperature', unit);

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

// Whole degrees with a sign, e.g. a compass card correction: +2°, -2°, 0°.
export const formatSignedDegrees = (value: number): string =>
	`${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(value)}°`;

// The side comes from the displayed whole degrees, so 0° has no East/West.
export const formatVariation = (value: number, direction: 'east' | 'west'): string => {
	const degrees = Math.round(Math.abs(value));

	return degrees === 0 ? '0°' : `${degrees}° ${direction === 'east' ? 'E' : 'W'}`;
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

// Gets the context from the record's own fields (e.g. its fuel type), in any units.
export type GetUnitContext<TFormData> = (formData: TFormData) => UnitContext;

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
	units: UnitPreferences,
	getContext?: GetUnitContext<T>
): T => {
	const context = getContext?.(formData);

	return convertFormData(formData, unitFields, (value, quantity) =>
		toBaseUnit(value, quantity, units[quantity], context)
	);
};

export const formDataFromBaseUnits = <T extends object>(
	formData: T,
	unitFields: UnitFields<T>,
	units: UnitPreferences,
	getContext?: GetUnitContext<T>
): T => {
	const context = getContext?.(formData);

	// Form values are display values, so float noise (e.g. 18.520000000000003) is stripped.
	return convertFormData(formData, unitFields, (value, quantity) =>
		Number(fromBaseUnit(value, quantity, units[quantity], context).toPrecision(12))
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
	units: UnitPreferences,
	getContext?: GetUnitContext<T>
): UnitFormValues<T> => ({
	formData: formDataFromBaseUnits(baseFormData, unitFields, units, getContext),
	baseFormData,
});

// Unedited fields (still equal to the values set from base units) use their exact base value;
// converting the rounded form value would add noise (e.g. 30 kt → mph → m/s → kt = 29.9999999999).
// A changed context also counts as an edit (e.g. kg after a fuel type change).
export const formDataToExactBaseUnits = <T extends object>(
	formData: T,
	unitFields: UnitFields<T>,
	units: UnitPreferences,
	values: UnitFormValues<T> | null,
	getContext?: GetUnitContext<T>
): T => {
	const baseFormData = formDataToBaseUnits(formData, unitFields, units, getContext);

	if (values) {
		const prevBaseFormData = formDataToBaseUnits(
			values.formData,
			unitFields,
			units,
			getContext
		);

		for (const field of Object.keys(unitFields) as (keyof T)[]) {
			if (
				formData[field] === values.formData[field] &&
				Object.is(baseFormData[field], prevBaseFormData[field])
			) {
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
	prevValues: UnitFormValues<T> | null,
	getContext?: GetUnitContext<T>
): UnitFormValues<T> => {
	return unitFormValuesFromBase(
		formDataToExactBaseUnits(formData, unitFields, prevUnits, prevValues, getContext),
		unitFields,
		units,
		getContext
	);
};
