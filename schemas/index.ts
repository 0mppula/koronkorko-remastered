import {
	currencies,
	fuelTypes,
	themes,
	timeSpeedDistanceSolveForOptions,
	variationDirections,
	windTypes,
} from '@/constants/data';
import { calculateCloudBase, calculateMach, calculateTimeSpeedDistance } from '@/lib/calculatorFns';
import {
	BASE_UNITS,
	formatUnitValue,
	fromBaseUnit,
	getUnitFractionDigits,
	getUnitOptions,
	signedAngleDifference,
	toBaseUnit,
	toRadians,
	UnitContext,
	UnitPreferences,
	UnitQuantity,
	UnitValue,
} from '@/lib/units';
import { FuelType, getFuelDensity } from '@/lib/utils';
import { z } from 'zod';

export const calculationNameStringSchema = z
	.string({
		required_error: 'Name is required',
		invalid_type_error: 'Name is has to be a string',
	})
	.trim()
	.min(1, {
		message: 'Name cannot be empty',
	})
	.max(30, {
		message: 'Name cannot be longer than 30 characters',
	});

export const calculationNameFormDataSchema = z.object({
	name: calculationNameStringSchema,
});

const numberFieldSchema = (fieldName = 'Number') => {
	return z.coerce
		.number({
			required_error: `${fieldName} is required`,
			invalid_type_error: `${fieldName} has to be a number`,
		})
		.finite({
			message: `${fieldName} has to be a finite number`,
		});
};

const positiveNumberFieldSchema = (fieldName = 'Number') => {
	return z.coerce
		.number({
			required_error: `${fieldName} is required`,
			invalid_type_error: `${fieldName} has to be a number`,
		})
		.finite({
			message: `${fieldName} has to be a finite number`,
		})
		.min(0, {
			message: `${fieldName} cannot be negative`,
		});
};

const positiveIntegerFieldSchema = (fieldName = 'Number') => {
	return z.coerce
		.number({
			required_error: `${fieldName} is required`,
			invalid_type_error: `${fieldName} has to be a number`,
		})
		.int()
		.min(0, {
			message: `${fieldName} cannot be negative`,
		});
};

const greaterThanZeroNumberFieldSchema = (fieldName = 'Number') => {
	return numberFieldSchema(fieldName).gt(0, {
		message: `${fieldName} must be greater than 0`,
	});
};

const positiveNumberFieldSchemaWithMax = (fieldName = 'Number', max: number) => {
	return positiveNumberFieldSchema(fieldName).max(max, {
		message: `${fieldName} cannot be greater than ${max}`,
	});
};

const UNIT_LIMIT_TOLERANCE = 1e-9;

// Limits are in base units and checked in base units, so the form and the API agree.
const createUnitLimits = (
	quantity: UnitQuantity,
	unit: string,
	{ context, symbolSuffix = '' }: { context?: UnitContext; symbolSuffix?: string } = {}
) => {
	const digits = getUnitFractionDigits(quantity, unit);
	const step = 10 ** -digits;

	// Relative, so values stripped of float noise on import (12 significant digits) still pass.
	const tolerance = (limit: number) => UNIT_LIMIT_TOLERANCE * Math.max(1, Math.abs(limit));
	const toBase = (value: number) => toBaseUnit(value, quantity, unit, context);
	const isAtLeast = (limit: number) => (value: number) =>
		toBase(value) >= limit - tolerance(limit);
	const isAtMost = (limit: number) => (value: number) =>
		toBase(value) <= limit + tolerance(limit);
	const round = (value: number) => Number(value.toFixed(digits)) || 0;

	// Shown limits are rounded inwards, so every value up to the shown limit passes.
	const formatShownLimit = (
		limit: number,
		isWithinLimit: (value: number) => boolean,
		inward: number
	) => {
		const nearest = round(fromBaseUnit(limit, quantity, unit, context));
		const shown = isWithinLimit(nearest) ? nearest : round(nearest + inward);

		return `${formatUnitValue(shown, quantity, unit)}${symbolSuffix}`;
	};

	return {
		toBase,
		tolerance,
		isAtLeast,
		isAtMost,
		formatShownMin: (min: number) => formatShownLimit(min, isAtLeast(min), step),
		formatShownMax: (max: number) => formatShownLimit(max, isAtMost(max), -step),
	};
};

