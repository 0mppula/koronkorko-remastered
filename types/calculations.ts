import {
	breakEvenPointCalculatorSchema,
	calculationNameSchema,
	calculationNameStringSchema,
	investmentTimeCalculatorSchema,
	markupCalculatorSchema,
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
export type InferredBreakEvenPointCalculatorSchema = z.infer<typeof breakEvenPointCalculatorSchema>;

export interface BreakEvenPointReportProps extends InferredBreakEvenPointCalculatorSchema {
	breakEvenPointUnits: number;
	breakEvenPointMoney: number;
	contributionMarginMoney: number;
	contributionMarginPercent: number;
}

// Markup Calculator
export type InferredMarkupCalculatorSchema = z.infer<typeof markupCalculatorSchema>;

export interface MarkupReportProps extends InferredMarkupCalculatorSchema {
	profit: number;
	markup: number;
}

// Investment Time Calculation
export type InferredInvestmentTimeCalculatorSchema = z.infer<typeof investmentTimeCalculatorSchema>;

export interface InvestmentTimeReportProps extends InferredInvestmentTimeCalculatorSchema {
	yearsRequired: number;
	monthsRequired: number;
	daysRequired: number;
}

export type CalculationType =
	| BreakEvenPointCalculation
	| MarkupCalculation
	| InvestmentTimeCalculation;
