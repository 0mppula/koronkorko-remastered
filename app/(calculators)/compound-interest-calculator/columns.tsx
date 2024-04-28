'use client';

import useCurrencyStore from '@/hooks/useCurrency';
import { ICompoundInterestTableData } from '@/lib/createCounpoundInterestChartData';
import { formatCurrency } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<ICompoundInterestTableData>[] = [
	{
		accessorKey: 'i',
		header: 'Year',
		cell: ({ row }) => {
			const val = parseFloat(row.getValue('i'));

			return <div className="text-right font-medium">{val}</div>;
		},
	},
	{
		accessorKey: 'contributions',
		header: 'Deposits',
		cell: ({ row }) => {
			const { currency } = useCurrencyStore();

			const val = parseFloat(row.getValue('totalContributions'));
			const formattedVal = formatCurrency(val, currency);

			return <div className="text-right font-medium">{formattedVal}</div>;
		},
	},
	{
		accessorKey: 'interest',
		header: 'Interest',
		cell: ({ row }) => {
			const { currency } = useCurrencyStore();
			const val = parseFloat(row.getValue('totalContributions'));

			return <div className="text-right font-medium">{'#'}</div>;
		},
	},
	{
		accessorKey: 'totalContributions',
		header: 'Total Deposits',
	},
	{
		accessorKey: 'totalInterest',
		header: 'Total Interest',
		cell: ({ row }) => {
			const { currency } = useCurrencyStore();
			const val = parseFloat(row.getValue('totalContributions'));
			const formattedVal = formatCurrency(val, currency);

			return <div className="text-right font-medium">{formattedVal}</div>;
		},
	},
	{
		accessorKey: 'balance',
		header: 'Balance',
	},
];