export const unitNumberFieldSchema = (
	fieldName: string,
	quantity: UnitQuantity,
	unit: string,
	limits: { min?: number; max?: number; minExclusive?: boolean }
) => {
	const { min, max, minExclusive } = limits;
	const { toBase, tolerance, isAtLeast, isAtMost, formatShownMin, formatShownMax } =
		createUnitLimits(quantity, unit);

	let schema: z.ZodType<number, z.ZodTypeDef, number> = numberFieldSchema(fieldName);

	if (min !== undefined) {
		const shownMin = formatShownMin(min);

		schema = minExclusive
			? schema.refine((value) => toBase(value) > min + tolerance(min), {
					message: `${fieldName} must be greater than ${shownMin}`,
				})
			: schema.refine(isAtLeast(min), {
					message: `${fieldName} cannot be lower than ${shownMin}`,
				});
	}

	if (max !== undefined) {
		const shownMax = formatShownMax(max);

		schema = schema.refine(isAtMost(max), {
			message: `${fieldName} cannot be greater than ${shownMax}`,
		});
	}

	return schema;
};

export const markupFormDataSchema = z.object({
	cost: positiveNumberFieldSchema('Cost'),
	salesPrice: positiveNumberFieldSchema('Sales price'),
});

export const breakEvenPointFormDataSchema = z
	.object({
		fixedCosts: positiveNumberFieldSchema('Fixed costs'),
		variableCostPerUnit: positiveNumberFieldSchema('Variable cost per unit'),
		pricePerUnit: positiveNumberFieldSchema('Price per unit'),
	})
	.superRefine((data, ctx) => {
		if (data.pricePerUnit <= data.variableCostPerUnit) {
			ctx.addIssue({
				message: 'Price per unit must be greater than variable cost per unit',
				code: z.ZodIssueCode.custom,
				path: ['pricePerUnit'],
			});
		}
	});

export const investmentTimeFormDataSchema = z
	.object({
		startingBalance: positiveNumberFieldSchema('Initial value'),
		endingBalance: positiveNumberFieldSchema('Ending value'),
		annualInterestRate: positiveNumberFieldSchema('Annual interest rate'),
	})
	.superRefine((data, ctx) => {
		if (
			data.startingBalance >= data.endingBalance &&
			data.endingBalance > 0 &&
			data.startingBalance > 0
		) {
			ctx.addIssue({
				message: 'Future value must be greater than starting value',
				code: z.ZodIssueCode.custom,
				path: ['endingBalance'],
			});
			ctx.addIssue({
				message: 'Starting value must be less than future value',
				code: z.ZodIssueCode.custom,
				path: ['startingBalance'],
			});
		}
	});

export const presentValueFormDataSchema = z.object({
	startingBalance: positiveNumberFieldSchema('Future value'),
	duration: positiveNumberFieldSchemaWithMax('Duration', 200),
	durationMultiplier: positiveNumberFieldSchema('Duration multiplier'),
	discountRate: positiveNumberFieldSchema('Discount rate'),
});

export const annualizedReturnFormDataSchema = z.object({
	startingBalance: greaterThanZeroNumberFieldSchema('Initial value'),
	endingBalance: positiveNumberFieldSchema('Ending value'),
	duration: greaterThanZeroNumberFieldSchema('Duration').max(200, {
		message: 'Duration cannot be greater than 200',
	}),
	durationMultiplier: greaterThanZeroNumberFieldSchema('Duration multiplier'),
});

export const compoundInterestFormDataSchema = z.object({
	startingBalance: positiveNumberFieldSchema('Initial value'),
	contribution: positiveNumberFieldSchema('Contributions'),
	contributionMultiplier: z.coerce
		.number({
			required_error: 'Contribution multiplier is required',
			invalid_type_error: 'Contribution multiplier has to be a number',
		})
		.refine((value) => value === -1 || value === 1, {
			message: 'Contribution multiplier must be either -1 or 1',
		}),
	contributionFrequency: positiveNumberFieldSchema('Contribution frequency'),
	interestRate: positiveNumberFieldSchema('Interest rate'),
	compoundFrequency: greaterThanZeroNumberFieldSchema('Compound frequency'),
	duration: positiveNumberFieldSchemaWithMax('Duration', 200),
	durationMultiplier: positiveNumberFieldSchema('Duration multiplier'),
});

