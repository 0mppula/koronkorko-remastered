'use client';

import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import useCurrencyStore from '@/hooks/useCurrency';
import { ICompoundInterestTableData } from '@/lib/createCounpoundInterestChartData';
import { cn, formatCurrency } from '@/lib/utils';
import { ReportProps } from './Calculator';

interface BreakdownTableProps extends ReportProps {
	data: ICompoundInterestTableData[];
	breakdownInterval: 'monthly' | 'yearly';
}

const BreakdownTable = ({ data, breakdownInterval, report }: BreakdownTableProps) => {
	const { currency } = useCurrencyStore();

	const isDepositting = report.contributionMultiplier === 1;

	const renderRow = (row: ICompoundInterestTableData) => (
		<TableRow key={row.i + row.contributions}>
			{/* Date interval */}
			<TableCell className="text-center">{row.i}</TableCell>

			{/* Contributions */}
			<TableCell
				className={cn(
					row.contributions > 0 && 'text-success',
					row.contributions < 0 && 'text-destructive'
				)}
			>
				{formatCurrency(row.contributions, currency)}
			</TableCell>

			{/* Interest */}
			<TableCell>{formatCurrency(row.interest, currency)}</TableCell>

			{/* Total contributions */}
			<TableCell
				className={cn(
					row.totalContributions > 0 && 'text-success',
					row.totalContributions < 0 && 'text-destructive'
				)}
			>
				{formatCurrency(row.totalContributions, currency)}
			</TableCell>

			{/* Total interest */}
			<TableCell>{formatCurrency(row.totalInterest, currency)}</TableCell>

			{/* Balance */}
			<TableCell>{formatCurrency(row.balance, currency)}</TableCell>
		</TableRow>
	);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="min-w-[78px]">{`${
						breakdownInterval === 'yearly' ? 'Year' : 'Month'
					}`}</TableHead>
					<TableHead>{`${isDepositting ? 'Deposit' : 'Withdrawal'}`}</TableHead>
					<TableHead>Interest</TableHead>
					<TableHead>{`Total ${isDepositting ? 'Deposits' : 'Withdrawals'}`}</TableHead>
					<TableHead>Total Interest</TableHead>

					<TableHead>Balance</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>{data.slice(0, -1).map((row) => renderRow(row))}</TableBody>

			<TableFooter>{data.slice(-1).map((row) => renderRow(row))}</TableFooter>
		</Table>
	);
};

export default BreakdownTable;
