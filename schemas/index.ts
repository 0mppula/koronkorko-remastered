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

const positiveNumberFieldSchema = (fieldName = 'Number') => {
	return z.coerce
		.number({
			required_error: `${fieldName} is required`,
			invalid_type_error: `${fieldName} has to be a number`,
		})
		.min(0, {
			message: `${fieldName} cannot be negative`,
		});
};

export const markupFormDataSchema = z.object({
	cost: positiveNumberFieldSchema('Cost'),
	salesPrice: positiveNumberFieldSchema('Sales price'),
});

export const breakEvenPointFormDataSchema = z.object({
	fixedCosts: positiveNumberFieldSchema('Fixed costs'),
	variableCostPerUnit: positiveNumberFieldSchema('Variable cost per unit'),
	pricePerUnit: positiveNumberFieldSchema('Price per unit'),
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
	duration: positiveNumberFieldSchema('Duration'),
	durationMultiplier: positiveNumberFieldSchema('Duration multiplier'),
	discountRate: positiveNumberFieldSchema('Discount rate'),
});

export const annualizedReturnFormDataSchema = z.object({
	startingBalance: positiveNumberFieldSchema('Initial value'),
	endingBalance: positiveNumberFieldSchema('Ending value'),
	duration: positiveNumberFieldSchema('Duration'),
	durationMultiplier: positiveNumberFieldSchema('Duration multiplier'),
});

export const compoundInterestFormDataSchema = z.object({
	startingBalance: positiveNumberFieldSchema('Initial value'),
	contribution: positiveNumberFieldSchema('Contributions'),
	contributionMultiplier: z.coerce
		.number({
			required_error: 'Contribution multiplier is required',
			invalid_type_error: 'Contribution multiplier has to be a number',
		})
		.min(-1, {
			message: `Contribution multiplier must be either -1 or 1`,
		})
		.max(1, {
			message: `Contribution multiplier must be either -1 or 1`,
		})
		.superRefine((value, ctx) => {
			if (value === 0) {
				ctx.addIssue({
					message: 'Contribution multiplier must be either -1 or 1',
					code: z.ZodIssueCode.custom,
					path: ['contributionMultiplier'],
				});
			}
		}),
	contributionFrequency: positiveNumberFieldSchema('Contribution frequency'),
	interestRate: positiveNumberFieldSchema('Interest rate'),
	compoundFrequency: positiveNumberFieldSchema('Compound frequency'),
	duration: positiveNumberFieldSchema('Duration'),
	durationMultiplier: positiveNumberFieldSchema('Duration multiplier'),
});