export const eventProbabilityFormDataSchema = z.object({
	eventProbabilityPercent: positiveNumberFieldSchema('Event probability').max(100, {
		message: 'Event probability cannot be greater than 100',
	}),
	eventTries: positiveIntegerFieldSchema('Event tries'),
});

export const priceToEarningsRatioFormDataSchema = z.object({
	sharePrice: positiveNumberFieldSchema('Share price'),
	earningsPerShare: numberFieldSchema('Earnings per share'),
});

export const dollarCostAverageFormDataSchema = z.object({
	initialInvestment: positiveNumberFieldSchema('Initial investment'),
	sharePrice: greaterThanZeroNumberFieldSchema('Share price'),
	deposit: positiveNumberFieldSchema('Deposit'),
	depositFrequency: greaterThanZeroNumberFieldSchema('Deposit frequency'),
	interestRate: positiveNumberFieldSchema('Interest rate'),
	compoundFrequency: greaterThanZeroNumberFieldSchema('Compound frequency'),
	duration: positiveNumberFieldSchemaWithMax('Duration', 200),
	durationMultiplier: positiveNumberFieldSchema('Duration multiplier'),
});

export const enterpriseValueFormDataSchema = z.object({
	sharePrice: positiveNumberFieldSchema('Share price'),
	sharesOutstanding: positiveIntegerFieldSchema('Shares outstanding'),
	cash: positiveNumberFieldSchema('Cash'),
	debt: positiveNumberFieldSchema('Debt'),
});

export const liquidationPriceFormDataSchema = z.object({
	entryPrice: greaterThanZeroNumberFieldSchema('Entry price'),
	leverageRatio: numberFieldSchema('Leverage').min(1, {
		message: 'Leverage cannot be less than 1',
	}),
});

export const dividendYieldFormDataSchema = z.object({
	dividendAmount: positiveNumberFieldSchema('Dividend amount'),
	distributionFrequency: positiveNumberFieldSchema('Distribution frequency'),
	sharePrice: greaterThanZeroNumberFieldSchema('Share price'),
});

// North is 360, not 0.
export const headingFieldSchema = (fieldName: string) =>
	numberFieldSchema(fieldName)
		.min(1, { message: `${fieldName} must be between 1 and 360` })
		.max(360, { message: `${fieldName} must be between 1 and 360` });

export const createCrosswindFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			runwayHeading: headingFieldSchema('Runway heading'),
			windDirection: headingFieldSchema('Wind direction'),
			windSpeed: unitNumberFieldSchema('Wind speed', 'speed', units.speed, {
				min: 0,
				max: 200,
			}),
			// Nullish to match Prisma's optional field; empty input means no gust.
			gustSpeed: z.preprocess(
				(value) => (value === '' || value === null ? undefined : value),
				unitNumberFieldSchema('Gust speed', 'speed', units.speed, {
					min: 0,
					max: 200,
				}).nullish()
			),
		})
		.superRefine((data, ctx) => {
			if (data.gustSpeed != null && data.gustSpeed <= data.windSpeed) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['gustSpeed'],
					message: 'Gust speed must be greater than wind speed',
				});
			}
		});

export const crosswindFormDataSchema = createCrosswindFormDataSchema(BASE_UNITS);

const GROUNDSPEED_TOLERANCE = 1e-9;

