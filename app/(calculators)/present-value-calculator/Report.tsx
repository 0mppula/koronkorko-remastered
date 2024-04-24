'use client';

import ReportGroup from '@/components/Report/ReportGroup';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage, getDurationLabel } from '@/lib/utils';
import { PresentValueReportProps } from '@/types/calculations';
import ReportSummaryContainer from '../../../components/Form/ReportSummaryContainer';

interface ReportProps {
	report: PresentValueReportProps;
	isLoading?: boolean;
}

const Report = ({ report, isLoading = false }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const { startingBalance, discountRate, duration, durationMultiplier, presentValue } = report;

	return (
		<ReportSummaryContainer>
			<ReportGroup header="Future Value" value={formatCurrency(startingBalance, currency)} />

			<ReportGroup header="Discount Rate" value={formatPercentage(discountRate)} />

			<ReportGroup
				fullWidth
				header="Duration"
				value={`${duration.toFixed(2)} ${getDurationLabel(durationMultiplier)}`}
			/>

			<ReportGroup header="Present Value" value={formatCurrency(presentValue, currency)} />
		</ReportSummaryContainer>
	);
};

export default Report;
