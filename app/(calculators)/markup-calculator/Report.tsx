'use client';

import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { MarkupReportProps } from '@/types/calculations';

interface ReportProps {
	report: MarkupReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const { cost, salesPrice, markup, profit } = report;
	return (
		<ReportSection>
			<ReportGroup header="Cost" value={formatCurrency(cost, currency)} />

			<ReportGroup header="Sales Price" value={formatCurrency(salesPrice, currency)} />

			<ReportDivider />

			<ReportGroup
				header="Markup"
				value={isFinite(markup) ? formatPercentage(markup) : 'N/A'}
			/>

			<ReportGroup header="Profit" value={formatCurrency(profit, currency)} />
		</ReportSection>
	);
};

export default Report;