export const createWindTriangleFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			trueCourse: headingFieldSchema('True course'),
			trueAirspeed: unitNumberFieldSchema('True airspeed', 'speed', units.speed, {
				min: 0,
				minExclusive: true,
				max: 600,
			}),
			windDirection: headingFieldSchema('Wind direction'),
			windSpeed: unitNumberFieldSchema('Wind speed', 'speed', units.speed, {
				min: 0,
				max: 200,
			}),
		})
		.superRefine((data, ctx) => {
			const { trueCourse, trueAirspeed, windDirection, windSpeed } = data;

			// Zod runs this even when a field failed its own checks; avoid duplicate issues.
			if (!(trueAirspeed > 0) || !(windSpeed >= 0)) return;

			// Both speeds are in the same unit, so these checks hold in any unit.
			const windAngle = toRadians(signedAngleDifference(windDirection, trueCourse));
			const crosswind = windSpeed * Math.sin(windAngle);

			if (Math.abs(crosswind) > trueAirspeed) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['windSpeed'],
					message:
						"The wind's crosswind component exceeds the true airspeed, so this course can't be flown",
				});

				return;
			}

			const groundspeed =
				Math.sqrt(trueAirspeed ** 2 - crosswind ** 2) - windSpeed * Math.cos(windAngle);

			if (groundspeed <= trueAirspeed * GROUNDSPEED_TOLERANCE) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['windSpeed'],
					message: 'The wind is too strong: groundspeed would be zero or negative',
				});
			}
		});

export const windTriangleFormDataSchema = createWindTriangleFormDataSchema(BASE_UNITS);

export const createDensityAltitudeFormDataSchema = (units: UnitPreferences) =>
	z.object({
		fieldElevation: unitNumberFieldSchema('Field elevation', 'altitude', units.altitude, {
			min: -1500,
			max: 20000,
		}),
		qnh: unitNumberFieldSchema('QNH', 'pressure', units.pressure, { min: 900, max: 1100 }),
		outsideAirTemperature: unitNumberFieldSchema(
			'Outside air temperature',
			'temperature',
			units.temperature,
			{ min: -60, max: 60 }
		),
	});

export const densityAltitudeFormDataSchema = createDensityAltitudeFormDataSchema(BASE_UNITS);

const TAS_CALIBRATED_AIRSPEED_LIMITS = { min: 0, minExclusive: true, max: 400 };
const TAS_PRESSURE_ALTITUDE_LIMITS = { min: -1500, max: 36000 };

export const createTrueAirspeedFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			calibratedAirspeed: unitNumberFieldSchema(
				'Calibrated airspeed',
				'speed',
				units.speed,
				TAS_CALIBRATED_AIRSPEED_LIMITS
			),
			pressureAltitude: unitNumberFieldSchema(
				'Pressure altitude',
				'altitude',
				units.altitude,
				TAS_PRESSURE_ALTITUDE_LIMITS
			),
			outsideAirTemperature: unitNumberFieldSchema(
				'Outside air temperature',
				'temperature',
				units.temperature,
				{ min: -70, max: 60 }
			),
		})
		.superRefine((data, ctx) => {
			const speedLimits = createUnitLimits('speed', units.speed);
			const altitudeLimits = createUnitLimits('altitude', units.altitude);
			const { calibratedAirspeed, pressureAltitude } = data;

			// Zod runs this even when a field failed its own checks; avoid duplicate issues.
			if (
				!Number.isFinite(calibratedAirspeed) ||
				!Number.isFinite(pressureAltitude) ||
				!(speedLimits.toBase(calibratedAirspeed) > 0) ||
				!speedLimits.isAtMost(TAS_CALIBRATED_AIRSPEED_LIMITS.max)(calibratedAirspeed) ||
				!altitudeLimits.isAtLeast(TAS_PRESSURE_ALTITUDE_LIMITS.min)(pressureAltitude) ||
				!altitudeLimits.isAtMost(TAS_PRESSURE_ALTITUDE_LIMITS.max)(pressureAltitude)
			) {
				return;
			}

			const mach = calculateMach(
				speedLimits.toBase(calibratedAirspeed),
				altitudeLimits.toBase(pressureAltitude)
			);

			if (mach >= 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['calibratedAirspeed'],
					message:
						'Calibrated airspeed gives Mach 1 or more at this pressure altitude; only subsonic speeds are supported',
				});
			}
		});

export const trueAirspeedFormDataSchema = createTrueAirspeedFormDataSchema(BASE_UNITS);

const FUEL_MAX_LITRES = 10000;

