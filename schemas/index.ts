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
			required_error: 'This field is required',
			invalid_type_error: 'This field is required',
		})
		.min(0, {
			message: `${fieldName} cannot be negative`,
		});
};

export const markupCalculatorSchema = z.object({
	cost: positiveNumberFieldSchema('Cost'),
	salesPrice: positiveNumberFieldSchema('Sales price'),
});

export const breakEvenPointCalculatorSchema = z.object({
	fixedCosts: positiveNumberFieldSchema('Fixed costs'),
	variableCostPerUnit: positiveNumberFieldSchema('Variable cost per unit'),
	pricePerUnit: positiveNumberFieldSchema('Price per unit'),
});

export const investmentTimeCalculatorSchema = z.object({
	startingBalance: positiveNumberFieldSchema('Starting value'),
	endingBalance: positiveNumberFieldSchema('Future value'),
	annualInterestRate: positiveNumberFieldSchema('Annual interest rate'),
});
