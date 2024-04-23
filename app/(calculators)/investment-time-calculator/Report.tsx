'use client';

import ReportGroup from '@/components/Report/ReportGroup';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { InvestmentTimeReportProps } from '@/types/calculations';
import ReportSummaryContainer from '../../../components/Form/ReportSummaryContainer';

interface ReportProps {
	report: InvestmentTimeReportProps;
	isLoading?: boolean;
}

const Report = ({ report, isLoading = false }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const {
		startingBalance,
		endingBalance,
		annualInterestRate,
		yearsRequired,
		monthsRequired,
		daysRequired,
	} = report;

	return (
		<ReportSummaryContainer>
			<ReportGroup
				header="Starting Value"
				value={formatCurrency(startingBalance, currency)}
			/>

			<ReportGroup header="Future Value" value={formatCurrency(endingBalance, currency)} />

			<ReportGroup
				fullWidth
				header="Annual interest rate"
				value={formatPercentage(annualInterestRate)}
			/>

			<ReportGroup
				header="Years required"
				value={isFinite(yearsRequired) ? yearsRequired.toFixed(2) : 'N/A'}
			/>

			<ReportGroup
				header="Months required"
				value={isFinite(yearsRequired) ? monthsRequired.toFixed(2) : 'N/A'}
			/>

			<ReportGroup
				header="Days required"
				value={isFinite(yearsRequired) ? daysRequired.toFixed(2) : 'N/A'}
			/>
		</ReportSummaryContainer>
	);
};

export default Report;
