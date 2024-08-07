import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import useCurrencyStore from '@/hooks/useCurrency';
import {
	formatCurrency,
	formatPercentage,
	getCurrencySymbol,
	getDepositFrequencyShortLabel,
	getDurationLabel,
} from '@/lib/utils';
import ReportSummaryContainer from '../../../components/Form/ReportSummaryContainer';
import { ReportProps } from './Calculator';

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const {
		deposit,
		depositFrequency,
		dollarCostAverage,
		duration,
		durationMultiplier,
		initialInvestment,
		interestRate,
		totalReturnPercent,
		sharePrice,
		totalInvested,
		newSharePrice,
		totalShares,
		totalReturn,
		endingValue,
		AbosluteReturnPercent,
	} = report;

	return (
		<ReportSummaryContainer className="mb-12">
			<ReportGroup
				header="Initial Investment"
				value={formatCurrency(initialInvestment, currency)}
			/>

			<ReportGroup
				header="Initial Share Price"
				value={formatCurrency(sharePrice, currency)}
			/>

			<ReportGroup
				header="Deposits"
				value={`${formatCurrency(deposit, currency)}/${getDepositFrequencyShortLabel(
					depositFrequency
				)}`}
			/>

			<ReportGroup header="Annual interest rate" value={formatPercentage(interestRate)} />

			<ReportGroup
				fullWidth
				header="Duration"
				value={`${duration.toFixed(2)} ${getDurationLabel(durationMultiplier)}`}
			/>

			<ReportDivider />

			<ReportGroup header="Total Invested" value={formatCurrency(totalInvested)} />

			<ReportGroup header="Ending Value" value={formatCurrency(endingValue)} />

			<ReportGroup
				header={`Total Return ${getCurrencySymbol(currency)}`}
				value={formatCurrency(totalReturn)}
			/>

			<ReportGroup header="Total Return %" value={formatPercentage(totalReturnPercent)} />

			<ReportGroup header="Dollar Cost Average" value={formatCurrency(dollarCostAverage)} />

			<ReportGroup header="Total Shares" value={totalShares.toFixed(2)} />

			<ReportGroup header="Ending Share Price" value={formatCurrency(newSharePrice)} />

			<ReportGroup header="Price Change %" value={formatPercentage(AbosluteReturnPercent)} />
		</ReportSummaryContainer>
	);
};

export default Report;
