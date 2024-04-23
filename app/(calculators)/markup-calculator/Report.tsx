'use client';

import ReportGroup from '@/components/Report/ReportGroup';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { MarkupReportProps } from '@/types/calculations';
import ReportSummaryContainer from '../../../components/Form/ReportSummaryContainer';

interface ReportProps {
	report: MarkupReportProps;
	isLoading?: boolean;
}

const Report = ({ report, isLoading = false }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const { cost, salesPrice, markup, profit } = report;
	return (
		<ReportSummaryContainer>
			<ReportGroup header="Cost" value={formatCurrency(cost)} />

			<ReportGroup header="Sales Price" value={formatCurrency(salesPrice)} />

			<ReportGroup
				header="Markup"
				value={isFinite(markup) ? formatPercentage(markup) : 'N/A'}
			/>

			<ReportGroup header="Profit" value={formatCurrency(profit, currency)} />
		</ReportSummaryContainer>
	);
};

export default Report;
