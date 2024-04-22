import {
	breakEvenPointCalculatorSchema,
	calculationNameSchema,
	calculationNameStringSchema,
	markupCalculatorSchema,
} from '@/schemas';
import { z } from 'zod';

export interface IHasId {
	id: string;
}

export interface IHasFormData<TFormData> extends IHasId {
	formData: TFormData;
}

export type InferredCalculationNameStringSchema = z.infer<typeof calculationNameStringSchema>;

export type InferredCalculationNameSchema = z.infer<typeof calculationNameSchema>;

export type InferredBreakEvenPointCalculatorSchema = z.infer<typeof breakEvenPointCalculatorSchema>;

export type InferredMarkupCalculatorSchema = z.infer<typeof markupCalculatorSchema>;
