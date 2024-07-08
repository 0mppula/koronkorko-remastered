'use client';

import ReportSummaryContainer from '@/components/Form/ReportSummaryContainer';
import ReportGroup from '@/components/Report/ReportGroup';
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
		<ReportSummaryContainer>
			<ReportGroup header="Share Price" value={formatCurrency(sharePrice, currency)} />

			<ReportGroup
				header="Earnings per Share"
				value={formatCurrency(earningsPerShare, currency)}
			/>

			<ReportGroup
				header="P/E Ratio"
				value={isFinite(peRatio) ? peRatio.toFixed(2) : 'N/A'}
			/>
		</ReportSummaryContainer>
	);
};

export default Report;
