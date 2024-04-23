import {
	BreakEvenPointReportProps,
	InferredBreakEvenPointFormDataSchema,
	InferredInvestmentTimeFormDataSchema,
	InferredMarkupFormDataSchema,
	InvestmentTimeReportProps,
	MarkupReportProps,
} from '@/types/calculations';

export const calculateMarkup = (formData: InferredMarkupFormDataSchema): MarkupReportProps => {
	const { cost, salesPrice } = formData;

	const profit = salesPrice - cost;
	const markup = (profit / cost) * 100;

	return { cost, salesPrice, profit, markup };
};

export const calcualteBreakEvenPoint = (
	formData: InferredBreakEvenPointFormDataSchema
): BreakEvenPointReportProps => {
	const { fixedCosts, variableCostPerUnit, pricePerUnit } = formData;

	// BEP = Fixed costs / (Sales price per unit – Variable cost per unit)
	const BEP = fixedCosts / (pricePerUnit - variableCostPerUnit);
	// Break even point in currency
	const BEPM = BEP * pricePerUnit;

	// Contribution margin
	const CM = pricePerUnit - variableCostPerUnit;
	const CMP = (CM / pricePerUnit) * 100;

	return {
		fixedCosts,
		variableCostPerUnit,
		pricePerUnit,
		breakEvenPointUnits: BEP,
		breakEvenPointMoney: BEPM,
		contributionMarginMoney: CM,
		contributionMarginPercent: CMP,
	};
};

export const calculateInvestmentTime = (
	formData: InferredInvestmentTimeFormDataSchema
): InvestmentTimeReportProps => {
	const { startingBalance, endingBalance, annualInterestRate } = formData;

	const r = annualInterestRate / 100;
	const T = Math.log(endingBalance / startingBalance) / Math.log(1 + r);

	return {
		startingBalance,
		endingBalance,
		annualInterestRate,
		yearsRequired: T,
		monthsRequired: T * 12,
		daysRequired: T * 365,
	};
};