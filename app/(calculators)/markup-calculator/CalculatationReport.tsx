'use client';

import ReportGroup from '@/components/Report/ReportGroup';
import ReportGroupContainer from '@/components/Report/ReportGroupContainer';
import ReportSpinner from '@/components/Spinners/ReportSpinner';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { ReportProps } from './Calculator';
import ReportSummaryContainer from './ReportSummaryContainer';

interface CalculatationReportProps {
	report: ReportProps;
	isLoading?: boolean;
}

const CalculatationReport = ({ report, isLoading = false }: CalculatationReportProps) => {
	const { currency } = useCurrencyStore();

	const { markup, profit } = report;
	return (
		<ReportSummaryContainer>
			{isLoading ? (
				<ReportSpinner />
			) : (
				<ReportGroupContainer>
					<ReportGroup
						header="Markup"
						value={isFinite(markup) ? formatPercentage(markup) : 'N/A'}
					/>

					<ReportGroup header="Profit" value={formatCurrency(profit, currency)} />
				</ReportGroupContainer>
			)}
		</ReportSummaryContainer>
	);
};

export default CalculatationReport;