// Nullish to match Prisma's optional field; empty input means none.
const optionalFuelAmountSchema = (fieldName: string) =>
	z.preprocess(
		(value) => (value === '' || value === null ? undefined : value),
		positiveNumberFieldSchema(fieldName).nullish()
	);

const fuelMaxFields = [
	{ field: 'fuelBurnRate', fieldName: 'Fuel burn rate', symbolSuffix: '/h' },
	{ field: 'taxiFuel', fieldName: 'Taxi fuel', symbolSuffix: '' },
	{ field: 'extraFuel', fieldName: 'Extra fuel', symbolSuffix: '' },
] as const;

export const createFuelPlanningFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			fuelBurnRate: greaterThanZeroNumberFieldSchema('Fuel burn rate'),
			flightTime: positiveNumberFieldSchema('Flight time').max(1440, {
				message: 'Flight time cannot be greater than 24 h',
			}),
			reserveTime: positiveNumberFieldSchema('Reserve time').max(180, {
				message: 'Reserve time cannot be greater than 180 min',
			}),
			taxiFuel: optionalFuelAmountSchema('Taxi fuel'),
			extraFuel: optionalFuelAmountSchema('Extra fuel'),
			fuelType: z.enum(fuelTypes.map((t) => t.value) as [FuelType, ...FuelType[]], {
				errorMap: () => ({ message: 'Fuel type must be AVGAS or Jet A' }),
			}),
		})
		// Mass units convert through the fuel type's density, so the maxima are checked here.
		.superRefine((data, ctx) => {
			const density = getFuelDensity(data.fuelType);

			if (density === undefined) return;

			for (const { field, fieldName, symbolSuffix } of fuelMaxFields) {
				const value = data[field];

				// Zod runs this even when a field failed its own checks; avoid duplicate issues.
				if (value == null || !Number.isFinite(value)) continue;

				const { isAtMost, formatShownMax } = createUnitLimits('fuel', units.fuel, {
					context: { fuelDensityKgPerL: density },
					symbolSuffix,
				});

				if (!isAtMost(FUEL_MAX_LITRES)(value)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: [field],
						message: `${fieldName} cannot be greater than ${formatShownMax(FUEL_MAX_LITRES)}`,
					});
				}
			}
		});

export const fuelPlanningFormDataSchema = createFuelPlanningFormDataSchema(BASE_UNITS);

type TimeSpeedDistanceSolveFor = (typeof timeSpeedDistanceSolveForOptions)[number]['value'];

// Base units: NM, kt and minutes.
const TSD_LIMITS = { distance: 10000, groundspeed: 1000, time: 1440 } as const;

const isEmptyValue = (value: unknown) => value === '' || value === null || value === undefined;

