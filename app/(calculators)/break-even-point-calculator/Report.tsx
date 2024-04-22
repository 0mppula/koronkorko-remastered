'use client';

import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportGroupContainer from '@/components/Report/ReportGroupContainer';
import ReportSpinner from '@/components/Spinners/ReportSpinner';
import { currencies } from '@/constants/data';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { BreakEvenPointReportProps } from './Calculator';

interface ReportProps {
	report: BreakEvenPointReportProps;
	isLoading?: boolean;
}

const Report = ({ report, isLoading = false }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const {
		fixedCosts,
		pricePerUnit,
		variableCostPerUnit,
		breakEvenPointMoney,
		breakEvenPointUnits,
		contributionMarginMoney,
		contributionMarginPercent,
	} = report;

	return (
		<ReportSummaryContainer>
			{isLoading ? (
				<ReportSpinner />
			) : (
				<ReportGroupContainer>
					<ReportGroup
						header="Fixed Costs"
						value={formatCurrency(fixedCosts, currency)}
					/>

					<ReportGroup
						header="Variable Cost Per Unit"
						value={formatCurrency(pricePerUnit, currency)}
					/>

					<ReportGroup
						fullWidth
						header="Price Per Unit"
						value={formatCurrency(variableCostPerUnit, currency)}
					/>

					<ReportGroup
						header="Break Even Point (Unit)"
						value={
							isFinite(breakEvenPointUnits) ? breakEvenPointUnits.toFixed(2) : 'N/A'
						}
					/>

					<ReportGroup
						header="Break Even Point Revenue"
						value={
							isFinite(breakEvenPointUnits)
								? formatCurrency(breakEvenPointMoney, currency)
								: 'N/A'
						}
					/>

					<ReportGroup
						header="Contribution Margin %"
						value={formatPercentage(contributionMarginPercent)}
					/>

					<ReportGroup
						header={`Contribution Margin ${
							currencies.find((c) => c.value === currency)?.symbol
						}`}
						value={formatCurrency(contributionMarginMoney, currency)}
					/>
				</ReportGroupContainer>
			)}
		</ReportSummaryContainer>
	);
};

export default Report;
