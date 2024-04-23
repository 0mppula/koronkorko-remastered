import {
	markupFormDataSchema,
	calculationNameSchema,
	calculationNameStringSchema,
	breakEvenPointFormDataSchema,
	investmentTimeFormDataSchema,
} from '@/schemas';
import {
	BreakEvenPointCalculation,
	InvestmentTimeCalculation,
	MarkupCalculation,
} from '@prisma/client';
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
export type InferredBreakEvenPointFormDataSchema = z.infer<typeof breakEvenPointFormDataSchema>;

export interface BreakEvenPointReportProps extends InferredBreakEvenPointFormDataSchema {
	breakEvenPointUnits: number;
	breakEvenPointMoney: number;
	contributionMarginMoney: number;
	contributionMarginPercent: number;
}

// Markup Calculator
export type InferredMarkupFormDataSchema = z.infer<typeof markupFormDataSchema>;

export interface MarkupReportProps extends InferredMarkupFormDataSchema {
	profit: number;
	markup: number;
}

// Investment Time Calculation
export type InferredInvestmentTimeFormDataSchema = z.infer<typeof investmentTimeFormDataSchema>;

export interface InvestmentTimeReportProps extends InferredInvestmentTimeFormDataSchema {
	yearsRequired: number;
	monthsRequired: number;
	daysRequired: number;
}

export type CalculationType =
	| BreakEvenPointCalculation
	| MarkupCalculation
	| InvestmentTimeCalculation;