export const createTimeSpeedDistanceFormDataSchema = (units: UnitPreferences) => {
	const distanceLimits = createUnitLimits('distance', units.distance);
	const speedLimits = createUnitLimits('speed', units.speed);

	const fields = {
		distance: {
			name: 'Distance',
			schema: unitNumberFieldSchema('Distance', 'distance', units.distance, {
				min: 0,
				minExclusive: true,
				max: TSD_LIMITS.distance,
			}),
			toBase: distanceLimits.toBase,
			shownMax: distanceLimits.formatShownMax(TSD_LIMITS.distance),
		},
		groundspeed: {
			name: 'Groundspeed',
			schema: unitNumberFieldSchema('Groundspeed', 'speed', units.speed, {
				min: 0,
				minExclusive: true,
				max: TSD_LIMITS.groundspeed,
			}),
			toBase: speedLimits.toBase,
			shownMax: speedLimits.formatShownMax(TSD_LIMITS.groundspeed),
		},
		time: {
			name: 'Time',
			schema: numberFieldSchema('Time')
				.gt(0, { message: 'Time must be greater than 0' })
				.max(TSD_LIMITS.time, { message: 'Time cannot be greater than 24 h' }),
			toBase: (value: number) => value,
			shownMax: '24 h',
		},
	} as const;

	const solveForValues = timeSpeedDistanceSolveForOptions.map((o) => o.value) as [
		TimeSpeedDistanceSolveFor,
		...TimeSpeedDistanceSolveFor[],
	];

	return (
		z
			.object({
				solveFor: z.enum(solveForValues, {
					errorMap: () => ({
						message: 'Solve for must be distance, groundspeed or time',
					}),
				}),
				// Checked below, only when given: the solved field may hold any hidden form value.
				distance: z.unknown(),
				groundspeed: z.unknown(),
				time: z.unknown(),
			})
			.superRefine((data, ctx) => {
				const { solveFor } = data;

				// Zod runs this even when solveFor failed its own check.
				if (!solveForValues.includes(solveFor)) return;

				const baseValues = { distance: null, groundspeed: null, time: null } as Record<
					TimeSpeedDistanceSolveFor,
					number | null
				>;
				let isValid = true;

				for (const field of solveForValues) {
					if (field === solveFor) continue;

					const { name, schema, toBase } = fields[field];
					const value = data[field];
					const result = isEmptyValue(value) ? null : schema.safeParse(value);

					if (!result?.success) {
						isValid = false;
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							path: [field],
							message: result?.error.issues[0].message ?? `${name} is required`,
						});
						continue;
					}

					baseValues[field] = toBase(result.data);
				}

				if (!isValid) return;

				const solved = calculateTimeSpeedDistance({ solveFor, ...baseValues })[solveFor];
				const limit = TSD_LIMITS[solveFor];

				if (solved > limit + UNIT_LIMIT_TOLERANCE * limit) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['solveFor'],
						message: `The resulting ${solveFor} would exceed ${fields[solveFor].shownMax}`,
					});
				}
			})
			// Saved calculations store the solved field as null.
			.transform(({ solveFor, ...values }) => {
				const toNumber = (field: TimeSpeedDistanceSolveFor) =>
					field === solveFor ? null : Number(values[field]);

				return {
					solveFor,
					distance: toNumber('distance'),
					groundspeed: toNumber('groundspeed'),
					time: toNumber('time'),
				};
			})
	);
};

export const timeSpeedDistanceFormDataSchema = createTimeSpeedDistanceFormDataSchema(BASE_UNITS);

type VariationDirection = (typeof variationDirections)[number]['value'];

export const headingFormDataSchema = z.object({
	trueHeading: headingFieldSchema('True heading'),
	variation: numberFieldSchema('Variation')
		.min(0, { message: 'Variation cannot be negative' })
		.max(180, { message: 'Variation cannot be greater than 180°' }),
	variationDirection: z.enum(
		variationDirections.map((d) => d.value) as [VariationDirection, ...VariationDirection[]],
		{ errorMap: () => ({ message: 'Variation must be East or West' }) }
	),
	// Nullish to match Prisma's optional field; empty input means no compass heading.
	deviationCorrection: z.preprocess(
		(value) => (value === '' || value === null ? undefined : value),
		numberFieldSchema('Deviation correction')
			.min(-20, { message: 'Deviation correction must be between -20° and +20°' })
			.max(20, { message: 'Deviation correction must be between -20° and +20°' })
			.nullish()
	),
});

const CLOUD_BASE_TEMPERATURE_LIMITS = { min: -60, max: 60 };
const CLOUD_BASE_ELEVATION_LIMITS = { min: -1500, max: 30000 };
const CLOUD_BASE_MAX_MSL = 60000;

