import { currencies, themes } from '@/constants/data';
import {
	formatUnitValue,
	fromBaseUnit,
	getUnitOptions,
	toBaseUnit,
	unitFractionDigits,
	UnitPreferences,
	UnitQuantity,
	UnitValue,
} from '@/lib/units';
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
export const unitNumberFieldSchema = (
	fieldName: string,
	quantity: UnitQuantity,
	unit: string,
	limits: { min?: number; max?: number; minExclusive?: boolean }
) => {
	const { min, max, minExclusive } = limits;
	const digits = unitFractionDigits[quantity];
	const step = 10 ** -digits;

	// Relative, so values stripped of float noise on import (12 significant digits) still pass.
	const tolerance = (limit: number) => UNIT_LIMIT_TOLERANCE * Math.max(1, Math.abs(limit));
	const toBase = (value: number) => toBaseUnit(value, quantity, unit);
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
		const nearest = round(fromBaseUnit(limit, quantity, unit));
		const shown = isWithinLimit(nearest) ? nearest : round(nearest + inward);

		return formatUnitValue(shown, quantity, unit);
	};

	let schema: z.ZodType<number, z.ZodTypeDef, number> = numberFieldSchema(fieldName);

	if (min !== undefined) {
		const shownMin = formatShownLimit(min, isAtLeast(min), step);

		schema = minExclusive
			? schema.refine((value) => toBase(value) > min + tolerance(min), {
					message: `${fieldName} must be greater than ${shownMin}`,
				})
			: schema.refine(isAtLeast(min), {
					message: `${fieldName} cannot be lower than ${shownMin}`,
				});
	}

	if (max !== undefined) {
		const shownMax = formatShownLimit(max, isAtMost(max), -step);

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
