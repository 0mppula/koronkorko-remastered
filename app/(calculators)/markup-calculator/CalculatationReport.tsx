'use client';

import ReportGroup from '@/components/Report/ReportGroup';
import ReportGroupContainer from '@/components/Report/ReportGroupContainer';
import ReportSpinner from '@/components/Spinners/ReportSpinner';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { MarkupReportProps } from './Calculator';
import ReportSummaryContainer from './ReportSummaryContainer';

interface CalculationReportProps {
	report: MarkupReportProps;
	isLoading?: boolean;
}

const CalculationReport = ({ report, isLoading = false }: CalculationReportProps) => {
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

export default CalculationReport;