export const createCloudBaseFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			temperature: unitNumberFieldSchema(
				'Temperature',
				'temperature',
				units.temperature,
				CLOUD_BASE_TEMPERATURE_LIMITS
			),
			dewPoint: unitNumberFieldSchema(
				'Dew point',
				'temperature',
				units.temperature,
				CLOUD_BASE_TEMPERATURE_LIMITS
			),
			// Nullish to match Prisma's optional field; empty input means no elevation.
			elevation: z.preprocess(
				(value) => (value === '' || value === null ? undefined : value),
				unitNumberFieldSchema(
					'Elevation',
					'altitude',
					units.altitude,
					CLOUD_BASE_ELEVATION_LIMITS
				).nullish()
			),
		})
		.superRefine((data, ctx) => {
			const temperatureLimits = createUnitLimits('temperature', units.temperature);
			const altitudeLimits = createUnitLimits('altitude', units.altitude);
			const { temperature, dewPoint, elevation } = data;
			const isValidTemperature = (value: number) =>
				Number.isFinite(value) &&
				temperatureLimits.isAtLeast(CLOUD_BASE_TEMPERATURE_LIMITS.min)(value) &&
				temperatureLimits.isAtMost(CLOUD_BASE_TEMPERATURE_LIMITS.max)(value);

			// Zod runs this even when a field failed its own checks; avoid duplicate issues.
			if (!isValidTemperature(temperature) || !isValidTemperature(dewPoint)) return;

			const baseTemperature = temperatureLimits.toBase(temperature);

			if (!temperatureLimits.isAtMost(baseTemperature)(dewPoint)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['dewPoint'],
					message: 'Dew point cannot be higher than the temperature',
				});

				return;
			}

			if (
				typeof elevation !== 'number' ||
				!Number.isFinite(elevation) ||
				!altitudeLimits.isAtLeast(CLOUD_BASE_ELEVATION_LIMITS.min)(elevation) ||
				!altitudeLimits.isAtMost(CLOUD_BASE_ELEVATION_LIMITS.max)(elevation)
			) {
				return;
			}

			const { cloudBaseMsl } = calculateCloudBase({
				temperature: baseTemperature,
				dewPoint: temperatureLimits.toBase(dewPoint),
				elevation: altitudeLimits.toBase(elevation),
			});

			if (
				cloudBaseMsl !== null &&
				cloudBaseMsl > CLOUD_BASE_MAX_MSL + altitudeLimits.tolerance(CLOUD_BASE_MAX_MSL)
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['elevation'],
					message: `The resulting cloud base would exceed ${altitudeLimits.formatShownMax(CLOUD_BASE_MAX_MSL)} MSL`,
				});
			}
		});

export const cloudBaseFormDataSchema = createCloudBaseFormDataSchema(BASE_UNITS);

type WindType = (typeof windTypes)[number]['value'];

const GLIDE_ALTITUDE_LIMITS = { min: -1500, max: 60000 };
const GLIDE_TERRAIN_ELEVATION_LIMITS = { min: -1500, max: 30000 };
const GLIDE_TRUE_AIRSPEED_LIMITS = { min: 20, max: 400 };
const GLIDE_WIND_SPEED_LIMITS = { min: 0, max: 200 };

const emptyToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

