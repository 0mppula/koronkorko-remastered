import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency, formatPercentage, getCurrencySymbol, getDurationLabel } from '@/lib/utils';
import { AnnualizedReturnReportProps } from '@/types/calculations';
import ReportSummaryContainer from '../../../components/Form/ReportSummaryContainer';

interface ReportProps {
	report: AnnualizedReturnReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const {
		startingBalance,
		endingBalance,
		duration,
		durationMultiplier,
		annualizedReturn,
		percentReturn,
	} = report;

	return (
		<ReportSummaryContainer>
			<ReportGroup header="Initial Value" value={formatCurrency(startingBalance, currency)} />

			<ReportGroup header="Ending Value" value={formatCurrency(endingBalance, currency)} />

			<ReportGroup
				fullWidth
				header="Duration"
				value={`${duration.toFixed(2)} ${getDurationLabel(durationMultiplier)}`}
			/>

			<ReportDivider />

			<ReportGroup
				header={`Total Return ${getCurrencySymbol(currency)}`}
				value={formatCurrency(endingBalance - startingBalance, currency)}
			/>

			<ReportGroup header="Total Return %" value={formatPercentage(percentReturn)} />

			<ReportGroup
				header="Annualized Return"
				value={isFinite(annualizedReturn) ? formatPercentage(annualizedReturn) : 'N/A'}
			/>
		</ReportSummaryContainer>
	);
};

export default Report;
