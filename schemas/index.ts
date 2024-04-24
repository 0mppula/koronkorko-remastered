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

export const calculationNameSchema = z.object({
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

export const investmentTimeFormDataSchema = z.object({
	startingBalance: positiveNumberFieldSchema('Starting value'),
	endingBalance: positiveNumberFieldSchema('Future value'),
	annualInterestRate: positiveNumberFieldSchema('Annual interest rate'),
});

export const presentValueFormDataSchema = z.object({
	startingBalance: positiveNumberFieldSchema('Future value'),
	duration: positiveNumberFieldSchema('Duration'),
	durationMultiplier: positiveNumberFieldSchema('Duration multiplier'),
	discountRate: positiveNumberFieldSchema('Discount rate'),
});
