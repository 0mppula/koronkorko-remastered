'use client';

import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { InvestmentTimeReportProps } from '@/types/calculations';

interface ReportProps {
	report: InvestmentTimeReportProps;
}

const Report = ({ report }: ReportProps) => {
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
		<ReportSection>
			<ReportGroup header="Initial Value" value={formatCurrency(startingBalance, currency)} />

			<ReportGroup header="Ending Value" value={formatCurrency(endingBalance, currency)} />

			<ReportGroup
				header="Annual interest rate"
				value={formatPercentage(annualInterestRate)}
			/>

			<ReportDivider />

			<ReportGroup
				header="Total Interest"
				value={formatCurrency(endingBalance - startingBalance, currency)}
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
		</ReportSection>
	);
};

export default Report;
