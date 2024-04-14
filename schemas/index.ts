import { z } from 'zod';

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
