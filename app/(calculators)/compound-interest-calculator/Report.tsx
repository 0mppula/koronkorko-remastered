import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import {
	formatCurrency,
	formatNumber,
	formatPercentage,
	getContributionFrequencyShortLabel,
	getDurationLabel,
} from '@/lib/utils';
import { ReportProps } from './Calculator';

const Report = ({ report }: ReportProps) => {
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
		contributionMultiplier,
		totalReturnPercent,
	} = report;

	return (
		<ReportSection>
			<ReportGroup header="Initial Value" value={formatCurrency(startingBalance, currency)} />

			<ReportGroup
				header="Contributions"
				value={`${formatCurrency(
					contributionMultiplier * contribution,
					currency
				)}/${getContributionFrequencyShortLabel(contributionFrequency)}`}
			/>

			<ReportGroup header="Annual interest rate" value={formatPercentage(interestRate)} />

			<ReportGroup
				header="Duration"
				value={`${formatNumber(duration, 2)} ${getDurationLabel(durationMultiplier)}`}
			/>

			<ReportDivider />

			<ReportGroup
				header={depositting ? 'Total Deposits' : 'Total Withdrawals'}
				value={formatCurrency(Math.abs(additionalContributions), currency)}
			/>

			<ReportGroup
				header="Net Contributions"
				value={formatCurrency(totalContribution, currency)}
			/>

			<ReportGroup header="Total Interest" value={formatCurrency(totalProfit, currency)} />

			<ReportGroup header="Ending Value" value={formatCurrency(futureValue, currency)} />

			<ReportGroup header="Total Return %" value={formatPercentage(totalReturnPercent)} />

			<ReportGroup header="Total Return (APY)" value={formatPercentage(totalReturn)} />
		</ReportSection>
	);
};

export default Report;
