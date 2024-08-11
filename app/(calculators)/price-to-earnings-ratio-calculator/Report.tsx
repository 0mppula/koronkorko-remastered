'use client';

import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency } from '@/lib/utils';
import { PriceToEarningsRatioReportProps } from '@/types/calculations';

interface ReportProps {
	report: PriceToEarningsRatioReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const { sharePrice, earningsPerShare, peRatio } = report;

	return (
		<ReportSection>
			<ReportGroup header="Share Price" value={formatCurrency(sharePrice, currency)} />

			<ReportGroup
				header="Earnings per Share"
				value={formatCurrency(earningsPerShare, currency)}
			/>

			<ReportDivider />

			<ReportGroup
				header="P/E Ratio"
				value={isFinite(peRatio) ? peRatio.toFixed(2) : 'N/A'}
			/>
		</ReportSection>
	);
};

export default Report;