export const createGlideDistanceFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			altitude: unitNumberFieldSchema(
				'Altitude',
				'altitude',
				units.altitude,
				GLIDE_ALTITUDE_LIMITS
			),
			terrainElevation: unitNumberFieldSchema(
				'Terrain elevation',
				'altitude',
				units.altitude,
				GLIDE_TERRAIN_ELEVATION_LIMITS
			),
			glideRatio: greaterThanZeroNumberFieldSchema('Glide ratio').max(70, {
				message: 'Glide ratio cannot be greater than 70',
			}),
			// Nullish to match Prisma's optional fields; empty input means none.
			glideTrueAirspeed: z.preprocess(
				emptyToUndefined,
				unitNumberFieldSchema(
					'Glide true airspeed',
					'speed',
					units.speed,
					GLIDE_TRUE_AIRSPEED_LIMITS
				).nullish()
			),
			windSpeed: z.preprocess(
				emptyToUndefined,
				unitNumberFieldSchema(
					'Wind speed',
					'speed',
					units.speed,
					GLIDE_WIND_SPEED_LIMITS
				).nullish()
			),
			windType: z
				.enum(windTypes.map((t) => t.value) as [WindType, ...WindType[]], {
					errorMap: () => ({ message: 'Choose headwind or tailwind' }),
				})
				.nullish(),
		})
		.superRefine((data, ctx) => {
			const altitudeLimits = createUnitLimits('altitude', units.altitude);
			const speedLimits = createUnitLimits('speed', units.speed);
			const isWithin =
				(
					limits: ReturnType<typeof createUnitLimits>,
					{ min, max }: { min: number; max: number }
				) =>
				(value: unknown): value is number =>
					typeof value === 'number' &&
					Number.isFinite(value) &&
					limits.isAtLeast(min)(value) &&
					limits.isAtMost(max)(value);
			const { altitude, terrainElevation, glideTrueAirspeed, windSpeed, windType } = data;

			// Zod runs this even when a field failed its own checks; avoid duplicate issues.
			if (
				isWithin(altitudeLimits, GLIDE_ALTITUDE_LIMITS)(altitude) &&
				isWithin(altitudeLimits, GLIDE_TERRAIN_ELEVATION_LIMITS)(terrainElevation) &&
				altitude <= terrainElevation
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['altitude'],
					message: 'Altitude must be above the terrain elevation',
				});
			}

			// A wind speed of 0 is no wind.
			if (!isWithin(speedLimits, GLIDE_WIND_SPEED_LIMITS)(windSpeed) || !(windSpeed > 0)) {
				return;
			}

			if (windType == null) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['windType'],
					message: 'Choose headwind or tailwind',
				});
			}

			if (glideTrueAirspeed == null) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['glideTrueAirspeed'],
					message: 'Glide true airspeed is required when a wind is entered',
				});

				return;
			}

			if (!isWithin(speedLimits, GLIDE_TRUE_AIRSPEED_LIMITS)(glideTrueAirspeed)) return;

			// Both speeds are in the same unit, so this check holds in any unit.
			if (
				windType === 'headwind' &&
				glideTrueAirspeed - windSpeed <= glideTrueAirspeed * GROUNDSPEED_TOLERANCE
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['windSpeed'],
					message: 'The headwind must be lower than the glide true airspeed',
				});
			}
		})
		// Saved calculations store no wind type without a wind.
		.transform((data) => ({
			...data,
			windType: data.windSpeed != null && data.windSpeed > 0 ? data.windType : null,
		}));

export const glideDistanceFormDataSchema = createGlideDistanceFormDataSchema(BASE_UNITS);

export const createTurnPerformanceFormDataSchema = (units: UnitPreferences) =>
	z.object({
		trueAirspeed: unitNumberFieldSchema('True airspeed', 'speed', units.speed, {
			min: 20,
			max: 400,
		}),
		bankAngle: numberFieldSchema('Bank angle')
			.gt(0, { message: 'Bank angle must be greater than 0°' })
			.max(75, { message: 'Bank angle cannot be greater than 75°' }),
		// Nullish to match Prisma's optional field; empty input means no stall speed.
		stallSpeed: z.preprocess(
			emptyToUndefined,
			unitNumberFieldSchema('Stall speed', 'speed', units.speed, {
				min: 0,
				minExclusive: true,
				max: 200,
			}).nullish()
		),
	});

export const turnPerformanceFormDataSchema = createTurnPerformanceFormDataSchema(BASE_UNITS);

const unitValueSchema = <Q extends UnitQuantity>(quantity: Q) => {
	const values = getUnitOptions(quantity).map((o) => o.value);

	return z.enum(values as unknown as [UnitValue<Q>, ...UnitValue<Q>[]], {
		errorMap: () => ({ message: `Invalid ${quantity} unit` }),
	});
};

export const unitPreferencesSchema = z.object(
	{
		speed: unitValueSchema('speed'),
		altitude: unitValueSchema('altitude'),
		temperature: unitValueSchema('temperature'),
		pressure: unitValueSchema('pressure'),
		fuel: unitValueSchema('fuel'),
		distance: unitValueSchema('distance'),
		verticalSpeed: unitValueSchema('verticalSpeed'),
	},
	{ required_error: 'Unit preferences are required' }
) satisfies z.ZodType<UnitPreferences>;

type CurrencyValue = (typeof currencies)[number]['value'];

export const userPreferencesSchema = z.object({
	theme: z.enum(themes, { errorMap: () => ({ message: 'Invalid theme' }) }),
	currency: z.enum(currencies.map((c) => c.value) as [CurrencyValue, ...CurrencyValue[]], {
		errorMap: () => ({ message: 'Invalid currency' }),
	}),
	units: unitPreferencesSchema,
});
