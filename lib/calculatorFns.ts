import { BreakEvenPointReportProps } from '@/app/(calculators)/break-even-point-calculator/Calculator';
import { MarkupReportProps } from '@/app/(calculators)/markup-calculator/Calculator';
import {
	InferredBreakEvenPointCalculatorSchema,
	InferredMarkupCalculatorSchema,
} from '@/types/calculations';

export const calculateMarkup = (formData: InferredMarkupCalculatorSchema): MarkupReportProps => {
	const { cost, salesPrice } = formData;

	const profit = salesPrice - cost;
	const markup = (profit / cost) * 100;

	return { cost, salesPrice, profit, markup };
};

export const calcualteBreakEvenPoint = (
	formData: InferredBreakEvenPointCalculatorSchema
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
