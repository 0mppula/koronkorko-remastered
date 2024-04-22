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

	return { profit, markup };
};

export const calcualteBreakEvenPoint = (
	formData: InferredBreakEvenPointCalculatorSchema
): BreakEvenPointReportProps => {
	const { fixedCosts, variableCostsPerUnit, pricePerUnit } = formData;

	// BEP = Fixed costs / (Sales price per unit – Variable cost per unit)
	const BEP = fixedCosts / (pricePerUnit - variableCostsPerUnit);
	// Break even point in currency
	const BEPM = BEP * pricePerUnit;

	// Contribution margin
	const CM = pricePerUnit - variableCostsPerUnit;
	const CMP = (CM / pricePerUnit) * 100;

	return {
		breakEvenPointUnits: BEP,
		breakEvenPointMoney: BEPM,
		contributionMarginMoney: CM,
		contributionMarginPercent: CMP,
	};
};
