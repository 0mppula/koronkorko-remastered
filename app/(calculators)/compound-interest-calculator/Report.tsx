import ReportGroup from '@/components/Report/ReportGroup';
import useCurrencyStore from '@/hooks/useCurrency';
import {
	formatCurrency,
	formatPercentage,
	getContributionFrequencyShortLabel,
	getDurationLabel,
} from '@/lib/utils';
import { CompoundInterestReportProps } from '@/types/calculations';
import ReportSummaryContainer from '../../../components/Form/ReportSummaryContainer';

interface ReportProps {
	report: CompoundInterestReportProps;
	isLoading?: boolean;
}

const Report = ({ report, isLoading = false }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const {
		startingBalance,
		contribution,
		contributionFrequency,
		interestRate,
		duration,
		durationMultiplier,
		totalContribution,
		futureValue,
		totalProfit,
		totalReturn,
		additionalContributions,
		depositting,
		totalReturnPercent,
	} = report;

	return (
		<ReportSummaryContainer isLoading={isLoading}>
			<ReportGroup header="Initial Value" value={formatCurrency(startingBalance, currency)} />

			<ReportGroup
				header="Contributions"
				value={`${formatCurrency(
					contribution,
					currency
				)}/${getContributionFrequencyShortLabel(contributionFrequency)}`}
			/>

			<ReportGroup header="Annual interest rate" value={formatPercentage(interestRate)} />

			<ReportGroup
				header="Duration"
				value={`${duration.toFixed(2)} ${getDurationLabel(durationMultiplier)}`}
			/>

			<ReportGroup
				header={depositting ? 'Total Contributions' : 'Total Withdrawals'}
				value={formatCurrency(additionalContributions, currency)}
			/>

			<ReportGroup
				header="Net Contributions"
				value={formatCurrency(totalContribution, currency)}
			/>

			<ReportGroup header="Total Interest" value={formatCurrency(totalProfit, currency)} />

			<ReportGroup header="Total Return %" value={formatPercentage(totalReturnPercent)} />

			<ReportGroup header="Ending Value" value={formatCurrency(futureValue, currency)} />

			<ReportGroup header="Total Return (APY)" value={formatPercentage(totalReturn)} />
		</ReportSummaryContainer>
	);
};

export default Report;
