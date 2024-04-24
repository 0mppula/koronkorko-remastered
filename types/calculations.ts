import {
	breakEvenPointFormDataSchema,
	calculationNameFormDataSchema,
	calculationNameStringSchema,
	investmentTimeFormDataSchema,
	markupFormDataSchema,
	presentValueFormDataSchema,
} from '@/schemas';
import {
	BreakEvenPointCalculation,
	InvestmentTimeCalculation,
	MarkupCalculation,
	PresentValueCalculation,
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

export type ICalculationNameString = z.infer<typeof calculationNameStringSchema>;

export type ICalculationNameFormData = z.infer<typeof calculationNameFormDataSchema>;

// Break Even Point Calculator
export type IBreakEvenPointFormData = z.infer<typeof breakEvenPointFormDataSchema>;

export interface BreakEvenPointReportProps extends IBreakEvenPointFormData {
	breakEvenPointUnits: number;
	breakEvenPointMoney: number;
	contributionMarginMoney: number;
	contributionMarginPercent: number;
}

// Markup Calculator
export type IMarkupFormData = z.infer<typeof markupFormDataSchema>;

export interface MarkupReportProps extends IMarkupFormData {
	profit: number;
	markup: number;
}

// Investment Time Calculation
export type IInvestmentTimeFormData = z.infer<typeof investmentTimeFormDataSchema>;

export interface InvestmentTimeReportProps extends IInvestmentTimeFormData {
	yearsRequired: number;
	monthsRequired: number;
	daysRequired: number;
}

// Present Value Calculation
export type IPresentValueFormData = z.infer<typeof presentValueFormDataSchema>;

export interface PresentValueReportProps extends IPresentValueFormData {
	presentValue: number;
}

export type CalculationType =
	| BreakEvenPointCalculation
	| MarkupCalculation
	| InvestmentTimeCalculation
	| PresentValueCalculation;
