import {
	breakEvenPointCalculatorSchema,
	calculationNameSchema,
	calculationNameStringSchema,
	markupCalculatorSchema,
} from '@/schemas';
import { BreakEvenPointCalculation, MarkupCalculation } from '@prisma/client';
import { z } from 'zod';

export interface IHasId {
	id: string;
}

export interface IHasName {
	name: string;
}

export interface IHasFormData<TFormData> extends IHasId {
	formData: TFormData;
}

export interface IHasFormDataAndName<TFormData> extends IHasFormData<TFormData>, IHasName {}

export type InferredCalculationNameStringSchema = z.infer<typeof calculationNameStringSchema>;

export type InferredCalculationNameSchema = z.infer<typeof calculationNameSchema>;

// Break Even Point Calculator
export type InferredBreakEvenPointCalculatorSchema = z.infer<typeof breakEvenPointCalculatorSchema>;

export interface BreakEvenPointReportProps {
	fixedCosts: number;
	variableCostPerUnit: number;
	pricePerUnit: number;
	breakEvenPointUnits: number;
	breakEvenPointMoney: number;
	contributionMarginMoney: number;
	contributionMarginPercent: number;
}

// Markup Calculator
export type InferredMarkupCalculatorSchema = z.infer<typeof markupCalculatorSchema>;

export interface MarkupReportProps {
	cost: number;
	salesPrice: number;
	profit: number;
	markup: number;
}

export type CalculationType = BreakEvenPointCalculation | MarkupCalculation;
