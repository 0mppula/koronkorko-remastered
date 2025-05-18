'use client';

import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { LiquidationPriceReportProps } from '@/types/calculations';

interface ReportProps {
	report: LiquidationPriceReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const { entryPrice, leverageRatio, liquidationPrice, priceChangePercent } = report;
	return (
		<ReportSection>
			<ReportGroup header="Entry Price" value={formatCurrency(entryPrice, currency)} />

			<ReportGroup header="Leverage Ratio" value={`${formatNumber(leverageRatio, 2)}`} />

			<ReportDivider />

			<ReportGroup
				header="Liquidation Price"
				value={formatCurrency(liquidationPrice, currency)}
			/>

			<ReportGroup
				header="Price Change %"
				value={isFinite(priceChangePercent) ? formatPercentage(priceChangePercent) : 'N/A'}
			/>
		</ReportSection>
	);
};

export default Report;
