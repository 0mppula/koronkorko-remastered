import ReportDivider from '@/components/Report/ReportDivider';
import ReportGroup from '@/components/Report/ReportGroup';
import ReportSection from '@/components/Report/ReportSection';
import useCurrencyStore from '@/hooks/useCurrency';
import { formatCurrency } from '@/lib/utils';
import { EnterpriseValueReportProps } from '@/types/calculations';

interface ReportProps {
	report: EnterpriseValueReportProps;
}

const Report = ({ report }: ReportProps) => {
	const { currency } = useCurrencyStore();

	const { sharePrice, sharesOutstanding, cash, debt, enterpriseValue, marketCap } = report;

	return (
		<ReportSection>
			<ReportGroup header="Share Price" value={formatCurrency(sharePrice, currency)} />

			<ReportGroup header="Shares Outstanding" value={String(sharesOutstanding)} />

			<ReportGroup header="Total Cash" value={formatCurrency(cash, currency)} />

			<ReportGroup header="Total Debt" value={formatCurrency(debt, currency)} />

			<ReportDivider />

			<ReportGroup
				header="Market Capitalization"
				value={formatCurrency(marketCap, currency)}
			/>

			<ReportGroup
				header="Enterprise value"
				value={formatCurrency(enterpriseValue, currency)}
			/>
		</ReportSection>
	);
};

export default Report;
