'use client';

import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage, getContributionFrequencyLabel } from '@/lib/utils';
import { DividendYieldReportProps } from '@/types/calculations';

interface ReportProps {
	report: DividendYieldReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const {
		distributionFrequency,
		dividendAmount,
		annualizedDividend,
		dividendYieldPercent,
		sharePrice,
	} = report;

	return (
		<ReportSection>
			<ReportGroup
				header="Dividend Amount"
				value={formatCurrency(dividendAmount, currency)}
			/>

			<ReportGroup
				header="Distribution Frequency"
				value={getContributionFrequencyLabel(distributionFrequency)}
			/>

			<ReportGroup header="Share Price" value={formatCurrency(sharePrice, currency)} />

			<ReportDivider />

			<ReportGroup
				header="Annualized Dividend"
				value={formatCurrency(annualizedDividend, currency)}
			/>

			<ReportGroup header="Dividend Yield %" value={formatPercentage(dividendYieldPercent)} />
		</ReportSection>
	);
};

export default Report;
