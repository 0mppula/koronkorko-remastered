'use client';

import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage, getDurationLabel } from '@/lib/utils';
import { PresentValueReportProps } from '@/types/calculations';

interface ReportProps {
	report: PresentValueReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const { startingBalance, discountRate, duration, durationMultiplier, presentValue } = report;

	return (
		<ReportSection>
			<ReportGroup header="Future Value" value={formatCurrency(startingBalance, currency)} />

			<ReportGroup header="Discount Rate" value={formatPercentage(discountRate)} />

			<ReportGroup
				fullWidth
				header="Duration"
				value={`${duration.toFixed(2)} ${getDurationLabel(durationMultiplier)}`}
			/>

			<ReportDivider />

			<ReportGroup header="Present Value" value={formatCurrency(presentValue, currency)} />

			<ReportGroup
				header="Total Interest"
				value={formatCurrency(startingBalance - presentValue, currency)}
			/>
		</ReportSection>
	);
};

export default Report;
