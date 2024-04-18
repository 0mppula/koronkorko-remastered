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

export const markupCalculatorSchema = z.object({
	cost: z.coerce
		.number({
			required_error: 'This field is required',
			invalid_type_error: 'This field is required',
		})
		.min(0, {
			message: 'Number cannot be negative',
		}),
	salesPrice: z.coerce
		.number({
			required_error: 'This field is required',
			invalid_type_error: 'This field is required',
		})
		.min(0, {
			message: 'Number cannot be negative',
		}),
});
